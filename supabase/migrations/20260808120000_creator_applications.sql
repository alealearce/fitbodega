-- Creator applications — the /creators "Apply to join" form. Standalone
-- queue reviewed by hand; approval flows (ranking, Journal profile, deals)
-- happen off-table for now.

create table creator_applications (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),

  name            text not null,
  email           text not null,
  platform        text not null,          -- 'Instagram', 'TikTok', 'YouTube', 'X / Twitter', 'Other'
  handle          text not null,
  follower_range  text not null,          -- '5K–25K', '25K–100K', '100K–500K', '500K+'
  niche           text not null,
  has_brand_deals boolean not null default false,
  best_post_url   text not null,

  status          text not null default 'pending'
                  check (status in ('pending', 'approved', 'rejected'))
);

create index creator_applications_status_idx on creator_applications (status);

-- Service-role only — no client policies. The public form posts through
-- /api/creators/apply which uses the admin client server-side.
alter table creator_applications enable row level security;
