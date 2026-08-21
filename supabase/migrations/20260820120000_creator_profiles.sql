-- Creator network profiles — step 2 of the creator flow.
--
-- Step 1 is the Deal Radar email (dr_subscribers, double opt-in). That alone
-- is a complete action: the address gets the weekly email whether or not a
-- profile follows. A row here means the creator finished step 2, which is
-- what makes them visible to brands at /creators/network and eligible for
-- the FitBodega 100. No auth account is involved — the profile is keyed to
-- the email captured in step 1 and edited through a token link.

create table if not exists creator_profiles (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  email            text not null unique,
  name             text not null,
  niche            text not null,          -- discipline, free text
  location         text,                   -- optional, city or region
  audience_size    text not null,          -- range label, see lib/config/site.ts
  primary_platform text not null,          -- 'Instagram' | 'TikTok' | ...

  instagram        text,
  tiktok           text,
  youtube          text,
  website          text,
  content_examples text[] not null default '{}',   -- up to 3 post URLs
  note             text,                   -- one line: what they make

  -- 'live' rows show in the public browse. 'hidden' is the moderation lever
  -- (spam, or a creator asking to come off the list) — set by hand.
  status           text not null default 'live'
                   check (status in ('live', 'hidden')),
  edit_token       text not null default gen_random_uuid()::text,
  subscriber_id    uuid references dr_subscribers (id) on delete set null
);

create index if not exists creator_profiles_status_idx on creator_profiles (status);
create index if not exists creator_profiles_edit_token_idx on creator_profiles (edit_token);
create index if not exists creator_profiles_created_idx on creator_profiles (created_at desc);

-- Service-role only. The public form posts through /api/creators/profile and
-- the browse page reads with the admin client, selecting public columns only.
alter table creator_profiles enable row level security;

create policy "Service role has full access to creator_profiles"
  on creator_profiles for all using (auth.role() = 'service_role');
