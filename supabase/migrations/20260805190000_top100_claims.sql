-- Top 100 claim requests — the bridge between a ranked JSON entry and a
-- claimable directory listing. Keyed by (list_id, entry_name): names are the
-- stable identity across monthly rank churn. The listing row is created at
-- claim time (status 'pending'); approving the listing approves the claim.

create table top100_claims (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),

  list_id          text not null,                -- 'gyms', 'recovery', 'retreats', ...
  entry_name       text not null,                -- name snapshot from the list JSON
  rank_at_claim    int  not null,                -- rank when claimed (display fallback)

  listing_id       uuid not null references listings(id) on delete cascade,
  claimer_user_id  uuid not null references auth.users(id) on delete cascade,
  claimer_email    text not null,
  relationship     text not null,
  domain_match     boolean not null default false, -- claimer email domain matches entry website

  status           text not null default 'pending'
                   check (status in ('pending', 'approved', 'rejected'))
);

-- One live claim per entry; a rejected claim frees the slot.
create unique index top100_claims_entry_live_idx
  on top100_claims (list_id, entry_name)
  where status in ('pending', 'approved');

create index top100_claims_listing_idx     on top100_claims (listing_id);
create index top100_claims_list_status_idx on top100_claims (list_id, status);

-- Service-role only — no client policies. Pages and routes read via the
-- admin client server-side.
alter table top100_claims enable row level security;
