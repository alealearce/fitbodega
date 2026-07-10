-- Social automation: daily blog-digest + listing-showcase posting via Blotato.
-- Adds a publish log (idempotency + audit) and a rotation marker on listings.

-- Rotation marker: when a listing was last featured on social. NULL = never.
alter table public.listings
  add column if not exists last_featured_at timestamptz;

create index if not exists listings_last_featured_idx
  on public.listings (last_featured_at nulls first);

-- Publish log. One row per (post, platform) attempt. A 'published' row blocks
-- re-posting the same blog post to the same platform (idempotent re-runs).
create table if not exists public.social_posts (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  kind          text not null check (kind in ('blog', 'showcase')),
  ref_id        uuid not null,                 -- blog_posts.id or listings.id
  ref_slug      text,
  platform      text not null,                 -- instagram | facebook | linkedin
  external_id   text,
  caption       text,
  image_urls    jsonb,
  status        text not null check (status in ('published', 'failed')),
  error_message text
);

create index if not exists social_posts_lookup_idx
  on public.social_posts (kind, ref_id, platform);

create index if not exists social_posts_recent_idx
  on public.social_posts (kind, status, created_at desc);

-- Service-role only (cron writes these); no public access.
alter table public.social_posts enable row level security;
