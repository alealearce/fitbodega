import { readFileSync } from 'fs';
import { join } from 'path';
import { SITE } from '@/lib/config/site';

// Mon/Wed Top-100 spotlight rotation across all nine lists — creators and
// places alike. Entries come from the same curated JSON the ranking pages
// render, so nothing is invented; the only claims a post makes are the ones
// already published on the list.

export interface SpotlightEntry {
  listKey: string;
  listTags: string[];
  listTitle: string;
  listPath: string;     // site-relative, e.g. /top-100-fitness-influencers
  rank: number;
  name: string;
  who: string;
  why: string;
  takeaway: string | null;
  reach: string | null;
  refSlug: string;      // idempotency key: '<listKey>#<rank>'
}

// Rotation order: one list per spotlight, round-robin, walking down the
// ranks. All nine lists (owner call 2026-08-20) — people and places
// interleaved so two neighboring posts never feel like the same category.
// With 9 lists and 2 posts a week, a list surfaces about every month and the
// sequence covers years of material.
const LISTS: { key: string; file: string; path: string; tags: string[] }[] = [
  { key: 'fitness-influencers', file: 'fitness-influencers.json', path: '/top-100-fitness-influencers',   tags: ['#fitnesscreator', '#influencer'] },
  { key: 'gyms',                file: 'gyms.json',                path: '/top-100-gyms',                   tags: ['#gym', '#strengthtraining'] },
  { key: 'coaches',             file: 'coaches.json',             path: '/top-100-online-fitness-coaches', tags: ['#fitnesscoach', '#onlinecoaching'] },
  { key: 'retreats',            file: 'retreats.json',            path: '/top-100-fitness-retreats',       tags: ['#fitnessretreat', '#wellnesstravel'] },
  { key: 'hyrox',               file: 'hyrox.json',               path: '/top-100-hyrox-athletes',         tags: ['#hyrox', '#hybridathlete'] },
  { key: 'recovery',            file: 'recovery.json',            path: '/top-100-recovery-spaces',        tags: ['#recovery', '#coldplunge'] },
  { key: 'nutritionists',       file: 'nutritionists.json',       path: '/top-100-nutritionists',          tags: ['#nutrition', '#sportsnutrition'] },
  { key: 'runclubs',            file: 'runclubs.json',            path: '/top-100-run-clubs',              tags: ['#runclub', '#runningcommunity'] },
  { key: 'stores',              file: 'stores.json',              path: '/top-100-health-food-stores',     tags: ['#healthfood', '#supplements'] },
];

interface RawEntry {
  rank: number | string;
  name: string;
  who?: string;
  why?: string;
  takeaway?: string | null;
  reach?: string | null;
}

function loadList(file: string): { title: string; entries: RawEntry[] } {
  const raw = JSON.parse(
    readFileSync(join(process.cwd(), 'data', 'top-100', file), 'utf8')
  ) as { meta: { title: string }; entries: RawEntry[] };
  return { title: raw.meta.title, entries: raw.entries };
}

/**
 * Pick the next entry to spotlight: walk the round-robin sequence
 * (list 1 rank 1, list 2 rank 1, ... list 5 rank 1, list 1 rank 2, ...)
 * and return the first whose refSlug is not in `posted`.
 */
export function nextSpotlight(posted: Set<string>): SpotlightEntry | null {
  const lists = LISTS.map((l) => ({ ...l, ...loadList(l.file) }));
  const maxRank = Math.max(...lists.map((l) => l.entries.length));

  for (let i = 0; i < maxRank; i++) {
    for (const list of lists) {
      const entry = list.entries[i];
      if (!entry) continue;
      const refSlug = `${list.key}#${entry.rank}`;
      if (posted.has(refSlug)) continue;
      return {
        listKey: list.key,
        listTags: list.tags,
        listTitle: list.title,
        listPath: list.path,
        rank: Number(entry.rank),
        name: entry.name,
        who: entry.who ?? '',
        why: entry.why ?? '',
        takeaway: entry.takeaway ?? null,
        reach: entry.reach ?? null,
        refSlug,
      };
    }
  }
  return null;
}

/**
 * Caption for the spotlight carousel — plain facts from the list, no hype.
 * Hashtags are capped at five (owner rule): three base + two per-list.
 */
export function spotlightCaption(e: SpotlightEntry): string {
  const url = `${SITE.url}${e.listPath}`;
  const tags = ['#fitness', '#trainingculture', '#fitbodega100', ...e.listTags].slice(0, 5);
  return [
    `#${e.rank} on the ${e.listTitle} — ${e.name}.`,
    '',
    e.why,
    '',
    `The full list, reviewed monthly: ${url}`,
    '',
    tags.join(' '),
  ].join('\n');
}
