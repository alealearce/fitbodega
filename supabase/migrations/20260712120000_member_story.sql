-- Member Spotlight pipeline: story answers collected at submission (and
-- editable from the dashboard) feed an auto-published Journal post + social
-- carousel when the listing is approved. Mirrors the YFN founder-story schema.

alter table public.listings
  add column if not exists founder_story jsonb;
-- {origin, leap, hard_truth, train_with, why_you, feeling}

alter table public.listings
  add column if not exists founder_images text[] default '{}';

alter table public.listings
  add column if not exists story_opt_out boolean not null default false;

-- Set once the spotlight post is published; doubles as the idempotency check.
alter table public.listings
  add column if not exists story_post_id uuid references public.blog_posts(id);

-- Allow the new social publish-log kind.
alter table public.social_posts drop constraint if exists social_posts_kind_check;
alter table public.social_posts add constraint social_posts_kind_check
  check (kind in ('blog', 'showcase', 'story'));
