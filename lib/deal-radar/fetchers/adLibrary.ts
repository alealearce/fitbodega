// Meta Ad Library — STUB by design, not by omission.
//
// Verified 2026-08-08: the Ad Library web UI (facebook.com/ads/library) is
// fully public in a real browser (keyword search over all active US ads with
// advertiser, ad copy, start dates, variant counts) but blocks server-side
// fetchers, and the official Ad Library API only covers political/EU-
// transparency ads — US commercial fitness ads are not in it. So there is no
// server-side path worth building here.
//
// Real ad-library data enters the pipeline through POST /api/deal-radar/ingest
// (RawOpportunity[] with source "ad_library"), produced by a browser-driven
// research session. This fetcher only serves fixtures for local end-to-end
// runs; enabled=false in dr_source_configs keeps it out of live collection.

import fixtures from '../fixtures/ad_library.json';
import type { Fetcher, RawOpportunity } from '../types';

export const adLibraryFetcher: Fetcher = {
  id: 'ad_library',
  async fetch({ useFixtures }): Promise<RawOpportunity[]> {
    if (useFixtures) return fixtures as RawOpportunity[];
    return [];
  },
};
