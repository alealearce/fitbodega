import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isAdminEmail } from '@/lib/config/site';
import { createAdminClient, createClient } from '@/lib/supabase/server';

// Admin draft actions: include/skip toggles and intro edits. Auth is the
// logged-in admin session (same gate as /admin). Publishing lives in its own
// route: /api/deal-radar/publish.

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
    status: z.enum(['new', 'included', 'skipped']),
  }),
  z.object({
    action: z.literal('save_intro'),
    digestId: z.string().uuid(),
    introCopy: z.string().max(4000),
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
  }

  return NextResponse.json({ ok: true });
}
