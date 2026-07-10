/**
 * blotato.ts — Posting client for Blotato (https://blotato.com).
 *
 * Blotato is a verified social publisher: connect each account in its dashboard
 * (normal login, no platform verification) and publish through its API. This
 * avoids the direct Meta Graph API path, which needs business verification.
 *
 * Flow: upload each rendered slide → Blotato returns a hosted URL → publish the
 * set as one carousel to every configured platform.
 *
 * Supported here (each gated by its own env var — a platform only posts if its
 * account id is set):
 *   Instagram   BLOTATO_INSTAGRAM_ACCOUNT_ID                       (YFN)
 *   Facebook    BLOTATO_FACEBOOK_ACCOUNT_ID + BLOTATO_FACEBOOK_PAGE_ID   (YFN page)
 *   LinkedIn    BLOTATO_LINKEDIN_ACCOUNT_ID [+ BLOTATO_LINKEDIN_PAGE_ID] (YFN page)
 *   X/Twitter   BLOTATO_TWITTER_ACCOUNT_ID                          (personal)
 *   Threads     BLOTATO_THREADS_ACCOUNT_ID                          (personal)
 *   Bluesky     BLOTATO_BLUESKY_ACCOUNT_ID                          (personal)
 *   Pinterest   BLOTATO_PINTEREST_ACCOUNT_ID + BLOTATO_PINTEREST_BOARD_ID (personal)
 *
 * All need BLOTATO_API_KEY.
 */

const BASE = 'https://backend.blotato.com';

export type Platform = 'instagram' | 'facebook' | 'linkedin' | 'twitter' | 'threads' | 'bluesky' | 'pinterest';

export class BlotatoConfigError extends Error {}

function env(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() ? v.trim() : undefined;
}

// Per-platform config: the account-id env var, plus any extra required ids.
const PLATFORM_ENV: Record<Platform, { account: string; requires?: string[] }> = {
  instagram: { account: 'BLOTATO_INSTAGRAM_ACCOUNT_ID' },
  facebook: { account: 'BLOTATO_FACEBOOK_ACCOUNT_ID', requires: ['BLOTATO_FACEBOOK_PAGE_ID'] },
  linkedin: { account: 'BLOTATO_LINKEDIN_ACCOUNT_ID' },
  twitter: { account: 'BLOTATO_TWITTER_ACCOUNT_ID' },
  threads: { account: 'BLOTATO_THREADS_ACCOUNT_ID' },
  bluesky: { account: 'BLOTATO_BLUESKY_ACCOUNT_ID' },
  pinterest: { account: 'BLOTATO_PINTEREST_ACCOUNT_ID', requires: ['BLOTATO_PINTEREST_BOARD_ID'] },
};

const ORDER: Platform[] = ['instagram', 'facebook', 'linkedin', 'twitter', 'threads', 'bluesky', 'pinterest'];

// Platforms that only accept a SINGLE image via Blotato — excluded from any
// multi-image carousel post (Threads rejects the extra slides).
export const SINGLE_IMAGE_ONLY: Platform[] = ['threads'];

/** Platforms that should receive a post with `imageCount` images. */
export function platformsForImages(imageCount: number): Platform[] {
  const all = configuredPlatforms();
  return imageCount > 1 ? all.filter((p) => !SINGLE_IMAGE_ONLY.includes(p)) : all;
}

// Caption character ceilings. Longer platforms get a generous cap (no real clamp).
export const PLATFORM_LIMITS: Record<Platform, number> = {
  twitter: 280,
  bluesky: 300,
  threads: 500,
  pinterest: 500,
  instagram: 2200,
  facebook: 5000,
  linkedin: 3000,
};

/** Which platforms are fully wired up (account id + any extra ids present). */
export function configuredPlatforms(): Platform[] {
  return ORDER.filter((p) => {
    const cfg = PLATFORM_ENV[p];
    if (!env(cfg.account)) return false;
    return (cfg.requires ?? []).every((r) => env(r));
  });
}

export function isConfigured(): boolean {
  return Boolean(env('BLOTATO_API_KEY')) && configuredPlatforms().length > 0;
}

