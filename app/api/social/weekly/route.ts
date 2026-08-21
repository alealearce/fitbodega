import { NextRequest, NextResponse } from 'next/server';
import { SITE } from '@/lib/config/site';
import { nextAutoTopic } from '@/lib/content/backlog';
import { coverImageUrl, writePost } from '@/lib/content/generate';
import { buildBlogContent } from '@/lib/social/caption';
import { publishCarousel, slideUrl } from '@/lib/social/carousel';
import { nextSpotlight, spotlightCaption } from '@/lib/social/top100';
import type { Platform } from '@/lib/social/blotato';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * Weekly content cron — the four-day cadence (owner decisions 2026-08-20).
 * Weekdays are Pacific time; the schedule in vercel.json fires 16:00 UTC
 * (9am PDT — Vercel crons are UTC-only, so winter runs land 8am PST).
 *
 *   Mon/Wed → Top-100 spotlight: one entry from the nine lists, slides
 *             entry → why they rank → see-the-full-list CTA.
 *   Tue/Thu → The Journal, fully automated: flip any due scheduled post
 *             live; if none, WRITE the next auto-approved backlog topic
 *             (Tue = for_creators, Thu = for_brands), publish it, then post
 *             the share carousel (title, TL;DR, link). Session-written
 *             pieces (auto:false in lib/content/backlog.ts) preempt the
 *             writer simply by being scheduled.
 *
 * Auth: Authorization: Bearer ${CRON_SECRET} (Vercel Cron sets this).
 * Manual/testing params:
 *   ?kind=top100|journal    override the weekday dispatch
 *   ?track=for_creators|for_brands   override the journal track
 *   ?dry=1                  preview everything, publish nothing
 *   ?slug=<blog-slug>       share a specific published post (journal kind)
 */

export const maxDuration = 300;

// A scheduled post is one saved with is_published=false and a concrete
// published_at. The flip window is 36h so a missed cron self-heals on the
// next run, while ancient drafts with stale dates are never resurrected.
const FRESH_WINDOW_MS = 36 * 60 * 60 * 1000;

// Pacific-time weekday: 'Mon' | 'Tue' | ... (owner runs the calendar in PT).
function ptWeekday(): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Vancouver',
    weekday: 'short',
  }).format(new Date());
}

async function runJournalShare(
  supabase: ReturnType<typeof createAdminClient>,
  slug: string | null,
  track: 'for_creators' | 'for_brands',
  dry: boolean
) {
  const now = Date.now();
  const windowStart = new Date(now - FRESH_WINDOW_MS).toISOString();

  // 1. Flip due scheduled posts live. Dry runs only report what WOULD flip —
  //    a dry run must not publish anything, on the site or off it.
  let flipped: { slug: string; title: string }[] = [];
  if (dry) {
    const { data } = await supabase
      .from('blog_posts')
      .select('slug, title')
      .in('category', ['for_creators', 'for_brands'])
      .eq('is_published', false)
      .not('published_at', 'is', null)
      .lte('published_at', new Date(now).toISOString())
      .gte('published_at', windowStart);
    flipped = data ?? [];
  } else {
    const { data } = await supabase
      .from('blog_posts')
      .update({ is_published: true })
      .in('category', ['for_creators', 'for_brands'])
      .eq('is_published', false)
      .not('published_at', 'is', null)
      .lte('published_at', new Date(now).toISOString())
      .gte('published_at', windowStart)
      .select('slug, title');
    flipped = data ?? [];
  }

  // 2. The post to share: targeted slug, or the freshest publish inside the
  //    window. Nothing fresh → quiet no-op.
  // Only the weekly editorial tracks ever auto-share. Anything else on the
  // Journal (AI-era archive, spotlights) stays off social unless posted by
  // hand — this is also what stops a legacy post publishing near cron time
  // from hijacking the Tue/Thu slot.
  const base = supabase
    .from('blog_posts')
    .select('id, slug, title, excerpt, content, category, published_at')
    .eq('is_published', true)
    .in('category', ['for_creators', 'for_brands']);
  const { data: post } = slug
    ? await base.eq('slug', slug).maybeSingle()
    : await base
        .gte('published_at', windowStart)
        .order('published_at', { ascending: false })
        .limit(1)
        .maybeSingle();

  // 3. Nothing scheduled and nothing fresh → write the next backlog topic.
  let active = post ?? null;
  let wrote: { slug: string; title: string } | null = null;
  if (!active) {
    const { data: slugRows } = await supabase.from('blog_posts').select('slug');
    const existingSlugs = new Set((slugRows ?? []).map((r) => r.slug as string));
    const topic = nextAutoTopic(track, existingSlugs);
    if (!topic) {
      return { ok: true, kind: 'journal', noop: true, reason: `auto backlog for ${track} is exhausted`, flipped };
    }
    const draft = await writePost(topic);
    if (dry) {
      return {
        ok: true, kind: 'journal', dry: true, flipped,
        wouldWrite: { topic: topic.slug, track },
        post: { slug: draft.slug, title: draft.title },
        excerpt: draft.excerpt,
        words: draft.content.split(/\s+/).length,
        preview: draft.content.slice(0, 1500),
      };
    }
    const { data: inserted, error } = await supabase
      .from('blog_posts')
      .insert({
        title: draft.title,
        slug: draft.slug,
        content: draft.content,
        excerpt: draft.excerpt,
        author: SITE.name,
        tags: draft.tags ?? [],
        category: topic.track,
        is_published: true,
        published_at: new Date().toISOString(),
        reading_time_minutes: draft.reading_time_minutes,
        meta_title: draft.meta_title,
        meta_description: draft.meta_description,
        cover_image: coverImageUrl(draft.slug, draft.title, topic.track),
        generated_by: 'claude-weekly',
      })
      .select('id, slug, title, excerpt, content, category, published_at')
      .single();
    if (error || !inserted) {
      return { ok: false, kind: 'journal', error: `insert failed: ${error?.message}`, flipped };
    }
    active = inserted;
    wrote = { slug: inserted.slug, title: inserted.title };
  }
  const post2 = active;

  const url = `${SITE.url}/${post2.slug}`;
  const { points, caption } = await buildBlogContent(post2, url);
  const slideUrls = [
    slideUrl({ type: 'blog', slide: '0', title: post2.title, category: (post2.category ?? 'the journal').replace(/_/g, ' ') }),
    slideUrl({ type: 'blog', slide: '1', points: points.join('|') }),
    slideUrl({ type: 'blog', slide: '2', title: post2.title, url: `${SITE.domain}/${post2.slug}` }),
  ];

  const { data: done } = await supabase
    .from('social_posts').select('platform')
    .eq('kind', 'blog').eq('ref_id', post2.id).eq('status', 'published');
  const skip = new Set<Platform>((done ?? []).map((r) => r.platform as Platform));

  if (dry) {
    return { ok: true, kind: 'journal', dry: true, flipped, post: { slug: post2.slug, title: post2.title }, points, caption, slideUrls, alreadyDone: Array.from(skip) };
  }
  const results = await publishCarousel(supabase, { kind: 'blog', refId: post2.id, refSlug: post2.slug, slideUrls, caption, url, skip });
  return { ok: Object.values(results).some((r) => r.status.startsWith('published')), kind: 'journal', wrote, flipped, post: { slug: post2.slug, title: post2.title }, results };
}

