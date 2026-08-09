import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';
import { sendAdminCreatorApplication } from '@/lib/email/resend';
import { normalizeUrl, friendlyValidationError } from '@/lib/utils/validation';

const FOLLOWER_RANGES = ['5K–25K', '25K–100K', '100K–500K', '500K+'] as const;
const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'X / Twitter', 'Other'] as const;

// Accepts bare URLs ("instagram.com/p/abc") — https:// is prepended before
// validation so applicants aren't rejected for skipping the protocol.
const urlField = z.preprocess(
  (v) => (typeof v === 'string' ? normalizeUrl(v) : v),
  z.string().url()
);

const ApplySchema = z.object({
  name:            z.string().min(2).max(100),
  email:           z.string().email(),
  platform:        z.enum(PLATFORMS),
  handle:          z.string().min(1).max(100),
  follower_range:  z.enum(FOLLOWER_RANGES),
  niche:           z.string().min(2).max(120),
  has_brand_deals: z.boolean(),
  best_post_url:   urlField,
});

export async function POST(req: NextRequest) {
  try {
    const parsed = ApplySchema.safeParse(await req.json());

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      const field = firstIssue?.path?.join('.') ?? 'unknown';
      const msg   = firstIssue?.message ?? 'Invalid input';
      return NextResponse.json(
        { error: friendlyValidationError(field, msg) },
        { status: 400 }
      );
    }

    const {
      name, email, platform, handle,
      follower_range, niche, has_brand_deals, best_post_url,
    } = parsed.data;

    const supabase = createAdminClient();

    const { error: insertError } = await supabase.from('creator_applications').insert({
      name,
      email,
      platform,
      handle,
      follower_range,
      niche,
      has_brand_deals,
      best_post_url,
      status: 'pending',
    });

    if (insertError) {
      console.error('[creators/apply] insert error:', insertError);
      return NextResponse.json(
        { error: 'Something went wrong. Please try again.' },
        { status: 500 }
      );
    }

    // Awaited: un-awaited promises die when Vercel freezes the function
    // after the response is sent.
    await sendAdminCreatorApplication({
      name,
      email,
      platform,
      handle,
      followerRange: follower_range,
      niche,
      hasBrandDeals: has_brand_deals,
      bestPostUrl: best_post_url,
    }).catch((err) =>
      console.error('[creators/apply] admin email error:', err)
    );

    return NextResponse.json(
      {
        ok: true,
        message:
          "You're in the queue. We review every application — if it's a fit, you'll hear from us with next steps.",
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('[creators/apply] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