/** Trim a caption to a platform's limit, preserving the canonical link. */
export function clampCaption(text: string, platform: Platform, url: string): string {
  const limit = PLATFORM_LIMITS[platform];
  if (text.length <= limit) return text;
  const lead = text.split('\n').find((l) => l.trim() && !l.trim().startsWith('#') && !l.includes('http')) || text;
  const tail = `\n\n${url}`;
  const room = limit - tail.length;
  const head = lead.length > room ? lead.slice(0, Math.max(0, room - 1)).trimEnd() + '…' : lead;
  return (head + tail).slice(0, limit);
}

async function blotatoPost(path: string, body: unknown): Promise<Record<string, unknown>> {
  const key = env('BLOTATO_API_KEY');
  if (!key) throw new BlotatoConfigError('Missing BLOTATO_API_KEY');
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'blotato-api-key': key },
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const err = json.error as { message?: string } | undefined;
    const msg = err?.message || (json.message as string | undefined) || `Blotato ${path} failed (${res.status})`;
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  }
  return json;
}

/** Upload a publicly-reachable image; returns a Blotato-hosted URL for publishing. */
export async function uploadMedia(sourceUrl: string): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  try {
    const json = await blotatoPost('/v2/media', { url: sourceUrl });
    if (!json?.url) return { ok: false, error: 'Blotato media upload returned no url' };
    return { ok: true, url: json.url as string };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/** Upload several slides in order; fails fast if any one fails. */
export async function uploadAll(urls: string[]): Promise<{ ok: true; urls: string[] } | { ok: false; error: string }> {
  const hosted: string[] = [];
  for (const u of urls) {
    const r = await uploadMedia(u);
    if (!r.ok) return { ok: false, error: r.error };
    hosted.push(r.url);
  }
  return { ok: true, urls: hosted };
}

type PublishResult = { ok: true; id: string } | { ok: false; error: string };

function pickId(json: Record<string, unknown>): string {
  const get = (o: unknown, k: string) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined);
  const candidates = [
    json.submissionId, json.id, json.postId,
    get(json.post, 'id'), get(json.post, 'submissionId'),
    get(json.data, 'id'), get(json.data, 'submissionId'),
    get(json.submission, 'id'), get(json.result, 'id'),
  ];
  for (const c of candidates) if (c !== undefined && c !== null && c !== '') return String(c);
  return '';
}

function targetFor(platform: Platform): Record<string, unknown> {
  switch (platform) {
    case 'instagram':
      return { targetType: 'instagram' };
    case 'facebook':
      return { targetType: 'facebook', pageId: env('BLOTATO_FACEBOOK_PAGE_ID') };
    case 'linkedin':
      // pageId only when posting as a company page; omitted = personal profile.
      return env('BLOTATO_LINKEDIN_PAGE_ID')
        ? { targetType: 'linkedin', pageId: env('BLOTATO_LINKEDIN_PAGE_ID') }
        : { targetType: 'linkedin' };
    case 'twitter':
      return { targetType: 'twitter' };
    case 'threads':
      return { targetType: 'threads' };
    case 'bluesky':
      return { targetType: 'bluesky' };
    case 'pinterest':
      return { targetType: 'pinterest', boardId: env('BLOTATO_PINTEREST_BOARD_ID') };
  }
}

function accountIdFor(platform: Platform): string {
  const id = env(PLATFORM_ENV[platform].account);
  if (!id) throw new BlotatoConfigError(`Missing account id for ${platform}`);
  return id;
}

/**
 * Publish a (single- or multi-image carousel) post to one platform.
 * `mediaUrls` must be Blotato-hosted URLs from uploadMedia/uploadAll.
 */
export async function publish(platform: Platform, mediaUrls: string[], caption: string): Promise<PublishResult> {
  try {
    const json = await blotatoPost('/v2/posts', {
      post: {
        accountId: accountIdFor(platform),
        content: { text: caption, mediaUrls, platform },
        target: targetFor(platform),
      },
    });
    return { ok: true, id: pickId(json) };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
