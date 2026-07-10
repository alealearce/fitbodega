import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { SITE } from '@/lib/config/site';
import { getListingUrl } from '@/lib/utils/listingUrl';
import { buildBlogContent, buildShowcaseCaption, showcaseBlurb, igHandle } from '@/lib/social/caption';
import { configuredPlatforms, SINGLE_IMAGE_ONLY, isConfigured, uploadAll, publish, clampCaption, type Platform } from '@/lib/social/blotato';
import { sendFeaturedEmail } from '@/lib/email/resend';
import type { Listing } from '@/lib/supabase/types';

/**
 * Daily cron: publish two carousels to social via Blotato —
 *   • blog digest    — today's auto-generated Journal post (title + 3-pt TL;DR + link)
 *   • listing showcase — a rotating member of the directory
 *
 * Auth: Authorization: Bearer ${CRON_SECRET} (Vercel Cron sets this).
 * Query params (manual runs / testing):
 *   ?kind=blog|showcase|both   (default both)
 *   ?dry=1                      build slides + captions, do NOT upload or post
 *   ?slug=<blog-slug>           target a specific blog post
 *   ?id=<listing-id>            target a specific listing for the showcase
 *   ?force=1                    ignore the once-per-day showcase guard
 */

export const maxDuration = 300;

const IMG_BASE = process.env.SOCIAL_PUBLIC_BASE_URL || SITE.url;

// Weekday → preferred showcase type (falls through when that category is thin).
// getUTCDay: 0 Sun … 6 Sat.  Sunday = no preference (community roundup).
const WEEKDAY_TYPE: Record<number, Listing['type'] | undefined> = {
  1: 'gym', 2: 'trainer', 3: 'recovery', 4: 'nutritionist', 5: 'store', 6: 'youth', 0: 'club',
};
const TYPE_LABEL: Record<string, string> = {
  recovery: 'Recovery Studio', gym: 'Gym', trainer: 'Coach', club: 'Club', nutritionist: 'Nutritionist', store: 'Health Food Store', youth: 'Youth Sports',
};

