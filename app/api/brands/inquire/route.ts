import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';
import { sendAdminBrandInquiry } from '@/lib/email/resend';
import { normalizeUrl, friendlyValidationError } from '@/lib/utils/validation';

const CATEGORIES = [
  'Supplements & nutrition',
  'Recovery studio or gym',
  'Fitness apparel',
  'Fitness equipment',
  'Wellness products',
  'Other',
] as const;

const BUDGET_RANGES = ['Under $5K', '$5K–$15K', '$15K–$50K', '$50K+', 'Not sure yet'] as const;

// Accepts bare domains ("yourbrand.com") — https:// is prepended before
// validation so people aren't rejected for skipping the protocol.
const urlField = z.preprocess(
  (v) => (typeof v === 'string' ? normalizeUrl(v) : v),
  z.string().url().optional().or(z.literal(''))
);

const InquireSchema = z.object({
  name:           z.string().min(2).max(100),
  email:          z.string().email(),
  company:        z.string().min(2).max(100),
  website:        urlField,
  category:       z.enum(CATEGORIES),
  target_market:  z.string().min(2).max(1000),
  liked_creators: z.string().max(1000).optional().or(z.literal('')),
  budget_range:   z.enum(BUDGET_RANGES).optional().or(z.literal('')),
  notes:          z.string().max(1000).optional().or(z.literal('')),
});

export async function POST(req: NextRequest) {
  try {
    const parsed = InquireSchema.safeParse(await req.json());

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
      name, email, company, website, category,
      target_market, liked_creators, budget_range, notes,
    } = parsed.data;

    const supabase = createAdminClient();

    const { error: insertError } = await supabase.from('brand_inquiries').insert({
      name,
      email,
      company,
      website:        website        || null,
      category,
      target_market,
      liked_creators: liked_creators || null,
      budget_range:   budget_range   || null,
      notes:          notes          || null,
      status: 'pending',
    });

    if (insertError) {
      console.error('[brands/inquire] insert error:', insertError);
      return NextResponse.json(
        { error: 'Something went wrong. Please try again.' },
        { status: 500 }
      );
    }

    // Awaited: un-awaited promises die when Vercel freezes the function
    // after the response is sent.
    await sendAdminBrandInquiry({
      name,
      email,
      company,
      website:       website || '',
      category,
      targetMarket:  target_market,
      likedCreators: liked_creators || '',
      budgetRange:   budget_range || '',
      notes:         notes || '',
    }).catch((err) =>
      console.error('[brands/inquire] admin email error:', err)
    );

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error('[brands/inquire] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