async function runTop100Spotlight(supabase: ReturnType<typeof createAdminClient>, dry: boolean) {
  const { data: done } = await supabase
    .from('social_posts').select('ref_slug')
    .eq('kind', 'top100').eq('status', 'published');
  const posted = new Set<string>((done ?? []).map((r) => r.ref_slug as string));

  const e = nextSpotlight(posted);
  if (!e) return { ok: true, kind: 'top100', noop: true, reason: 'every list entry has been posted' };

  const url = `${SITE.url}${e.listPath}`;
  const caption = spotlightCaption(e);
  const factorsParam = e.factors
    ? Object.entries(e.factors).map(([k, v]) => `${k}:${v}`).join('|')
    : undefined;
  const slideUrls = [
    slideUrl({
      type: 'top100', slide: '0', rank: String(e.rank), name: e.name, who: e.who,
      list: e.listTitle, segment: e.segment ?? undefined,
      // The chip shows the number alone; the verification date stays on the site.
      reach: e.reach ? e.reach.replace(/\s*\(verified[^)]*\)/i, '').trim() : undefined,
    }),
    slideUrl({
      type: 'top100', slide: '1', rank: String(e.rank), name: e.name, why: e.why,
      score: e.score != null ? String(e.score) : undefined, factors: factorsParam,
    }),
    // The takeaway gets its own card; skipped when the list has none.
    ...(e.takeaway
      ? [slideUrl({
          type: 'top100', slide: '2', rank: String(e.rank), name: e.name,
          take: e.takeaway, warn: e.warning ?? undefined,
        })]
      : []),
    slideUrl({ type: 'top100', slide: '3', list: e.listTitle, url: `${SITE.domain}${e.listPath}` }),
  ];

  if (dry) {
    return { ok: true, kind: 'top100', dry: true, entry: { list: e.listKey, rank: e.rank, name: e.name }, caption, slideUrls };
  }
  const results = await publishCarousel(supabase, {
    kind: 'top100', refId: null, refSlug: e.refSlug, slideUrls, caption, url, skip: new Set(),
  });
  return { ok: Object.values(results).some((r) => r.status.startsWith('published')), kind: 'top100', entry: { list: e.listKey, rank: e.rank, name: e.name }, results };
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const q = req.nextUrl.searchParams;
  const dry = q.get('dry') === '1';
  const slugParam = q.get('slug');

  // Pacific-time weekday: Mon/Wed → spotlight, Tue/Thu → journal. Overrides
  // exist for manual runs and testing.
  const day = ptWeekday();
  const kind = q.get('kind') ?? (day === 'Mon' || day === 'Wed' ? 'top100' : day === 'Tue' || day === 'Thu' ? 'journal' : null);
  if (kind !== 'top100' && kind !== 'journal') {
    return NextResponse.json({ ok: true, noop: true, reason: `no social scheduled for ${day} (PT)` });
  }
  const trackParam = q.get('track');
  const track: 'for_creators' | 'for_brands' =
    trackParam === 'for_creators' || trackParam === 'for_brands'
      ? trackParam
      : day === 'Thu'
        ? 'for_brands'
        : 'for_creators';

  const supabase = createAdminClient();
  try {
    const result = kind === 'top100'
      ? await runTop100Spotlight(supabase, dry)
      : await runJournalShare(supabase, slugParam, track, dry);
    return NextResponse.json(result);
  } catch (err) {
    console.error('[social/weekly] error:', err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
