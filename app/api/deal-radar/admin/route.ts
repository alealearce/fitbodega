import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isAdminEmail } from '@/lib/config/site';
import { loadConfig } from '@/lib/deal-radar/config';
import { fingerprintOf, normalizeDomain, scoreOpportunity } from '@/lib/deal-radar/normalize';
import type { RawOpportunity } from '@/lib/deal-radar/types';
import { createAdminClient, createClient } from '@/lib/supabase/server';

// Admin draft actions: include/skip toggles, intro edits, and brand deal
// submission review (approve puts the deal live on the /deals board;
// week_id null marks board deals, distinct from weekly editions). Auth is
// the logged-in admin session (same gate as /admin). Publishing lives in
// its own route: /api/deal-radar/publish.

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) return null;
  return user;
}

const ActionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('set_status'),
    opportunityId: z.string().uuid(),
    status: z.enum(['new', 'included', 'skipped', 'expired']),
  }),
  z.object({
    action: z.literal('save_intro'),
    digestId: z.string().uuid(),
    introCopy: z.string().max(4000),
  }),
  z.object({
    action: z.literal('review_submission'),
    submissionId: z.string().uuid(),
    decision: z.enum(['approved', 'rejected']),
  }),
]);

export async function POST(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = ActionSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const body = parsed.data;

  if (body.action === 'set_status') {
    const { error } = await supabase
      .from('dr_opportunities')
      .update({ status: body.status })
      .eq('id', body.opportunityId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else if (body.action === 'save_intro') {
    const { error } = await supabase
      .from('dr_weekly_digests')
      .update({ intro_copy: body.introCopy })
      .eq('id', body.digestId)
      .eq('status', 'draft');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else if (body.action === 'review_submission') {
    const { data: sub } = await supabase
      .from('dr_deal_submissions')
      .select('*')
      .eq('id', body.submissionId)
      .eq('status', 'pending')
      .maybeSingle();
    if (!sub) return NextResponse.json({ error: 'Submission not found or already reviewed' }, { status: 404 });

    let opportunityId: string | null = null;
    if (body.decision === 'approved') {
      // Approval puts the deal straight on the live board: source
      // brand_direct, status included, week_id null (board, not an edition).
      const raw: RawOpportunity = {
        source: 'brand_direct',
        sourceType: 'listed_deal',
        brandName: sub.brand_name,
        brandUrl: sub.brand_website,
        sourceUrl: sub.apply_url ?? sub.brand_website,
        offerType: sub.offer_type,
        compensationText: sub.compensation_text,
        deliverables: sub.deliverables,
        platforms: sub.platforms,
        activeAdCount: null,
        postedAt: new Date().toISOString().slice(0, 10),
        meta: { contactEmail: sub.contact_email, notes: sub.notes ?? undefined },
      };
      const config = await loadConfig(supabase);
      const { score, breakdown } = scoreOpportunity(raw, config.weights, config.keywords);
      const { data: opp, error: oppError } = await supabase
        .from('dr_opportunities')
        .insert({
          brand_name: raw.brandName,
          brand_domain: normalizeDomain(raw.brandUrl),
          source_type: raw.sourceType,
          source: raw.source,
          source_url: raw.sourceUrl,
          offer_type: raw.offerType,
          compensation_text: raw.compensationText,
          deliverables: raw.deliverables,
          platforms: raw.platforms,
          meta: raw.meta,
          fingerprint: fingerprintOf(raw),
          score,
          score_breakdown: breakdown,
          status: 'included',
          week_id: null,
        })
        .select('id')
        .single();
      if (oppError) return NextResponse.json({ error: oppError.message }, { status: 500 });
      opportunityId = opp.id;
    }

    const { error } = await supabase
      .from('dr_deal_submissions')
      .update({ status: body.decision, reviewed_at: new Date().toISOString(), opportunity_id: opportunityId })
      .eq('id', body.submissionId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
