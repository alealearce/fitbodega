-- Lead-generation engine around the FitBodega 100: each row is one
-- "measure up" audit request + the generated report. Written only by the
-- service role (API route); no public read.

create table if not exists top100_audits (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  email        text not null,
  entity_type  text not null,
  instagram    text,
  website      text,
  inputs       jsonb not null default '{}'::jsonb,
  report       jsonb
);

create index if not exists top100_audits_email_idx on top100_audits (email);
create index if not exists top100_audits_created_idx on top100_audits (created_at desc);

alter table top100_audits enable row level security;

create policy "Service role has full access to top100_audits"
  on top100_audits for all
  using (auth.role() = 'service_role');
