# Deal Radar — Runbook

Weekly pipeline that finds fitness brand deal/collab opportunities, drafts a
digest, and — only after human approval — sends it to subscribers and
publishes it at `/deals`.

## The weekly loop

1. **Monday 06:00 PT** — Vercel cron hits `GET /api/deal-radar/collect`
   (auth: `CRON_SECRET`). Fetchers run, results are scored and deduped into
   `dr_opportunities`, a `draft` row lands in `dr_weekly_digests`, and a
   "draft ready" email goes to hello@fitbodega.com.
2. **Review** at `/admin/deal-radar` (login as an admin email). Toggle each
   opportunity Include/Skip, edit the intro copy, use Preview post.
3. **Approve & Publish** — the one button that does anything outward:
   publishes `/deals/[week-slug]`, emails every `active` subscriber (logged
   per subscriber in `dr_email_log`), expires the un-triaged leftovers.
   Nothing ever sends without this click.

The `/deals` page shows the current edition in full; earlier weeks collapse
into date-labeled dropdowns. Each edition also has an SEO permalink at
`/deals/[week-slug]` with Article + ItemList JSON-LD.

## Sources

| id | What | How |
|----|------|-----|
| `pitchlo` | Public UGC job board (best listed-deal source) | Server fetch + LLM extraction |
| `casting_boards` | allcasting.com + projectcasting.com | Server fetch + LLM extraction |
| `spend_signals` | Brands actively buying creator ads | Claude + web search (trackers, press, hiring signals) |
| `ad_library` | Meta Ad Library | Browser-only — see below. Fetcher is a fixture stub, disabled in config |

**Meta Ad Library reality (verified 2026-08-08):** the web UI is fully public
in a real browser (all active US commercial ads, searchable) but blocks
server-side fetchers, and the official API only covers political/EU-
transparency ads — US commercial fitness ads are NOT in it. Ad-library data
therefore enters through the ingest endpoint below, produced by a
browser-driven research session (e.g. a weekly Claude session). Collabstr and
Afluencer were evaluated and dropped: listings sit behind login walls.

## Ingest endpoint (browser research feed)

```bash
curl -X POST https://fitbodega.com/api/deal-radar/ingest \
  -H "Authorization: Bearer $ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"items": [{"source": "ad_library", "sourceType": "spend_signal", "brandName": "...", "brandUrl": null, "sourceUrl": "...", "offerType": "unknown", "compensationText": null, "deliverables": null, "platforms": ["instagram"], "activeAdCount": 12, "postedAt": "2026-08-08", "meta": {"evidence": "observed"}}]}'
```

Items flow through the same normalize/dedupe/score path as the fetchers and
land in the current week's draft.

## Manual runs

```bash
# Live collection now (creates/updates this week's draft):
curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://fitbodega.com/api/deal-radar/collect

# Fixture run — zero external calls, end-to-end locally:
curl -X POST -H "Authorization: Bearer $CRON_SECRET" "http://localhost:3000/api/deal-radar/collect?fixtures=1"
```

## Tuning without deploys

`dr_source_configs` rows (Supabase):
- `keywords` — niche-match keyword list (also feeds the spend-signal search)
- `sources` — per-fetcher on/off, e.g. `{"pitchlo": true, ...}`
- `scoring_weights` — see `lib/deal-radar/config.ts` for the shape

Scoring (0-100): ad-spend intensity (max 35) + recency (max 25) +
compensation listed (20) + niche keywords (max 20); +10 when a brand shows up
in more than one source. Per-row rationale is stored in `score_breakdown`.

## Adding a new source

1. Create `lib/deal-radar/fetchers/<name>.ts` implementing `Fetcher` from
   `lib/deal-radar/types.ts` (return `RawOpportunity[]`; use
   `politeFetch`/`extractListings` from `fetchers/extract.ts` for scraped
   pages — identified UA, 1 req/s, public pages only).
2. Add the id to `DrSourceId`, a fixture in `fixtures/<name>.json`, the
   fetcher to `ALL_FETCHERS` in `fetchers/index.ts`, and a toggle to the
   `sources` row in `dr_source_configs`.

## Email compliance (CASL)

- Double opt-in: `dr_subscribers` rows start `pending`; the digest only ever
  goes to `active` (confirmed) addresses.
- Every send carries a one-click unsubscribe link (token URL) plus
  List-Unsubscribe / List-Unsubscribe-Post headers.
- Re-subscribing after an unsubscribe restarts double opt-in.
- Sender: hello@fitbodega.com via Resend (domain DKIM/SPF already
  configured for FitBodega's existing transactional email).

## Tables

`dr_weekly_digests` (draft → published), `dr_opportunities` (scored, deduped
on `fingerprint`), `dr_subscribers`, `dr_email_log` (per-subscriber send
results), `dr_source_configs`, `dr_runs` (per-source run log — first place to
look when a Monday draft is thin). All service-role only.

## Brand-posted deals (added 2026-08-19 — the marketplace loop)

Brands post deals free at `/for-brands` → `dr_deal_submissions` (pending) →
admin email → approve or reject at `/admin/deal-radar`. Approval creates a
`dr_opportunities` row (source `brand_direct`, status `included`,
`week_id null`) that goes live on the `/deals` board immediately, merged and
ranked with the current edition. Managed campaigns are deliberately in the
background: footer link + `/about#managed-campaigns` only.

Fingerprints are unique per `(fingerprint, week_id)` — a brand recurring
across weeks gets a new row each week with `meta.weeksSeen` counting the
recurrence (the raw material for a standing brand ranking). Published
editions are immutable; collection can never move rows out of them.
