// Deal Radar — shared types.
// RawOpportunity is the fetcher contract: every source module returns this
// shape and knows nothing about the database. The normalizer maps it into
// dr_opportunities rows.
//
// Sources (2026-08 reality check):
// - pitchlo:        public job board, server-fetchable — primary listed-deal source
// - casting_boards: allcasting.com + projectcasting.com, server-fetchable
// - spend_signals:  Claude + web search — brands actively buying creator ads
// - ad_library:     Meta Ad Library. Web UI is browser-only (blocks server
//                   fetchers) and the official API excludes US commercial ads,
//                   so this data arrives via POST /api/deal-radar/ingest from a
//                   browser-driven research session. The fetcher is a stub.

// 'research' is ingest-only: opportunities found by a human/agent research
// session (open ambassador programs, marketplace finds) with no fetcher.
// 'brand_direct' is marketplace-only: deals brands post themselves at
// /for-brands, admin-approved onto the live /deals board (week_id null).
export type DrSourceId =
  | 'pitchlo'
  | 'casting_boards'
  | 'spend_signals'
  | 'ad_library'
  | 'research'
  | 'brand_direct';

// A brand-submitted deal awaiting review (dr_deal_submissions row).
export interface DrDealSubmission {
  id: string;
  created_at: string;
  brand_name: string;
  brand_website: string | null;
  contact_email: string;
  offer_type: 'paid' | 'gifted' | 'commission';
  compensation_text: string;
  deliverables: string;
  platforms: string[];
  apply_url: string | null;
  notes: string | null;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_at: string | null;
  opportunity_id: string | null;
}
export type DrSourceType = 'spend_signal' | 'listed_deal';
export type DrOfferType = 'paid' | 'gifted' | 'commission' | 'unknown';
export type DrOpportunityStatus = 'new' | 'included' | 'skipped' | 'expired';
export type DrDigestStatus = 'draft' | 'approved' | 'published';
export type DrSubscriberStatus = 'pending' | 'active' | 'unsubscribed';

// What every fetcher (and the ingest endpoint) produces. Fields the source
// can't provide stay null.
export interface RawOpportunity {
  source: DrSourceId;
  sourceType: DrSourceType;
  brandName: string;
  brandUrl: string | null;        // any URL that identifies the brand (page, site)
  sourceUrl: string | null;       // where this was found (listing page, ad library page)
  offerType: DrOfferType;
  compensationText: string | null;
  deliverables: string | null;
  platforms: string[];
  activeAdCount: number | null;   // spend_signal only
  postedAt: string | null;        // ISO date the listing/ad went live, if known
  meta: Record<string, unknown>;  // source-specific extras (sample ad copy, pitch angle, evidence label)
}

// Common fetcher interface. Implementations must never throw on partial data;
// the runner catches whole-source failures and logs them to dr_runs.
export interface Fetcher {
  id: DrSourceId;
  fetch(opts: FetchOptions): Promise<RawOpportunity[]>;
}

export interface FetchOptions {
  keywords: string[];
  // When true, read from lib/deal-radar/fixtures instead of the network.
  useFixtures: boolean;
}

// ── DB rows (snake_case, mirror the migration) ───────────────────────────────

export interface DrOpportunity {
  id: string;
  created_at: string;
  brand_name: string;
  brand_domain: string | null;
  source_type: DrSourceType;
  source: DrSourceId;
  source_url: string | null;
  offer_type: DrOfferType | null;
  compensation_text: string | null;
  deliverables: string | null;
  platforms: string[];
  active_ad_count: number | null;
  meta: Record<string, unknown>;
  fingerprint: string;
  score: number;
  score_breakdown: Record<string, number>;
  first_seen_at: string;
  last_seen_at: string;
  status: DrOpportunityStatus;
  week_id: string | null;
}

export interface DrWeeklyDigest {
  id: string;
  created_at: string;
  week_slug: string;
  status: DrDigestStatus;
  intro_copy: string | null;
  published_at: string | null;
  post_url: string | null;
}

export interface DrSubscriber {
  id: string;
  created_at: string;
  email: string;
  status: DrSubscriberStatus;
  source: 'site' | 'manual';
  confirmed_at: string | null;
  confirm_token: string;
  unsubscribe_token: string;
}

export interface DrRun {
  id: string;
  started_at: string;
  finished_at: string | null;
  source: DrSourceId;
  items_found: number;
  errors: string[];
  duration_ms: number | null;
  ok: boolean;
}

// dr_source_configs values, typed per key.
export interface DrScoringWeights {
  active_ad_count: { max_points: number; per_ad: number };
  recency: { max_points: number; full_points_days: number; zero_points_days: number };
  compensation_listed: { points: number };
  niche_match: { max_points: number; per_keyword: number };
}

export type DrSourceToggles = Record<DrSourceId, boolean>;
