import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { loadConfig } from '@/lib/deal-radar/config';
import { normalizeAndStore } from '@/lib/deal-radar/normalize';
import type { RawOpportunity } from '@/lib/deal-radar/types';
import { currentWeekSlug } from '@/lib/deal-radar/week';
import { createAdminClient } from '@/lib/supabase/server';

// Ingest researched opportunities into the current week's draft. This is the
// entry point for browser-driven research (Meta Ad Library sweeps and other
// sources a server-side fetcher can't reach). Auth: ADMIN_SECRET bearer.
//
//   curl -X POST https://fitbodega.com/api/deal-radar/ingest \
//     -H "Authorization: Bearer $ADMIN_SECRET" -H "Content-Type: application/json" \
//     -d '{"items": [ ...RawOpportunity[] ]}'

const ItemSchema = z.object({
  source: z.enum(['pitchlo', 'casting_boards', 'spend_signals', 'ad_library', 'research', 'brand_direct']),
  sourceType: z.enum(['spend_signal', 'listed_deal']),
  brandName: z.string().min(1),
  brandUrl: z.string().nullable(),
  sourceUrl: z.string().nullable(),
  offerType: z.enum(['paid', 'gifted', 'commission', 'unknown']),
  compensationText: z.string().nullable(),
  deliverables: z.string().nullable(),
  platforms: z.array(z.string()),
  activeAdCount: z.number().nullable(),
  postedAt: z.string().nullable(),
  meta: z.record(z.string(), z.unknown()),
});

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!process.env.ADMIN_SECRET || authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = z.object({ items: z.array(ItemSchema).min(1).max(100) }).safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.issues.slice(0, 5) }, { status: 400 });
  }

  const supabase = createAdminClient();
  const config = await loadConfig(supabase);
  const weekSlug = currentWeekSlug();

  const { data: digest } = await supabase
    .from('dr_weekly_digests')
    .select('id, status')
    .eq('week_slug', weekSlug)
    .maybeSingle();

  let weekId = digest?.id as string | undefined;
  if (digest && digest.status !== 'draft') {
    return NextResponse.json({ error: `Week ${weekSlug} already ${digest.status}` }, { status: 409 });
  }
  if (!weekId) {
    const { data: created, error } = await supabase
      .from('dr_weekly_digests')
      .insert({ week_slug: weekSlug, status: 'draft' })
      .select('id')
      .single();
    if (error || !created) {
      return NextResponse.json({ error: error?.message ?? 'insert failed' }, { status: 500 });
    }
    weekId = created.id;
  }

  const stored = await normalizeAndStore(
    supabase,
    parsed.data.items as RawOpportunity[],
    config,
    weekId!
  );

  await supabase.from('dr_runs').insert({
    finished_at: new Date().toISOString(),
    source: parsed.data.items[0].source,
    items_found: parsed.data.items.length,
    errors: [],
    duration_ms: 0,
    ok: true,
  });

  return NextResponse.json({ ok: true, weekSlug, weekId, stored });
}
