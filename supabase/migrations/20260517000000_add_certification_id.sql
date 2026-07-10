-- Adds certification_id for coach/trainer credentials (CSCS, kinesiology, NCCP, etc.)
-- for listings that hold a professional certification (e.g. a trainer or
-- nutrition credential). Used to award a "Certified" badge.
alter table public.listings
  add column if not exists certification_id text;

create index if not exists listings_ya_idx
  on public.listings (certification_id)
  where certification_id is not null;
