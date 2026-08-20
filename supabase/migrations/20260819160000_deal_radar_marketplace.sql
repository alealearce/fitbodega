-- Deal Radar marketplace: brand-submitted deals + per-week recurrence.
--
-- 1. Recurrence fix: the global-unique fingerprint let a new week's
--    collection UPDATE a row that belonged to a PUBLISHED edition (the Aug 17
--    draft pulled three brands out of the live Aug 10 post). Editions must be
--    immutable snapshots, and a brand recurring across weeks is signal we
--    want to keep (it feeds a future standing brand ranking). One row per
--    (fingerprint, week) does both.
drop index if exists dr_opportunities_fingerprint_idx;
create unique index if not exists dr_opportunities_fingerprint_week_idx
  on dr_opportunities (fingerprint, week_id) nulls not distinct;

-- 2. Brand-submitted deals — the "brands add their deals" half of the
--    marketplace loop. Raw submissions land here (public form at /for-brands),
--    the admin approves or rejects at /admin/deal-radar; approval creates a
--    dr_opportunities row with source 'brand_direct' and week_id NULL, which
--    puts it on the live /deals board immediately.
create table if not exists dr_deal_submissions (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),

  brand_name        text not null,
  brand_website     text,
  contact_email     text not null,
  offer_type        text not null
                    check (offer_type in ('paid', 'gifted', 'commission')),
  compensation_text text not null,          -- what the deal pays, verbatim
  deliverables      text not null,          -- what the creator makes
  platforms         text[] not null default '{}',
  apply_url         text,                   -- where creators apply (email fallback: contact_email)
  notes             text,

  status            text not null default 'pending'
                    check (status in ('pending', 'approved', 'rejected')),
  reviewed_at       timestamptz,
  opportunity_id    uuid references dr_opportunities (id) on delete set null
);

create index if not exists dr_deal_submissions_status_idx on dr_deal_submissions (status);

alter table dr_deal_submissions enable row level security;

create policy "Service role has full access to dr_deal_submissions"
  on dr_deal_submissions for all using (auth.role() = 'service_role');
