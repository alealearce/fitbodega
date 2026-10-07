import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { loadConfig } from '@/lib/deal-radar/config';
import { generateIntroCopy } from '@/lib/deal-radar/copy';
import { runFetchers } from '@/lib/deal-radar/fetchers';
import { normalizeAndStore } from '@/lib/deal-radar/normalize';
import { publishDigest } from '@/lib/deal-radar/publish';
import type { DrOpportunity } from '@/lib/deal-radar/types';
import { currentWeekSlug } from '@/lib/deal-radar/week';
import { sendDealRadarRunReport } from '@/lib/email/resend';

// Weekly cron: collect opportunities, score them, then publish the week's
// edition and email it to active subscribers. No review step (owner
// decision 2026-10-07). The admin gets a note only when a source failed,
// a send failed, or nothing published.
//
// Runs Mondays 06:00 PT (see vercel.json). Manual trigger:
//   curl -X POST -H "Authorization: Bearer $CRON_SECRET" \
//     https://fitbodega.com/api/deal-radar/collect
// Add ?fixtures=1 to run from fixture data with zero external calls; a
// fixture run stops at the draft and never publishes or emails.

export const maxDuration = 300;

async function collect(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const useFixtures =
    new URL(req.url).searchParams.get('fixtures') === '1' ||
    process.env.DEAL_RADAR_USE_FIXTURES === '1';

  const supabase = createAdminClient();
  const config = await loadConfig(supabase);
  const weekSlug = currentWeekSlug();

  // One digest row per week; re-runs reuse it while it is still a draft.
  const { data: existing } = await supabase
    .from('dr_weekly_digests')
    .select('id, status')
    .eq('week_slug', weekSlug)
    .maybeSingle();

  if (existing && existing.status !== 'draft') {
    return NextResponse.json({ ok: false, error: `Week ${weekSlug} already ${existing.status}` }, { status: 409 });
  }

  let weekId = existing?.id as string | undefined;
  if (!weekId) {
    const { data: created, error } = await supabase
      .from('dr_weekly_digests')
      .insert({ week_slug: weekSlug, status: 'draft' })
      .select('id')
      .single();
    if (error || !created) {
      return NextResponse.json({ error: `Could not create digest: ${error?.message}` }, { status: 500 });
    }
    weekId = created.id;
  }

  const raws = await runFetchers(supabase, config, { useFixtures });
  const stored = await normalizeAndStore(supabase, raws, config, weekId!);

  const { data: opps } = await supabase
    .from('dr_opportunities')
    .select('*')
    .eq('week_id', weekId!)
    .order('score', { ascending: false });
  const opportunities = (opps ?? []) as DrOpportunity[];

  // Write the intro. If this fails, publishDigest falls back to a plain line.
  let introCopy = '';
  try {
    introCopy = await generateIntroCopy(weekSlug, opportunities);
    await supabase.from('dr_weekly_digests').update({ intro_copy: introCopy }).eq('id', weekId!);
  } catch {
    // Best-effort.
  }

  const { data: runs } = await supabase
    .from('dr_runs')
    .select('source, ok, errors')
    .order('started_at', { ascending: false })
    .limit(6);
  const errors = (runs ?? [])
    .filter((r) => !r.ok)
    .map((r) => `${r.source}: ${(r.errors as string[]).join(', ')}`);

  const counts = {
    total: opportunities.length,
    listed: opportunities.filter((o) => o.source_type === 'listed_deal').length,
    signals: opportunities.filter((o) => o.source_type === 'spend_signal').length,
  };

  // Fixture runs stop at the draft: fake deals must never publish or email.
  if (useFixtures) {
    return NextResponse.json({ ok: true, weekSlug, weekId, counts, stored, errors, published: null });
  }

  const published = await publishDigest(supabase, weekId!, { includeAll: true });

  // Await the notification — Vercel freezes the function otherwise.
  if (!published.ok || published.failed > 0 || errors.length > 0) {
    await sendDealRadarRunReport({
      weekSlug,
      counts,
      errors,
      publishError: published.ok ? null : published.error,
      sent: published.ok ? published.sent : 0,
      failed: published.ok ? published.failed : 0,
    });
  }

  return NextResponse.json({ ok: published.ok, weekSlug, weekId, counts, stored, errors, published });
}

export async function POST(req: NextRequest) {
  return collect(req);
}

// Vercel Cron calls GET.
export async function GET(req: NextRequest) {
  return collect(req);
}
