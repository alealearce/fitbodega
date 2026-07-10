-- ============================================================
-- FitBodega — Supabase Schema
-- Run this in your Supabase SQL Editor (dashboard.supabase.com)
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm"; -- for fast text search

-- ── Enums ────────────────────────────────────────────────────────────────────
create type listing_type   as enum ('gym', 'trainer', 'recovery', 'club', 'nutritionist', 'store', 'youth');
create type listing_status as enum ('pending', 'approved', 'rejected');
create type listing_plan   as enum ('free', 'verified', 'pro');

-- ── Profiles ─────────────────────────────────────────────────────────────────
create table profiles (
  id           uuid primary key references auth.users on delete cascade,
  created_at   timestamptz not null default now(),
  email        text,
  full_name    text,
  avatar_url   text
);

alter table profiles enable row level security;

create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Listings ──────────────────────────────────────────────────────────────────
create table listings (
  id                      uuid primary key default gen_random_uuid(),
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),

  -- Identity
  name                    text not null,
  slug                    text not null unique,
  type                    listing_type not null,
  tagline                 text,
  description             text,
  long_description        text,

  -- Media
  logo_url                text,
  images                  text[] default '{}',

  -- Contact
  website                 text,
  email                   text,
  phone                   text,

  -- Location (global)
  address                 text,
  city                    text,
  country                 text,
  latitude                double precision,
  longitude               double precision,

  -- Listing attributes
  specialties             text[] default '{}',
  experience_levels       text[] default '{}',
  languages               text[] default '{}',
  price_range             text,

  -- Social
  social_instagram        text,
  social_facebook         text,
  social_youtube          text,
  social_tiktok           text,

  -- Admin
  status                  listing_status not null default 'pending',
  is_featured             boolean not null default false,
  is_verified             boolean not null default false,
  owner_id                uuid references auth.users on delete set null,

  -- Analytics
  view_count              integer not null default 0,

  -- Ratings (denormalized for performance)
  rating_avg              numeric(3,2),
  rating_count            integer not null default 0,

  -- Billing (for future Stripe integration)
  stripe_customer_id      text,
  stripe_subscription_id  text,
  plan                    listing_plan not null default 'free',
  plan_expires_at         timestamptz
);

-- Indexes
create index listings_type_idx       on listings (type);
create index listings_status_idx     on listings (status);
create index listings_country_idx    on listings (country);
create index listings_city_idx       on listings (city);
create index listings_owner_idx      on listings (owner_id);
create index listings_featured_idx   on listings (is_featured, status);
create index listings_slug_idx       on listings (slug);
create index listings_name_search    on listings using gin (name gin_trgm_ops);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger listings_updated_at
  before update on listings
  for each row execute function update_updated_at();

-- RLS
alter table listings enable row level security;

create policy "Anyone can view approved listings"
  on listings for select
  using (status = 'approved');

create policy "Owners can view own listings"
  on listings for select
  using (auth.uid() = owner_id);

create policy "Owners can update own listings"
  on listings for update
  using (auth.uid() = owner_id);

create policy "Anyone can insert a listing (submit form)"
  on listings for insert
  with check (true);

create policy "Service role has full access"
  on listings for all
  using (auth.role() = 'service_role');

-- ── Reviews ───────────────────────────────────────────────────────────────────
create table reviews (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  listing_id  uuid not null references listings on delete cascade,
  user_id     uuid references auth.users on delete set null,
  user_name   text not null,
  rating      integer not null check (rating between 1 and 5),
  body        text,
  is_approved boolean not null default false
);

create index reviews_listing_idx on reviews (listing_id);
create index reviews_approved_idx on reviews (listing_id, is_approved);

alter table reviews enable row level security;

create policy "Anyone can view approved reviews"
  on reviews for select
  using (is_approved = true);

create policy "Authenticated users can insert reviews"
  on reviews for insert
  with check (auth.uid() is not null);

create policy "Service role has full access to reviews"
  on reviews for all
  using (auth.role() = 'service_role');

