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
  segment: string | null;
  country: string | null;
  score: number | null;
  factors: Record<string, number> | null;
  warning: string | null;
  website: string | null;
  handles: Record<string, string>;   // platform -> profile URL
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
  segment?: string | null;
  country?: string | null;
  score?: number | string | null;
  factors?: Record<string, number> | null;
  warning?: string | null;
  website?: string | null;
  handles?: Record<string, string> | null;
}

function loadList(file: string): { title: string; entries: RawEntry[] } {
  const raw = JSON.parse(
    readFileSync(join(process.cwd(), 'data', 'top-100', file), 'utf8')
  ) as { meta: { title: string }; entries: RawEntry[] };
  return { title: raw.meta.title, entries: raw.entries };
}

/**
 * Pick the next entry to spotlight: walk the round-robin sequence
 * (list 1 rank 1, list 2 rank 1, ... list 9 rank 1, list 1 rank 2, ...)
 * and return the first entry that has NOT been published to every required
 * platform. A partial failure (first live run: Instagram rejected the post,
 * the other three published) therefore completes on the next run instead of
 * being skipped — the caller passes the already-published platforms as
 * `skip` to publishCarousel.
 */
export function nextSpotlight(
  publishedByRef: Map<string, Set<string>>,
  requiredPlatforms: string[]
): { entry: SpotlightEntry; publishedPlatforms: Set<string> } | null {
  const lists = LISTS.map((l) => ({ ...l, ...loadList(l.file) }));
  const maxRank = Math.max(...lists.map((l) => l.entries.length));

  for (let i = 0; i < maxRank; i++) {
    for (const list of lists) {
      const entry = list.entries[i];
      if (!entry) continue;
      const refSlug = `${list.key}#${entry.rank}`;
      const done = publishedByRef.get(refSlug) ?? new Set<string>();
      if (requiredPlatforms.every((pf) => done.has(pf))) continue;
      const e: SpotlightEntry = {
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
        segment: entry.segment ?? null,
        country: entry.country ?? null,
        score: entry.score != null ? Number(entry.score) : null,
        factors: entry.factors ?? null,
        warning: entry.warning ?? null,
        website: entry.website ?? null,
        handles: entry.handles ?? {},
        refSlug,
      };
      return { entry: e, publishedPlatforms: done };
    }
  }
  return null;
}

/** '@handle' from a profile URL — 'https://instagram.com/cbum' -> '@cbum'. */
export function handleTag(url: string): string | null {
  try {
    const path = new URL(url).pathname.replace(/\/+$/, '');
    const last = path.split('/').filter(Boolean).pop();
    if (!last) return null;
    return last.startsWith('@') ? last : `@${last}`;
  } catch {
    return null;
  }
}

const PLATFORM_LABEL: Record<string, string> = {
  instagram: 'IG', youtube: 'YouTube', tiktok: 'TikTok', twitter: 'X', x: 'X',
};

/**
 * Caption for the spotlight carousel — the full card, in text: who, why,
 * reach, the takeaway, and the entry's own handles tagged. Everything comes
 * from the published list; hashtags capped at five (owner rule).
 */
export function spotlightCaption(e: SpotlightEntry): string {
  const url = `${SITE.url}${e.listPath}`;
  const tags = ['#fitness', '#trainingculture', '#fitbodega100', ...e.listTags].slice(0, 5);

  const follow = Object.entries(e.handles)
    .map(([platform, link]) => {
      const tag = handleTag(link);
      return tag ? `${tag} (${PLATFORM_LABEL[platform.toLowerCase()] ?? platform})` : null;
    })
    .filter(Boolean)
    .join(' · ');

  const lines: (string | null)[] = [
    // 'No. 1', not '#1' — Instagram counts a leading #1 as a sixth hashtag.
    `No. ${e.rank} on the ${e.listTitle} — ${e.name}.`,
    '',
    e.who || null,
    e.who ? '' : null,
    e.why,
    e.reach ? '' : null,
    e.reach ? `Reach: ${e.reach.replace(/\s*\(verified[^)]*\)/i, '').trim()}` : null,
    follow ? `Follow: ${follow}` : null,
    e.takeaway ? '' : null,
    e.takeaway ? `Steal this: ${e.takeaway}` : null,
    '',
    `The full list: ${url}`,
    '',
    tags.join(' '),
  ];
  return lines.filter((l): l is string => l !== null).join('\n');
}
