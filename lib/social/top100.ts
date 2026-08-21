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

// ── Deterministic shuffle ────────────────────────────────────────────────────
// The sequence is seeded, not stored: every run derives the same order, so
// idempotency still comes solely from the social_posts log. Within each list
// the ranks are shuffled, and the top ten are pushed to the END of that
// list's sequence — the deep cuts run first and the No. 1s stay hidden to
// build curiosity (owner call 2026-08-20). Lists still round-robin so two
// neighboring posts never come from the same list.

function hashStr(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle<T>(arr: T[], seed: string): T[] {
  const rand = mulberry32(hashStr(seed));
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const TOP_HOLDBACK = 10; // ranks 1-10 post last within each list

function spotlightOrder(listKey: string, entries: RawEntry[]): RawEntry[] {
  const deep = entries.filter((e) => Number(e.rank) > TOP_HOLDBACK);
  const top = entries.filter((e) => Number(e.rank) <= TOP_HOLDBACK);
  return [
    ...seededShuffle(deep, `fitbodega-spotlight-${listKey}`),
    ...seededShuffle(top, `fitbodega-spotlight-top-${listKey}`),
  ];
}

/**
 * Pick the next entry to spotlight: round-robin across the lists, each list
 * walking its own seeded-shuffle order (deep ranks first, top ten last).
 * Returns the first entry NOT yet published to every required platform, with
 * what already published — so a partial failure completes on the next run
 * instead of being skipped.
 */
export function nextSpotlight(
  publishedByRef: Map<string, Set<string>>,
  requiredPlatforms: string[]
): { entry: SpotlightEntry; publishedPlatforms: Set<string> } | null {
  const lists = LISTS.map((l) => {
    const loaded = loadList(l.file);
    return { ...l, title: loaded.title, entries: spotlightOrder(l.key, loaded.entries) };
  });
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
