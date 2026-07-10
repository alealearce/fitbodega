import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';
import { sendLeadEmail } from '@/lib/email/resend';
import { rateLimit } from '@/lib/rateLimit';

export const runtime = 'nodejs';

const LeadSchema = z.object({
  listing_id:   z.string().uuid(),
  listing_name: z.string().min(1).max(100),
  sender_name:  z.string().min(1).max(100),
  sender_email: z.string().email(),
  message:      z.string().min(1).max(2000),
});

export async function POST(req: NextRequest) {
  // Rate limit: 10 lead submissions per hour per IP
  const rl = rateLimit(req, { limit: 10, windowMs: 60 * 60_000, prefix: 'leads' });
  if (!rl.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const parsed = LeadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const { listing_id, listing_name, sender_name, sender_email, message } = parsed.data;
    const supabase = createAdminClient();

    // Verify the listing exists and is approved
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id, name, email, owner_id, status')
      .eq('id', listing_id)
      .eq('status', 'approved')
      .single();

    if (listingError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Insert lead record
    const { error: insertError } = await supabase.from('leads').insert({
      listing_id,
      sender_name,
      sender_email,
      message,
      is_read: false,
    });

    if (insertError) {
      console.error('[leads] insert error:', insertError);
      return NextResponse.json({ error: 'Failed to save lead' }, { status: 500 });
    }

    // Send notification email to the listing owner (or listing email if no owner)
    const recipientEmail = listing.email;
    if (recipientEmail) {
      sendLeadEmail(
        recipientEmail,
        sender_name,
        sender_email,
        message,
        listing.name ?? listing_name
      ).catch((err) => console.error('[leads] email error:', err));
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[leads] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