-- Update listing rating when a review is approved/inserted
create or replace function recalculate_listing_rating()
returns trigger language plpgsql security definer as $$
begin
  update listings
  set
    rating_avg   = (select round(avg(rating)::numeric, 2) from reviews where listing_id = coalesce(new.listing_id, old.listing_id) and is_approved = true),
    rating_count = (select count(*) from reviews where listing_id = coalesce(new.listing_id, old.listing_id) and is_approved = true)
  where id = coalesce(new.listing_id, old.listing_id);
  return new;
end;
$$;

create trigger reviews_rating_update
  after insert or update or delete on reviews
  for each row execute function recalculate_listing_rating();

-- ── Blog Posts ────────────────────────────────────────────────────────────────
create table blog_posts (
  id                    uuid primary key default gen_random_uuid(),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  title                 text not null,
  slug                  text not null unique,
  excerpt               text,
  content               text,
  author                text not null default 'FitBodega',
  author_avatar         text,
  cover_image           text,
  tags                  text[] default '{}',
  is_published          boolean not null default false,
  reading_time_minutes  integer
);

create index blog_published_idx  on blog_posts (is_published, created_at desc);
create index blog_slug_idx       on blog_posts (slug);

create trigger blog_posts_updated_at
  before update on blog_posts
  for each row execute function update_updated_at();

alter table blog_posts enable row level security;

create policy "Anyone can view published posts"
  on blog_posts for select
  using (is_published = true);

create policy "Service role has full access to blog"
  on blog_posts for all
  using (auth.role() = 'service_role');

-- ── Newsletter Subscribers ────────────────────────────────────────────────────
create table newsletter_subscribers (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  email             text not null unique,
  is_confirmed      boolean not null default false,
  confirmed_at      timestamptz,
  unsubscribe_token text not null default gen_random_uuid()::text
);

create index newsletter_email_idx on newsletter_subscribers (email);
create index newsletter_token_idx on newsletter_subscribers (unsubscribe_token);

alter table newsletter_subscribers enable row level security;

create policy "Service role has full access to newsletter"
  on newsletter_subscribers for all
  using (auth.role() = 'service_role');

-- ── Leads ─────────────────────────────────────────────────────────────────────
create table leads (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  listing_id    uuid not null references listings on delete cascade,
  sender_name   text not null,
  sender_email  text not null,
  message       text not null,
  is_read       boolean not null default false
);

create index leads_listing_idx on leads (listing_id);

alter table leads enable row level security;

create policy "Anyone can insert a lead"
  on leads for insert
  with check (true);

create policy "Owners can view own leads"
  on leads for select
  using (
    auth.uid() = (select owner_id from listings where id = listing_id)
  );

create policy "Service role has full access to leads"
  on leads for all
  using (auth.role() = 'service_role');

-- ── Storage Bucket ────────────────────────────────────────────────────────────
-- Run this separately in Supabase Dashboard → Storage → New Bucket
-- OR uncomment and run here if your Supabase version supports it:
--
-- insert into storage.buckets (id, name, public)
-- values ('listing-images', 'listing-images', true)
-- on conflict do nothing;
--
-- create policy "Anyone can view listing images"
--   on storage.objects for select
--   using (bucket_id = 'listing-images');
--
-- create policy "Authenticated users can upload listing images"
--   on storage.objects for insert
--   with check (bucket_id = 'listing-images' and auth.uid() is not null);
--
-- create policy "Owners can delete own images"
--   on storage.objects for delete
--   using (bucket_id = 'listing-images' and auth.uid()::text = (storage.foldername(name))[1]);

-- ── Seed: Sample Data (optional, delete before production) ────────────────────
-- Uncomment to add a sample approved listing for testing:
--
-- insert into listings (name, slug, type, status, tagline, description, city, country, specialties, is_featured)
-- values (
--   'The Iron Bodega',
--   'the-iron-bodega',
--   'gym',
--   'approved',
--   'A sanctuary for strength and performance',
--   'The Iron Bodega offers strength training, conditioning, and recovery in a beautifully designed space dedicated to serious training.',
--   'Vancouver',
--   'Canada',
--   ARRAY['Strength Training', 'Conditioning', 'Recovery'],
--   true
-- );
