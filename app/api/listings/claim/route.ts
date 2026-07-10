import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { sendAdminClaimRequest } from '@/lib/email/resend';

const ClaimSchema = z.object({
  slug: z.string().min(1).max(120),
  certification_id: z.string().max(60).optional().or(z.literal('')),
  relationship: z.string().min(10).max(2000),
});

export async function POST(req: NextRequest) {
  const userClient = await createClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user?.email) {
    return NextResponse.json({ error: 'Sign in to claim a listing.' }, { status: 401 });
  }

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const parsed = ClaimSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { error: `${first?.path?.join('.') ?? 'input'}: ${first?.message}` },
      { status: 400 },
    );
  }

  const { slug, certification_id, relationship } = parsed.data;

  const admin = createAdminClient();
  const { data: listing, error } = await admin
    .from('listings')
    .select('id, name, slug, type, owner_id')
    .eq('slug', slug)
    .maybeSingle();

  if (error || !listing) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
  }
  if (listing.owner_id) {
    return NextResponse.json({ error: 'This listing is already claimed.' }, { status: 409 });
  }

  try {
    await sendAdminClaimRequest({
      listingId: listing.id,
      listingName: listing.name,
      listingSlug: listing.slug,
      listingType: listing.type,
      claimerEmail: user.email,
      claimerUserId: user.id,
      certificationId: certification_id || null,
      relationship,
    });
  } catch (e) {
    console.error('[claim] email send failed:', e);
    return NextResponse.json({ error: 'Could not send claim request — try again later.' }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    message: "We've received your claim and will review within 2–3 business days.",
  });
}
