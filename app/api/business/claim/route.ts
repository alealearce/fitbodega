import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rateLimit';
import { SITE } from '@/lib/config/site';

const ClaimSchema = z.object({
  slug:    z.string().min(1).max(120),
  email:   z.string().email(),
  message: z.string().min(10).max(2000),
});

export async function POST(req: NextRequest) {
  // Rate limit: 5 claim attempts per hour per IP
  const rl = rateLimit(req, { limit: 5, windowMs: 60 * 60_000, prefix: 'claim' });
  if (!rl.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const parsed = ClaimSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const { slug, email, message } = parsed.data;
    const supabase = createAdminClient();

    // Verify listing exists and is unclaimed
    const { data: listing, error: fetchError } = await supabase
      .from('listings')
      .select('id, name, owner_id, status')
      .eq('slug', slug)
      .single();

    if (fetchError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    if (listing.owner_id) {
      return NextResponse.json(
        { error: 'This listing already has an owner' },
        { status: 409 }
      );
    }

    // Notify admin of the claim request
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: SITE.fromEmail,
      to:   SITE.email,
      subject: `Claim request for "${listing.name}" — FitBodega`,
      html: `
        <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:24px;">
          <h2 style="color:#111111;">New Listing Claim Request</h2>
          <p><strong>Listing:</strong> ${listing.name}</p>
          <p><strong>Slug:</strong> ${slug}</p>
          <p><strong>Listing ID:</strong> ${listing.id}</p>
          <p><strong>Claimant Email:</strong> <a href="mailto:${email}">${email}</a></p>
          <p><strong>Message:</strong></p>
          <blockquote style="border-left:3px solid #111111;padding-left:16px;margin:0 0 16px;">${message}</blockquote>
          <a href="${SITE.url}/admin" style="display:inline-block;background:#111111;color:#fff;padding:12px 24px;border-radius:4px;text-decoration:none;">
            Review in Admin
          </a>
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[business/claim] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
