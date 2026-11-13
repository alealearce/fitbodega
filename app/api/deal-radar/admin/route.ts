import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isAdminEmail } from '@/lib/config/site';
import { putOnBoard } from '@/lib/deal-radar/submissions';
import type { DrDealSubmission } from '@/lib/deal-radar/types';
import { createAdminClient, createClient } from '@/lib/supabase/server';

// Admin actions: intro edits on a draft, and overrides on brand deal
// submissions. Submissions decide themselves when they arrive
// (lib/deal-radar/submissions.ts); review_submission is how the owner
// reverses a call or settles one the check could not make. Approving puts
// the deal live on the /deals board (week_id null marks board deals,
// distinct from weekly editions); rejecting a live one takes it down. Auth is
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
    const { data } = await supabase
      .from('dr_deal_submissions')
      .select('*')
      .eq('id', body.submissionId)
      .maybeSingle();
    const sub = data as DrDealSubmission | null;
    if (!sub) return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    if (sub.status === body.decision) return NextResponse.json({ ok: true });

    let opportunityId: string | null = null;
    if (body.decision === 'approved') {
      const placed = await putOnBoard(supabase, sub, { by: 'admin' });
      if (!placed.ok) return NextResponse.json({ error: placed.error }, { status: 500 });
      opportunityId = placed.opportunityId;
    } else if (sub.opportunity_id) {
      // Rejecting a deal that is live: delete its board row, so the same
      // deal can be put back later without tripping the fingerprint index.
      const { error: delError } = await supabase
        .from('dr_opportunities')
        .delete()
        .eq('id', sub.opportunity_id)
        .eq('source', 'brand_direct')
        .is('week_id', null);
      if (delError) return NextResponse.json({ error: delError.message }, { status: 500 });
    }

    const { error } = await supabase
      .from('dr_deal_submissions')
      .update({ status: body.decision, reviewed_at: new Date().toISOString(), opportunity_id: opportunityId })
      .eq('id', body.submissionId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
