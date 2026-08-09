// Pitchlo public job board — the strongest listed-deal source. Its niche
// index pages list live jobs with brand, pay, and post dates, no login.

import fixtures from '../fixtures/pitchlo.json';
import type { Fetcher, RawOpportunity } from '../types';
import { extractListings, htmlToText, politeFetch, sleep } from './extract';

const PAGES = [
  'https://www.pitchlo.com/ugc-creator-jobs/health',
  'https://www.pitchlo.com/ugc-creator-jobs/fitness',
];

export const pitchloFetcher: Fetcher = {
  id: 'pitchlo',
  async fetch({ useFixtures }): Promise<RawOpportunity[]> {
    if (useFixtures) return fixtures as RawOpportunity[];

    const todayIso = new Date().toISOString().slice(0, 10);
    const results: RawOpportunity[] = [];
    for (const pageUrl of PAGES) {
      const html = await politeFetch(pageUrl);
      if (html) {
        const items = await extractListings({
          source: 'pitchlo',
          sourceType: 'listed_deal',
          pageUrl,
          pageText: htmlToText(html),
          todayIso,
        });
        results.push(...items);
      }
      await sleep(1000);
    }
    return results;
  },
};
