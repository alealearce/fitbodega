-- Deal Radar — weekly pipeline that finds active fitness brand deal/collab
-- opportunities, stores them, and publishes an approved digest as an email
-- plus a blog post at /deals/[week-slug].
--
-- All tables are service-role only. Public pages render server-side through
-- the admin client; nothing here is readable with the anon key.

-- ── Weekly digests ────────────────────────────────────────────────────────────
-- One row per week. Opportunities hang off it via week_id.
-- status: draft (collected, awaiting review) -> approved (user hit approve)
--         -> published (email sent + post live). Nothing sends before approve.
create table if not exists dr_weekly_digests (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  week_slug    text not null unique,          -- e.g. '2026-08-10'
  status       text not null default 'draft'
               check (status in ('draft', 'approved', 'published')),
  intro_copy   text,                          -- user writes/edits in the draft step
  published_at timestamptz,
  post_url     text
);

create index if not exists dr_digests_status_idx on dr_weekly_digests (status);

-- ── Opportunities ─────────────────────────────────────────────────────────────
-- One row per deduped brand opportunity. A brand seen by several sources keeps
-- one row; the normalizer boosts its score and updates last_seen_at.
create table if not exists dr_opportunities (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),

  brand_name        text not null,
  brand_domain      text,                     -- normalized: lowercase, no www
  source_type       text not null
                    check (source_type in ('spend_signal', 'listed_deal')),
  source            text not null,            -- fetcher id: 'pitchlo', 'casting_boards', 'spend_signals', 'ad_library'
  source_url        text,
  offer_type        text
                    check (offer_type in ('paid', 'gifted', 'commission', 'unknown')),
  compensation_text text,                     -- verbatim comp line if listed
  deliverables      text,
  platforms         text[] not null default '{}',
  active_ad_count   integer,                  -- spend_signal only: matching active ad variants
  meta              jsonb not null default '{}'::jsonb,  -- source-specific extras (ad copy samples, dates)

  fingerprint       text not null,            -- brand_domain + offer fingerprint; dedupe key
  score             integer not null default 0
                    check (score between 0 and 100),
  score_breakdown   jsonb not null default '{}'::jsonb,  -- per-factor points, for tuning weights

  first_seen_at     timestamptz not null default now(),
  last_seen_at      timestamptz not null default now(),
  status            text not null default 'new'
                    check (status in ('new', 'included', 'skipped', 'expired')),
  week_id           uuid references dr_weekly_digests (id) on delete set null
);

create unique index if not exists dr_opportunities_fingerprint_idx on dr_opportunities (fingerprint);
create index if not exists dr_opportunities_week_idx on dr_opportunities (week_id);
create index if not exists dr_opportunities_status_idx on dr_opportunities (status);
create index if not exists dr_opportunities_brand_domain_idx on dr_opportunities (brand_domain);

-- ── Subscribers ───────────────────────────────────────────────────────────────
-- Separate list from newsletter_subscribers on purpose: Deal Radar consent is
-- its own CASL basis. Double opt-in: rows start 'pending' and only become
-- 'active' after the confirm link is clicked. Only 'active' rows ever get email.
create table if not exists dr_subscribers (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  email             text not null unique,
  status            text not null default 'pending'
                    check (status in ('pending', 'active', 'unsubscribed')),
  source            text not null default 'site'
                    check (source in ('site', 'manual')),
  confirmed_at      timestamptz,
  confirm_token     text not null default gen_random_uuid()::text,
  unsubscribe_token text not null default gen_random_uuid()::text
);

create index if not exists dr_subscribers_status_idx on dr_subscribers (status);
create index if not exists dr_subscribers_confirm_token_idx on dr_subscribers (confirm_token);
create index if not exists dr_subscribers_unsub_token_idx on dr_subscribers (unsubscribe_token);

-- ── Per-subscriber send log ───────────────────────────────────────────────────
-- One row per subscriber per digest send attempt, written by the publish path.
create table if not exists dr_email_log (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  digest_id     uuid not null references dr_weekly_digests (id) on delete cascade,
  subscriber_id uuid not null references dr_subscribers (id) on delete cascade,
  status        text not null check (status in ('sent', 'failed')),
  error         text
);

create index if not exists dr_email_log_digest_idx on dr_email_log (digest_id);

-- ── Source configs ────────────────────────────────────────────────────────────
-- Key/value jsonb: keyword sets, per-source toggles, scoring weights.
-- Code reads these at run time so tuning needs no deploy.
create table if not exists dr_source_configs (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

insert into dr_source_configs (key, value) values
  ('keywords', '["pre-workout", "protein", "activewear", "fitness app", "supplement", "creatine", "gym wear", "recovery", "wearable"]'::jsonb),
  ('sources', '{"pitchlo": true, "casting_boards": true, "spend_signals": true, "ad_library": false}'::jsonb),
  ('scoring_weights', '{
    "active_ad_count":       { "max_points": 35, "per_ad": 5 },
    "recency":               { "max_points": 25, "full_points_days": 7, "zero_points_days": 30 },
    "compensation_listed":   { "points": 20 },
    "niche_match":           { "max_points": 20, "per_keyword": 10 }
  }'::jsonb)
on conflict (key) do nothing;

-- ── Run log ───────────────────────────────────────────────────────────────────
-- One row per source per collection run. A failing source logs here and the
-- run continues.
create table if not exists dr_runs (
  id          uuid primary key default gen_random_uuid(),
  started_at  timestamptz not null default now(),
  finished_at timestamptz,
  source      text not null,
  items_found integer not null default 0,
  errors      jsonb not null default '[]'::jsonb,
  duration_ms integer,
  ok          boolean not null default false
);

create index if not exists dr_runs_started_idx on dr_runs (started_at desc);

-- ── RLS: service role only, everywhere ────────────────────────────────────────
alter table dr_weekly_digests enable row level security;
alter table dr_opportunities  enable row level security;
alter table dr_subscribers    enable row level security;
alter table dr_email_log      enable row level security;
alter table dr_source_configs enable row level security;
alter table dr_runs           enable row level security;

create policy "Service role has full access to dr_weekly_digests"
  on dr_weekly_digests for all using (auth.role() = 'service_role');
create policy "Service role has full access to dr_opportunities"
  on dr_opportunities for all using (auth.role() = 'service_role');
create policy "Service role has full access to dr_subscribers"
  on dr_subscribers for all using (auth.role() = 'service_role');
create policy "Service role has full access to dr_email_log"
  on dr_email_log for all using (auth.role() = 'service_role');
create policy "Service role has full access to dr_source_configs"
  on dr_source_configs for all using (auth.role() = 'service_role');
create policy "Service role has full access to dr_runs"
  on dr_runs for all using (auth.role() = 'service_role');