function enc(v: string): string {
  return encodeURIComponent(v);
}
function slideUrl(params: Record<string, string | undefined>): string {
  const q = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k}=${enc(String(v))}`)
    .join('&');
  return `${IMG_BASE}/api/social/image?${q}`;
}

type PlatformOutcome = { status: string; id?: string; error?: string };

async function publishCarousel(
  supabase: ReturnType<typeof createAdminClient>,
  opts: { kind: 'blog' | 'showcase'; refId: string; refSlug: string; slideUrls: string[]; caption: string; url: string; skip: Set<Platform> }
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
    // Single-image-only platforms (Threads) get just the first slide of a carousel.
    const firstOnly = multi && SINGLE_IMAGE_ONLY.includes(p);
    const media = firstOnly ? [uploaded.urls[0]] : uploaded.urls;
    const cap = clampCaption(opts.caption, p, opts.url); // respect per-platform char limits (X, Bluesky…)
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

// ───────────────────────────── blog digest ──────────────────────────────────

async function runBlog(supabase: ReturnType<typeof createAdminClient>, slug: string | null, dry: boolean) {
  const q = supabase.from('blog_posts').select('id, slug, title, excerpt, content, category').eq('is_published', true);
  const { data: post } = slug
    ? await q.eq('slug', slug).maybeSingle()
    : await q.order('published_at', { ascending: false }).limit(1).maybeSingle();
  if (!post) return { ok: false, reason: 'no published blog post' };

  const url = `${SITE.url}/${post.slug}`;
  const { points, caption } = await buildBlogContent(post, url);

  const slideUrls = [
    slideUrl({ type: 'blog', slide: '0', title: post.title, category: (post.category ?? 'the journal').replace(/_/g, ' ') }),
    slideUrl({ type: 'blog', slide: '1', points: points.join('|') }),
    slideUrl({ type: 'blog', slide: '2', title: post.title, url: `${SITE.domain}/community` }),
  ];

  // Idempotency: skip platforms already published for this post.
  const { data: done } = await supabase.from('social_posts').select('platform').eq('kind', 'blog').eq('ref_id', post.id).eq('status', 'published');
  const skip = new Set<Platform>((done ?? []).map((r) => r.platform as Platform));

  if (dry) return { ok: true, dry: true, post: { slug: post.slug, title: post.title }, url, points, caption, slideUrls, alreadyDone: Array.from(skip) };

  const results = await publishCarousel(supabase, { kind: 'blog', refId: post.id, refSlug: post.slug, slideUrls, caption, url, skip });
  return { ok: Object.values(results).some((r) => r.status === 'published'), post: { slug: post.slug, title: post.title }, url, results };
}

// ──────────────────────────── listing showcase ──────────────────────────────

const STOCK_FALLBACK = 'https://images.unsplash.com/photo-1545389336-cf090694435e?w=1080&h=1350&fit=crop&q=80';

function isStock(url: string): boolean {
  return !url || url.includes('unsplash.com') || url.includes('pexels.com');
}

/** Confirm a URL is a reachable image (so a broken hero never kills the post). */
async function isUsableImage(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'GET', headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FitBodegaBot/1.0)' } });
    if (!res.ok) return false;
    return (res.headers.get('content-type') || '').toLowerCase().startsWith('image/');
  } catch {
    return false;
  }
}

/** Pull the og:image / twitter:image a site publishes to represent itself. */
async function fetchOgImage(siteUrl: string): Promise<string | null> {
  try {
    const res = await fetch(siteUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FitBodegaBot/1.0)' }, redirect: 'follow' });
    if (!res.ok) return null;
    const html = (await res.text()).slice(0, 200_000);
    const pick = (re: RegExp) => html.match(re)?.[1];
    const raw =
      pick(/<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i) ||
      pick(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i) ||
      pick(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
    if (!raw) return null;
    return new URL(raw, siteUrl).toString(); // resolve relative paths
  } catch {
    return null;
  }
}

/**
 * Best hero image for a showcase, in order of authenticity:
 *   real listing photo → the business's own website og:image → logo → stock.
 * Every candidate is validated as a reachable image before use.
 */
async function resolveHero(listing: Listing): Promise<string> {
  const first = listing.images?.[0] || '';
  if (first && !isStock(first) && (await isUsableImage(first))) return first;

  if (listing.website) {
    const og = await fetchOgImage(listing.website);
    if (og && !isStock(og) && (await isUsableImage(og))) return og;
  }
  if (listing.logo_url && (await isUsableImage(listing.logo_url))) return listing.logo_url;
  if (first && (await isUsableImage(first))) return first; // stock, but real
  return STOCK_FALLBACK;
}

async function pickListing(supabase: ReturnType<typeof createAdminClient>, id: string | null): Promise<Listing | null> {
  if (id) {
    const { data } = await supabase.from('listings').select('*').eq('id', id).maybeSingle();
    return (data as Listing) ?? null;
  }
  // Pull lightweight candidate rows for ALL approved listings, ordered
  // least-recently-featured first, then filter for ones that have a usable
  // image. (Filtering must happen across every candidate, not a pre-limited
  // window, or image-less imported rows would crowd out the eligible ones.)
  const { data } = await supabase
    .from('listings')
    .select('id, type, images, logo_url, owner_id, last_featured_at, created_at')
    .eq('status', 'approved')
    .order('last_featured_at', { ascending: true, nullsFirst: true })
    .order('created_at', { ascending: true });
  type Lite = Pick<Listing, 'id' | 'type' | 'images' | 'logo_url' | 'owner_id' | 'last_featured_at'>;
  const eligible = ((data as Lite[]) ?? []).filter((l) => (l.images && l.images.length > 0) || l.logo_url);
  if (eligible.length === 0) return null;

  const preferred = WEEKDAY_TYPE[new Date().getUTCDay()];
  const firstOf = (pool: Lite[]) => (preferred && pool.find((l) => l.type === preferred)) || pool[0];

  // Prioritize claimed members (owner_id set) that haven't been featured in the
  // last 7 days — so a lone member doesn't repeat daily — else fall through to
  // any eligible (seeded) listing. As members claim, they take over the rotation.
  const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;
  const claimedFresh = eligible.filter((l) => l.owner_id && (!l.last_featured_at || new Date(l.last_featured_at).getTime() < weekAgo));
  const chosen = claimedFresh.length ? firstOf(claimedFresh) : firstOf(eligible);

  const { data: full } = await supabase.from('listings').select('*').eq('id', chosen.id).maybeSingle();
  return (full as Listing) ?? null;
}

async function runShowcase(supabase: ReturnType<typeof createAdminClient>, id: string | null, dry: boolean, force: boolean) {
  // Once-per-day guard (unless a specific id or force is given).
  if (!id && !force && !dry) {
    const since = new Date(Date.now() - 18 * 3600 * 1000).toISOString();
    const { count } = await supabase
      .from('social_posts')
      .select('id', { count: 'exact', head: true })
      .eq('kind', 'showcase')
      .eq('status', 'published')
      .gte('created_at', since);
    if ((count ?? 0) > 0) return { ok: true, skipped: 'a showcase already went out in the last 18h' };
  }

  const listing = await pickListing(supabase, id);
  if (!listing) return { ok: false, reason: 'no eligible listing to feature' };

  const url = `${SITE.url}${getListingUrl(listing.type, listing.slug)}`;
  const label = TYPE_LABEL[listing.type] ?? 'Member';
  const hero = await resolveHero(listing); // real photo → site og:image → logo → stock
  // Only opted-in members (claimed) get the @-tag + email; seeded listings don't.
  const isMember = Boolean(listing.owner_id);
  const handle = isMember && listing.social_instagram ? igHandle(listing.social_instagram) : '';
  const caption = await buildShowcaseCaption(listing, url, { isMember });

  const slideUrls = [
    slideUrl({ type: 'showcase', slide: '0', kind: label, name: listing.name, city: listing.city ?? '', country: listing.country ?? '', img: hero }),
    slideUrl({ type: 'showcase', slide: '1', name: listing.name, blurb: showcaseBlurb(listing) }),
    slideUrl({ type: 'showcase', slide: '2', name: listing.name, style: listing.specialties?.[0] ?? '', city: listing.city ?? '', country: listing.country ?? '' }),
    slideUrl({ type: 'showcase', slide: '3', name: listing.name, handle }),
  ];

  if (dry) return { ok: true, dry: true, listing: { id: listing.id, name: listing.name, type: listing.type }, url, caption, slideUrls };

  const results = await publishCarousel(supabase, { kind: 'showcase', refId: listing.id, refSlug: listing.slug, slideUrls, caption, url, skip: new Set() });
  const published = Object.values(results).some((r) => r.status === 'published');

  if (published) {
    await supabase.from('listings').update({ last_featured_at: new Date().toISOString() }).eq('id', listing.id);
    // Only email opted-in members — never the seeded listings.
    if (isMember && listing.email) {
      try {
        await sendFeaturedEmail(listing.email, listing.name, url);
      } catch (e) {
        console.error('[daily-social] featured email failed:', e);
      }
    }
  }
  return { ok: published, listing: { id: listing.id, name: listing.name, type: listing.type }, url, results };
}

// ───────────────────────────── handler ──────────────────────────────────────

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const p = req.nextUrl.searchParams;
  const kind = (p.get('kind') || 'both') as 'blog' | 'showcase' | 'both';
  const dry = p.get('dry') === '1';
  const force = p.get('force') === '1';
  const slug = p.get('slug');
  const id = p.get('id');

  if (!dry && !isConfigured()) {
    return NextResponse.json(
      { error: 'Blotato not configured', hint: 'Set BLOTATO_API_KEY + at least one *_ACCOUNT_ID. Use ?dry=1 to preview without posting.' },
      { status: 503 }
    );
  }

  const supabase = createAdminClient();
  const out: Record<string, unknown> = { dryRun: dry, platforms: configuredPlatforms() };

  if (kind === 'blog' || kind === 'both') out.blog = await runBlog(supabase, slug, dry);
  if (kind === 'showcase' || kind === 'both') out.showcase = await runShowcase(supabase, id, dry, force);

  return NextResponse.json(out);
}
