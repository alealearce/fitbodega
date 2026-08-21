-- Mon/Wed Top-100 spotlight posts join the social publish log.
-- Top-100 entries live in JSON, not in a table, so ref_id (uuid) goes
-- nullable; the spotlight's idempotency key is ref_slug = '<list>#<rank>'.
alter table public.social_posts
  drop constraint if exists social_posts_kind_check;
alter table public.social_posts
  add constraint social_posts_kind_check
  check (kind in ('blog', 'showcase', 'story', 'top100'));
alter table public.social_posts
  alter column ref_id drop not null;

create index if not exists social_posts_ref_slug_idx
  on public.social_posts (kind, ref_slug, platform);
