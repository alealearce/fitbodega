import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { sendAdminTop100ClaimRequest } from '@/lib/email/resend';
import { generateSlug } from '@/lib/utils/slug';
import { CLAIMABLE_LISTS, getEntry, isClaimableList } from '@/lib/top100/registry';

const ClaimSchema = z.object({
  list: z.string().min(1).max(40),
  rank: z.number().int().min(1).max(100),
  relationship: z.string().min(10).max(2000),
  certification_id: z.string().max(60).optional().or(z.literal('')),
});

// Registrable-domain match between the claimer's email and the entry's
// website — the strongest cheap identity signal for admin review.
function emailMatchesWebsite(email: string, website: string | null | undefined): boolean {
  if (!website) return false;
  try {
    const emailDomain = email.split('@')[1]?.toLowerCase();
    const siteDomain = new URL(website).hostname.toLowerCase().replace(/^www\./, '');
    if (!emailDomain || !siteDomain) return false;
    return emailDomain === siteDomain || emailDomain.endsWith(`.${siteDomain}`) || siteDomain.endsWith(`.${emailDomain}`);
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const userClient = await createClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user?.email) {
    return NextResponse.json({ error: 'Sign in to claim your profile.' }, { status: 401 });
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

  const { list, rank, relationship, certification_id } = parsed.data;
  if (!isClaimableList(list)) {
    return NextResponse.json({ error: 'This list does not support claiming.' }, { status: 400 });
  }

  const entry = getEntry(list, rank);
  if (!entry) {
    return NextResponse.json({ error: 'Ranked entry not found.' }, { status: 404 });
  }

  const config = CLAIMABLE_LISTS[list];
  const admin = createAdminClient();

  // One live claim per entry (also enforced by a partial unique index).
  const { data: existing } = await admin
    .from('top100_claims')
    .select('id, status')
    .eq('list_id', list)
    .eq('entry_name', entry.name)
    .in('status', ['pending', 'approved'])
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      {
        error:
          existing.status === 'approved'
            ? 'This profile is already claimed.'
            : 'A claim for this profile is already under review.',
      },
      { status: 409 },
    );
  }

  // Same-name listing already in the directory? Flag it for admin review
  // instead of silently creating a near-duplicate.
  const { data: sameName } = await admin
    .from('listings')
    .select('id, slug, owner_id')
    .ilike('name', entry.name)
    .maybeSingle();

  const domainMatch = emailMatchesWebsite(user.email, entry.website);

  // The pending listing, prefilled from the ranked entry. It goes through
  // the normal admin approval queue; approval makes it live and approves
  // the claim in one step.
  // Person lists have no city — fall back to country for a clean slug.
  const slug = generateSlug(entry.name, entry.city ?? entry.country ?? '');
  const { data: listing, error: insertError } = await admin
    .from('listings')
    .insert({
      name: entry.name,
      slug,
      type: config.listingType,
      email: user.email,
      website: entry.website || null,
      city: entry.city || null,
      country: entry.country || null,
      description: [entry.who, entry.why].filter(Boolean).join(' '),
      social_instagram: entry.handles?.instagram || null,
      certification_id: certification_id || null,
      status: 'pending',
      is_featured: false,
      owner_id: user.id,
    })
    .select('id')
    .single();

  if (insertError || !listing) {
    console.error('[top100/claim] listing insert failed:', insertError?.message);
    return NextResponse.json({ error: 'Could not create your profile — try again later.' }, { status: 500 });
  }

  const { error: claimError } = await admin.from('top100_claims').insert({
    list_id: list,
    entry_name: entry.name,
    rank_at_claim: entry.rank,
    listing_id: listing.id,
    claimer_user_id: user.id,
    claimer_email: user.email,
    relationship,
    domain_match: domainMatch,
  });

  if (claimError) {
    // Unique-index race: someone else claimed between our check and insert.
    console.error('[top100/claim] claim insert failed:', claimError.message);
    await admin.from('listings').delete().eq('id', listing.id);
    return NextResponse.json({ error: 'A claim for this profile is already under review.' }, { status: 409 });
  }

  // Awaited — un-awaited promises die when Vercel freezes the function.
  try {
    await sendAdminTop100ClaimRequest({
      listTitle: config.title,
      listPage: config.page,
      rank: entry.rank,
      entryName: entry.name,
      entryWebsite: entry.website ?? null,
      listingId: listing.id,
      listingSlug: slug,
      claimerEmail: user.email,
      claimerUserId: user.id,
      relationship,
      certificationId: certification_id || null,
      domainMatch,
      sameNameListingSlug: sameName?.slug ?? null,
    });
  } catch (e) {
    console.error('[top100/claim] admin email failed:', e);
    // Claim is recorded; admin can still find it in the pending queue.
  }

  return NextResponse.json({
    message:
      "Claim received. We review claims within 2-3 business days — once approved, your profile goes live and you'll get your Top 100 badge by email.",
  });
}
