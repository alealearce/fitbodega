-- Creator Spotlight — the creator-network twin of the listing Member Spotlight.
--
-- A creator with a profile signs in (same email) and answers CREATOR_QUESTIONS
-- + uploads photos from the dashboard. Admin publishes it by hand from the
-- Creators tab: a Journal post + carousel across the social accounts, then
-- spotlight_post_id locks it (idempotent, same as listings.story_post_id).

alter table public.creator_profiles
  add column if not exists spotlight_story   jsonb,
  add column if not exists spotlight_images  text[] not null default '{}',
  add column if not exists spotlight_opt_out boolean not null default false,
  add column if not exists spotlight_post_id uuid references public.blog_posts(id) on delete set null,
  -- Set the first time the creator saves from the dashboard; links the
  -- token-keyed profile to the auth account that shares its email.
  add column if not exists user_id          uuid references auth.users(id) on delete set null;

create index if not exists creator_profiles_user_idx on public.creator_profiles (user_id);
