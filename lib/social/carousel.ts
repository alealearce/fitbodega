import { SITE } from '@/lib/config/site';
import type { createAdminClient } from '@/lib/supabase/server';
import {
  SINGLE_IMAGE_ONLY,
  clampCaption,
  configuredPlatforms,
  publish,
  uploadAll,
  type Platform,
} from '@/lib/social/blotato';

// Shared carousel publisher: render URLs in, one hosted upload, one publish
// per configured platform, every attempt logged to social_posts. Used by the
// dormant daily-social route and the live weekly-social cron.

const IMG_BASE = process.env.SOCIAL_PUBLIC_BASE_URL || SITE.url;

export type SocialKind = 'blog' | 'showcase' | 'top100';

export function slideUrl(params: Record<string, string | undefined>): string {
  const q = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join('&');
  return `${IMG_BASE}/api/social/image?${q}`;
}

export type PlatformOutcome = { status: string; id?: string; error?: string };

export async function publishCarousel(
  supabase: ReturnType<typeof createAdminClient>,
  opts: {
    kind: SocialKind;
    refId: string | null;   // null for top100 — entries live in JSON, not a table
    refSlug: string;
    slideUrls: string[];
    caption: string;
    url: string;
    skip: Set<Platform>;
  }
): Promise<Record<string, PlatformOutcome>> {
  const results: Record<string, PlatformOutcome> = {};
  const platforms = configuredPlatforms().filter((p) => !opts.skip.has(p));
  for (const p of configuredPlatforms()) if (opts.skip.has(p)) results[p] = { status: 'already_published' };
  if (platforms.length === 0) return results;

  // Upload the slides once, then reuse the hosted URLs for every platform.
  const uploaded = await uploadAll(opts.slideUrls);
  if (!uploaded.ok) {
    for (const p of platforms) {
      results[p] = { status: 'failed', error: `media upload: ${uploaded.error}` };
      await supabase.from('social_posts').insert({
        kind: opts.kind, ref_id: opts.refId, ref_slug: opts.refSlug, platform: p,
        caption: opts.caption, image_urls: opts.slideUrls, status: 'failed', error_message: `media upload: ${uploaded.error}`,
      });
    }
    return results;
  }

  const multi = uploaded.urls.length > 1;
  for (const p of platforms) {
    // Single-image-only platforms (Threads) get just the first slide.
    const firstOnly = multi && SINGLE_IMAGE_ONLY.includes(p);
    const media = firstOnly ? [uploaded.urls[0]] : uploaded.urls;
    const cap = clampCaption(opts.caption, p, opts.url);
    const outcome = await publish(p, media, cap);
    results[p] = outcome.ok
      ? { status: firstOnly ? 'published_first_slide' : 'published', id: outcome.id }
      : { status: 'failed', error: outcome.error };
    await supabase.from('social_posts').insert({
      kind: opts.kind, ref_id: opts.refId, ref_slug: opts.refSlug, platform: p,
      external_id: outcome.ok ? outcome.id : null, caption: cap, image_urls: media,
      status: outcome.ok ? 'published' : 'failed', error_message: outcome.ok ? null : outcome.error,
    });
  }
  return results;
}
