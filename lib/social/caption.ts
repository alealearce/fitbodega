/**
 * caption.ts — Captions + slide copy for the two daily FitBodega post types.
 *
 * Voice: Coach — confident, terse, editorial; calm authority, zero fluff.
 *
 * Both builders use Claude Haiku (cheap) and fall back to a deterministic
 * template if ANTHROPIC_API_KEY is absent or the call fails — the post still
 * goes out. Every caption ends with the canonical URL (a clickable link on
 * Facebook / LinkedIn) and a small, capped hashtag set. No emojis.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { Listing, BlogPost } from '@/lib/supabase/types';
import { SITE } from '@/lib/config/site';

const MODEL = 'claude-haiku-4-5-20251001';
const MAX_HASHTAGS = 5; // Blotato/IG reject overly-tagged posts; keep it tight.

const BASE_TAGS = ['#fitness', '#recovery', '#training', '#vancouverfitness', '#fitbodega'];
const CATEGORY_TAGS: Record<string, string[]> = {
  mission: ['#trainingforall', '#recoveryaccess', '#fitnesscommunity'],
  finding_training: ['#gymsforbeginners', '#findyourgym'],
  gym_guides: ['#gym', '#strengthtraining'],
  coach_guides: ['#personaltrainer', '#coaching'],
  recovery_science: ['#coldplunge', '#recovery'],
  nutrition: ['#sportsnutrition', '#mealprep'],
};
const TYPE_TAGS: Record<string, string[]> = {
  recovery:     ['#recoverystudio', '#coldplunge'],
  gym:          ['#gym', '#strengthtraining'],
  trainer:      ['#personaltrainer', '#coaching'],
  club:         ['#club', '#trainingclub'],
  nutritionist: ['#sportsnutrition'],
  store:        ['#healthfoodstore'],
  youth:        ['#youthsports'],
};

function tags(...groups: string[][]): string {
  const seen = new Set<string>();
  for (const g of groups) for (const t of g) if (t) seen.add(t.toLowerCase());
  return Array.from(seen).slice(0, MAX_HASHTAGS).join(' ');
}

function client(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

async function ask(system: string, user: string): Promise<string | null> {
  const a = client();
  if (!a) return null;
  try {
    const m = await a.messages.create({ model: MODEL, max_tokens: 500, system, messages: [{ role: 'user', content: user }] });
    const block = m.content[0];
    return block.type === 'text' && block.text.trim() ? block.text.trim() : null;
  } catch {
    return null;
  }
}

// ───────────────────────────── blog digest ──────────────────────────────────

export type BlogContent = { points: string[]; caption: string };

const BLOG_SYS = `You write for ${SITE.name}'s Instagram — the curated fitness and recovery network.
Voice: confident, terse, editorial. No exclamation marks, no "amazing/awesome", no hedging, no emojis.
Return ONLY minified JSON: {"points":["...","...","..."],"hook":"..."}.
- points: EXACTLY 3 takeaways from the post, each a punchy standalone line, max ~90 characters, no numbering, no trailing period required.
- hook: 1–2 short scroll-stopping caption lines. No hashtags, no links, no emojis.`;

function fallbackPoints(post: Pick<BlogPost, 'excerpt' | 'content'>): string[] {
  const source = (post.excerpt || post.content || '').replace(/[#*_>`]/g, ' ');
  const sentences = source.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter((s) => s.length > 20);
  const picked = sentences.slice(0, 3).map((s) => (s.length > 95 ? s.slice(0, 92).trim() + '…' : s));
  while (picked.length < 3) picked.push('Read the full guide on The Journal.');
  return picked;
}

export async function buildBlogContent(post: Pick<BlogPost, 'title' | 'slug' | 'excerpt' | 'content' | 'category'>, url: string): Promise<BlogContent> {
  const hashtags = tags(CATEGORY_TAGS[post.category ?? ''] ?? [], BASE_TAGS);
  let points = fallbackPoints(post);
  let hook = post.excerpt?.trim() || post.title;

  const raw = await ask(
    BLOG_SYS,
    `Title: ${post.title}\nCategory: ${post.category ?? 'general'}\nSummary: ${post.excerpt ?? '(none)'}\nExcerpt of body: ${(post.content || '').slice(0, 1200)}`
  );
  if (raw) {
    try {
      const parsed = JSON.parse(raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')) as { points?: string[]; hook?: string };
      if (Array.isArray(parsed.points) && parsed.points.length >= 3) points = parsed.points.slice(0, 3).map((p) => String(p).trim());
      if (parsed.hook && parsed.hook.trim()) hook = parsed.hook.trim();
    } catch {
      /* keep fallbacks */
    }
  }

  const caption = [
    post.title,
    '',
    hook,
    '',
    `Read the full piece on The Journal — ${url}`,
    '',
    hashtags,
  ].join('\n');

  return { points, caption };
}

