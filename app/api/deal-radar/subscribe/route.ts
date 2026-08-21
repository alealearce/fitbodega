import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { SITE } from '@/lib/config/site';
import { sendDealRadarConfirmation } from '@/lib/email/resend';
import { rateLimit } from '@/lib/rateLimit';
import { createAdminClient } from '@/lib/supabase/server';

// Deal Radar subscribe — CASL double opt-in. A new address starts 'pending'
// and only becomes 'active' when the emailed confirm link is clicked.

export async function POST(req: NextRequest) {
  const rl = rateLimit(req, { limit: 5, windowMs: 60 * 60_000, prefix: 'deal-radar-sub' });
  if (!rl.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const parsed = z
    .object({
      email: z.string().email(),
      first_name: z.string().max(60).optional().or(z.literal('')),
    })
    .safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }
  const email = parsed.data.email.toLowerCase();
  const firstName = parsed.data.first_name?.trim() || null;

  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from('dr_subscribers')
    .select('id, status, confirm_token, first_name')
    .eq('email', email)
    .maybeSingle();

  // Already active or unsubscribed: silently succeed, never leak state.
  if (existing?.status === 'active') {
    if (firstName && !existing.first_name) {
      await supabase.from('dr_subscribers').update({ first_name: firstName }).eq('id', existing.id);
    }
    return NextResponse.json({ ok: true });
  }

  let confirmToken = existing?.confirm_token as string | undefined;
  if (existing && existing.status === 'unsubscribed') {
    // Re-subscribing after an unsubscribe requires a fresh double opt-in.
    confirmToken = crypto.randomUUID();
    await supabase
      .from('dr_subscribers')
      .update({
        status: 'pending',
        confirm_token: confirmToken,
        first_name: firstName ?? existing.first_name,
      })
      .eq('id', existing.id);
  } else if (!existing) {
    confirmToken = crypto.randomUUID();
    const { error } = await supabase
      .from('dr_subscribers')
      .insert({
        email,
        first_name: firstName,
        status: 'pending',
        source: 'site',
        confirm_token: confirmToken,
      });
    if (error) return NextResponse.json({ error: 'Could not subscribe' }, { status: 500 });
  }

  await sendDealRadarConfirmation(
    email,
    `${SITE.url}/api/deal-radar/confirm?token=${confirmToken}`
  );

  return NextResponse.json({ ok: true });
}
