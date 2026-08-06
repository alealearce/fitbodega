import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { sendApprovalEmail, sendRejectionEmail, sendSpotlightLiveEmail, sendTop100BadgeEmail } from '@/lib/email/resend';
import { SITE, isAdminEmail } from '@/lib/config/site';
import { getListingUrl } from '@/lib/utils/listingUrl';
import { runMemberSpotlight } from '@/lib/social/story';
import { CLAIMABLE_LISTS, getEntryByName, isClaimableList } from '@/lib/top100/registry';

// Approve runs the spotlight pipeline inline (Claude + Blotato) — allow time.
export const maxDuration = 300;

const VALID_ACTIONS = ['approve', 'reject', 'feature', 'verify', 'delete', 'story'] as const;
type AdminAction = typeof VALID_ACTIONS[number];

export async function POST(req: NextRequest) {
  const userClient = await createClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { action, id, reason } = await req.json() as {
      action: string;
      id: string;
      reason?: string;
    };

    if (!VALID_ACTIONS.includes(action as AdminAction) || !id) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const supabase = createAdminClient();

    switch (action as AdminAction) {
      case 'approve': {
        const { data: listing, error: updateError } = await supabase
          .from('listings')
          .update({ status: 'approved' })
          .eq('id', id)
          .select('name, slug, email, type')
          .single();

        if (updateError) {
          console.error('[admin/approve] update error:', updateError);
          return NextResponse.json(
            { error: `Approval failed: ${updateError.message}` },
            { status: 500 }
          );
        }

        // Member Spotlight pipeline — failure must never fail the approval.
        // Skips itself when ineligible (opt-out, <3 answers, no photo, or
        // already published via story_post_id).
        let storyStatus: 'published' | 'skipped' | 'failed' = 'skipped';
        let storyUrl: string | undefined;
        try {
          const spotlight = await runMemberSpotlight(id);
          if (spotlight.ok && spotlight.postSlug) {
            storyStatus = 'published';
            storyUrl = spotlight.storyUrl;
          } else if (!spotlight.ok) {
            storyStatus = 'failed';
            console.error('[admin/approve] spotlight failed:', spotlight.error);
          }
        } catch (err) {
          storyStatus = 'failed';
          console.error('[admin/approve] spotlight threw:', err);
        }

        // Top 100 claim: approving the listing approves the claim and sends
        // the badge email instead of the generic approval email.
        let badgeSent = false;
        const { data: approvedClaims } = await supabase
          .from('top100_claims')
          .update({ status: 'approved' })
          .eq('listing_id', id)
          .eq('status', 'pending')
          .select('list_id, entry_name, rank_at_claim, claimer_email');

        if (listing?.slug && approvedClaims?.length) {
          const claim = approvedClaims[0];
          if (isClaimableList(claim.list_id)) {
            const config = CLAIMABLE_LISTS[claim.list_id];
            const rank = getEntryByName(claim.list_id, claim.entry_name)?.rank ?? claim.rank_at_claim;
            const badgeUrl = `${SITE.url}/api/badge/${listing.slug}?list=${claim.list_id}`;
            const profileUrl = `${SITE.url}${getListingUrl(listing.type, listing.slug)}`;
            const embedCode = `<a href="${SITE.url}${config.page}" target="_blank" rel="noopener"><img src="${badgeUrl}" alt="FitBodega ${config.title} — ${claim.entry_name}, ranked #${rank}" width="360" height="88" style="border:0" /></a>`;
            // Awaited — un-awaited promises die when Vercel freezes the function.
            await sendTop100BadgeEmail({
              to: claim.claimer_email,
              entryName: claim.entry_name,
              listTitle: config.title,
              listPage: config.page,
              rank,
              badgeUrl,
              embedCode,
              profileUrl,
            }).then(() => { badgeSent = true; }).catch((err) =>
              console.error('[admin/approve] badge email error:', err)
            );
          }
        }

        // Send approval email to listing owner (one email covers listing +
        // spotlight). Skipped when the badge email already told them.
        // Awaited — un-awaited promises die when Vercel freezes the
        // function after the response is sent.
        if (!badgeSent && listing?.email && listing?.name && listing?.slug) {
          const listingUrl = `${SITE.url}${getListingUrl(listing.type, listing.slug)}`;
          await sendApprovalEmail(listing.email, listing.name, listing.name, listingUrl, storyUrl).catch((err) =>
            console.error('[admin/approve] approval email error:', err)
          );
        }
        return NextResponse.json({ ok: true, storyStatus, storyUrl });
      }

      case 'reject': {
        if (!reason) {
          return NextResponse.json({ error: 'Rejection reason required' }, { status: 400 });
        }

        const { data: listing, error: updateError } = await supabase
          .from('listings')
          .update({ status: 'rejected' })
          .eq('id', id)
          .select('name, email')
          .single();

        if (updateError) {
          console.error('[admin/reject] update error:', updateError);
          return NextResponse.json(
            { error: `Rejection failed: ${updateError.message}` },
            { status: 500 }
          );
        }

        // Rejecting the listing frees any pending Top 100 claim slot.
        await supabase
          .from('top100_claims')
          .update({ status: 'rejected' })
          .eq('listing_id', id)
          .eq('status', 'pending');

        // Send rejection email. Awaited — see note on the approval email above.
        if (listing?.email && listing?.name) {
          await sendRejectionEmail(listing.email, listing.name, listing.name, reason).catch((err) =>
            console.error('[admin/reject] rejection email error:', err)
          );
        }
        break;
      }

      case 'feature': {
        // Toggle is_featured
        const { data: current, error: fetchError } = await supabase
          .from('listings')
          .select('is_featured')
          .eq('id', id)
          .single();

        if (fetchError || !current) {
          return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
        }

        const { error: toggleError } = await supabase
          .from('listings')
          .update({ is_featured: !current.is_featured })
          .eq('id', id);

        if (toggleError) {
          return NextResponse.json({ error: toggleError.message }, { status: 500 });
        }
        break;
      }

      case 'verify': {
        // Toggle is_verified
        const { data: current, error: fetchError } = await supabase
          .from('listings')
          .select('is_verified')
          .eq('id', id)
          .single();

        if (fetchError || !current) {
          return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
        }

        const { error: toggleError } = await supabase
          .from('listings')
          .update({ is_verified: !current.is_verified })
          .eq('id', id);

        if (toggleError) {
          return NextResponse.json({ error: toggleError.message }, { status: 500 });
        }
        break;
      }

      case 'story': {
        // Manual/retry spotlight run for an already-approved listing.
        // Idempotent: runMemberSpotlight skips when story_post_id is set.
        const result = await runMemberSpotlight(id);
        if (!result.ok) {
          return NextResponse.json(
            { ok: false, storyStatus: 'failed', error: result.error },
            { status: 500 }
          );
        }
        if (result.skipped) {
          return NextResponse.json({ ok: true, storyStatus: 'skipped', reason: result.skipped });
        }

        const { data: listing } = await supabase
          .from('listings')
          .select('name, email')
          .eq('id', id)
          .single();
        if (listing?.email && listing?.name && result.storyUrl) {
          await sendSpotlightLiveEmail(listing.email, listing.name, result.storyUrl).catch((err) =>
            console.error('[admin/story] spotlight email error:', err)
          );
        }
        return NextResponse.json({ ok: true, storyStatus: 'published', storyUrl: result.storyUrl });
      }

      case 'delete': {
        // Permanently remove the listing. Clean up dependent rows first so FK
        // constraints don't block the delete (reviews + any social-post log rows).
        await supabase.from('reviews').delete().eq('listing_id', id);
        await supabase.from('social_posts').delete().eq('ref_id', id);

        const { error: deleteError } = await supabase.from('listings').delete().eq('id', id);
        if (deleteError) {
          console.error('[admin/delete] delete error:', deleteError);
          return NextResponse.json({ error: `Delete failed: ${deleteError.message}` }, { status: 500 });
        }
        break;
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin/action] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
