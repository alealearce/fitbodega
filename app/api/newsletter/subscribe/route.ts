import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';
import { sendNewsletterConfirmation } from '@/lib/email/resend';
import { rateLimit } from '@/lib/rateLimit';
import { SITE } from '@/lib/config/site';
import { randomUUID } from 'crypto';

const SubscribeSchema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  // Rate limit: 5 subscribe attempts per hour per IP
  const rl = rateLimit(req, { limit: 5, windowMs: 60 * 60_000, prefix: 'newsletter' });
  if (!rl.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const parsed = SubscribeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const { email } = parsed.data;
    const supabase = createAdminClient();

    // Check if already subscribed
    const { data: existing } = await supabase
      .from('newsletter_subscribers')
      .select('id, is_confirmed, unsubscribe_token')
      .eq('email', email)
      .maybeSingle();

    if (existing?.is_confirmed) {
      // Already confirmed — silently return success (don't leak info)
      return NextResponse.json({ ok: true });
    }

    const unsubscribe_token = randomUUID();

    if (existing) {
      // Exists but not confirmed — resend confirmation
      await supabase
        .from('newsletter_subscribers')
        .update({ unsubscribe_token })
        .eq('email', email);
    } else {
      // New subscriber
      await supabase.from('newsletter_subscribers').insert({
        email,
        is_confirmed:   false,
        confirmed_at:   null,
        unsubscribe_token,
      });
    }

    // Send confirmation email with unsubscribe token as confirmation link
    const confirmUrl = `${SITE.url}/api/newsletter/unsubscribe?token=${unsubscribe_token}&confirm=true`;
    await sendNewsletterConfirmation(email, confirmUrl);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[newsletter/subscribe] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
