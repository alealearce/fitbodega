// Casting boards (allcasting.com, projectcasting.com) — fully fetchable and
// worth polling weekly; new fitness UGC calls appear in bursts. Expired
// listings are dropped at extraction time.

import fixtures from '../fixtures/casting_boards.json';
import type { Fetcher, RawOpportunity } from '../types';
import { extractListings, htmlToText, politeFetch, sleep } from './extract';

const PAGES = [
  'https://www.projectcasting.com/casting-calls?search=fitness+ugc',
  'https://www.allcasting.com/casting-calls/?q=fitness%20ugc',
];

export const castingBoardsFetcher: Fetcher = {
  id: 'casting_boards',
  async fetch({ useFixtures }): Promise<RawOpportunity[]> {
    if (useFixtures) return fixtures as RawOpportunity[];

    const todayIso = new Date().toISOString().slice(0, 10);
    const results: RawOpportunity[] = [];
    for (const pageUrl of PAGES) {
      const html = await politeFetch(pageUrl);
      if (html) {
        const items = await extractListings({
          source: 'casting_boards',
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