// ──────────────────────────── listing showcase ──────────────────────────────

const TYPE_LABEL: Record<string, string> = {
  recovery:     'Recovery Studio',
  gym:          'Gym',
  trainer:      'Coach',
  club:         'Club',
  nutritionist: 'Nutritionist',
  store:        'Health Food Store',
  youth:        'Youth Sports Program',
};

const SHOW_SYS = `You write confident, terse Instagram captions for ${SITE.name} spotlighting a member of the fitness and recovery network.
Voice: calm authority, editorial, celebratory but not gushing. No exclamation marks, no hedging.
Write 2–4 short lines that make a reader want to discover this listing. No hashtags, no links, no @handles — those are appended separately. No emojis. Output ONLY the caption text.`;

/** A short, safe blurb for the showcase "why" slide and as caption fallback. */
export function showcaseBlurb(listing: Pick<Listing, 'description' | 'long_description' | 'tagline'>): string {
  const text = (listing.tagline || listing.description || listing.long_description || '').trim();
  if (!text) return `A valued member of the ${SITE.name} network.`;
  return text.length > 280 ? text.slice(0, 277).trim() + '…' : text;
}

/** Tidy a stored website value into a clean, clickable URL. */
function cleanWebsite(raw: string): string {
  const t = raw.trim().replace(/\/+$/, '');
  if (!t) return '';
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}

export async function buildShowcaseCaption(
  listing: Pick<Listing, 'name' | 'type' | 'city' | 'country' | 'description' | 'long_description' | 'tagline' | 'social_instagram' | 'website'>,
  url: string,
  opts: { isMember: boolean } = { isMember: false }
): Promise<string> {
  const label = TYPE_LABEL[listing.type] ?? 'Member';
  const loc = [listing.city, listing.country].filter(Boolean).join(', ');
  const hashtags = tags(TYPE_TAGS[listing.type] ?? [], BASE_TAGS);

  const body =
    (await ask(
      SHOW_SYS,
      `Featured ${label}: ${listing.name}\nLocation: ${loc || 'worldwide'}\nAbout: ${showcaseBlurb(listing)}`
    )) || `Meet ${listing.name} — ${showcaseBlurb(listing)}`;

  // Tag the business's Instagram (@handle tags on IG; reads as text elsewhere)
  // and link their website. Members get a collaboration credit; seeded listings
  // get a softer "follow along" plus the "claim your listing" signup hook.
  const handle = listing.social_instagram ? igHandle(listing.social_instagram) : '';
  const website = listing.website ? cleanWebsite(listing.website) : '';
  return [
    `Featured ${label}: ${listing.name}`,
    loc ? loc : '',
    '',
    body,
    '',
    `Discover ${listing.name} on ${SITE.name} — ${url}`,
    website ? website : '',
    handle ? (opts.isMember ? `In collaboration with ${handle}` : `Follow along — ${handle}`) : '',
    !opts.isMember ? `Is this your space? Claim your free listing — ${SITE.domain}` : '',
    '',
    hashtags,
  ]
    .filter((l) => l !== '')
    .join('\n');
}

/** Normalize a stored Instagram value (handle or URL) to an @handle. */
export function igHandle(raw: string): string {
  const m = raw.trim().match(/(?:instagram\.com\/)?@?([A-Za-z0-9._]+)\/?$/);
  return m ? `@${m[1]}` : '';
}
