import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';
import { sendWelcomeEmail, sendAdminNewListing } from '@/lib/email/resend';

const SubmitSchema = z.object({
  name:        z.string().min(2).max(100),
  type:        z.enum(['gym', 'trainer', 'recovery', 'club', 'nutritionist', 'store', 'youth']),
  email:       z.string().email(),
  website:     z.string().url().optional().or(z.literal('')),
  phone:       z.string().max(30).optional(),
  city:        z.string().min(2).max(100),
  country:     z.string().min(2).max(100),
  description: z.string().max(2000).optional(),
  specialties: z.array(z.string().max(60)).max(20).optional(),
  languages:   z.array(z.string().max(40)).max(20).optional(),
  tagline:     z.string().max(200).optional(),
  certification_id: z.string().max(60).optional().or(z.literal('')),
});

function slugify(name: string, city: string): string {
  const base = `${name}-${city}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base}-${suffix}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = SubmitSchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      const field = firstIssue?.path?.join('.') ?? 'unknown';
      const msg   = firstIssue?.message ?? 'Invalid input';
      return NextResponse.json(
        { error: `Invalid input: ${field} — ${msg}` },
        { status: 400 }
      );
    }

    const {
      name, type, email, website, phone,
      city, country, description, specialties, languages, tagline,
      certification_id,
    } = parsed.data;

    const supabase = createAdminClient();
    const slug = slugify(name, city ?? '');

    const { error: insertError } = await supabase.from('listings').insert({
      name,
      slug,
      type:          type as import('@/lib/supabase/types').ListingType,
      email,
      website:       website  || null,
      phone:         phone    || null,
      city:          city,
      country:       country  || null,
      description:   description || null,
      tagline:       tagline  || null,
      specialties:   specialties ?? [],
      status:        'pending',
      is_featured:   false,
      is_verified:   false,
      owner_id:      null,
      images:        [],
      experience_levels: [],
      languages:     languages ?? [],
      plan:          'free',
      certification_id: certification_id || null,
    });

    if (insertError) {
      console.error('[business/submit] insert error:', insertError);
      return NextResponse.json(
        { error: `DB error: ${insertError.message}` },
        { status: 500 }
      );
    }

    // Send emails — fire-and-forget to keep response fast
    sendWelcomeEmail(email, name).catch((err) =>
      console.error('[business/submit] welcome email error:', err)
    );
    sendAdminNewListing(name, type, email).catch((err) =>
      console.error('[business/submit] admin email error:', err)
    );

    return NextResponse.json({ ok: true, slug }, { status: 201 });
  } catch (err) {
    console.error('[business/submit] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
