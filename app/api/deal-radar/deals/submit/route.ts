import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sendAdminDealSubmission } from '@/lib/email/resend';
import { rateLimit } from '@/lib/rateLimit';
import { createAdminClient } from '@/lib/supabase/server';

// Public: a brand posts a deal to the marketplace (form at /for-brands).
// Lands in dr_deal_submissions as 'pending'; the admin approves at
// /admin/deal-radar before anything appears on the board. Free for now.

const SubmissionSchema = z.object({
  brandName: z.string().min(2).max(120),
  brandWebsite: z.string().url().max(300).optional().or(z.literal('')),
  contactEmail: z.string().email().max(200),
  offerType: z.enum(['paid', 'gifted', 'commission']),
  compensationText: z.string().min(2).max(300),
  deliverables: z.string().min(5).max(600),
  platforms: z.array(z.string().max(40)).max(8),
  applyUrl: z.string().url().max(400).optional().or(z.literal('')),
  notes: z.string().max(1000).optional().or(z.literal('')),
});

export async function POST(req: NextRequest) {
  const rl = rateLimit(req, { limit: 5, windowMs: 60 * 60_000, prefix: 'deal-submit' });
  if (!rl.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const parsed = SubmissionSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }
  const s = parsed.data;

  const supabase = createAdminClient();
  const { error } = await supabase.from('dr_deal_submissions').insert({
    brand_name: s.brandName,
    brand_website: s.brandWebsite || null,
    contact_email: s.contactEmail.toLowerCase(),
    offer_type: s.offerType,
    compensation_text: s.compensationText,
    deliverables: s.deliverables,
    platforms: s.platforms.map((p) => p.toLowerCase()),
    apply_url: s.applyUrl || null,
    notes: s.notes || null,
  });
  if (error) {
    return NextResponse.json({ error: 'Could not submit' }, { status: 500 });
  }

  await sendAdminDealSubmission({
    brandName: s.brandName,
    contactEmail: s.contactEmail,
    offerType: s.offerType,
    compensation: s.compensationText,
    deliverables: s.deliverables,
    website: s.brandWebsite || null,
  });

  return NextResponse.json({ ok: true });
}
