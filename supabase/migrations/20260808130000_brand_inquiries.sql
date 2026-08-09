-- Brand inquiries — the /for-brands "Book an intro call" form. Reviewed by
-- hand; the reply happens over email.

create table brand_inquiries (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),

  name           text not null,
  email          text not null,
  company        text not null,
  website        text,
  category       text not null,          -- 'Supplements & nutrition', 'Recovery studio or gym', ...
  target_market  text not null,
  liked_creators text,
  budget_range   text,                   -- 'Under $5K', '$5K–$15K', '$15K–$50K', '$50K+', 'Not sure yet'
  notes          text,

  status         text not null default 'pending'
                 check (status in ('pending', 'replied', 'closed'))
);

create index brand_inquiries_status_idx on brand_inquiries (status);

-- Service-role only — no client policies. The public form posts through
-- /api/brands/inquire which uses the admin client server-side.
alter table brand_inquiries enable row level security;
