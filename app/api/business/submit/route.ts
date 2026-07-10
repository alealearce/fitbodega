import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';
import { sendWelcomeEmail, sendAdminNewListing } from '@/lib/email/resend';

const PRICE_RANGES = ['$', '$$', '$$$', '$$$$'] as const;

const SubmitSchema = z.object({
  name:        z.string().min(2).max(100),
  type:        z.enum(['gym', 'trainer', 'recovery', 'club', 'nutritionist', 'store', 'youth']),
  email:       z.string().email(),
  website:     z.string().url().optional().or(z.literal('')),
  phone:       z.string().max(30).optional().or(z.literal('')),
  address:     z.string().max(160).optional().or(z.literal('')),
  city:        z.string().min(2).max(100),
  country:     z.string().min(2).max(100),
  description: z.string().max(2000).optional(),
  tagline:     z.string().max(200).optional().or(z.literal('')),
  specialties: z.array(z.string().max(60)).max(20).optional(),
  languages:   z.array(z.string().max(40)).max(20).optional(),
  price_range: z.enum(PRICE_RANGES).optional().or(z.literal('')),
  social_instagram: z.string().url().optional().or(z.literal('')),
  social_facebook:  z.string().url().optional().or(z.literal('')),
  social_youtube:   z.string().url().optional().or(z.literal('')),
  social_tiktok:    z.string().url().optional().or(z.literal('')),
  certification_id: z.string().max(60).optional().or(z.literal('')),
});

const MAX_IMAGES     = 3;
const MAX_IMAGE_SIZE = 4 * 1024 * 1024; // 4MB
const IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png':  'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
};

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
    // The form posts multipart FormData: a JSON `payload` part + image files.
    // Plain JSON bodies are still accepted for backwards compatibility.
    let fields: unknown;
    const imageFiles: File[] = [];

    const contentType = req.headers.get('content-type') ?? '';
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const payload = formData.get('payload');
      if (typeof payload !== 'string') {
        return NextResponse.json({ error: 'Missing payload' }, { status: 400 });
      }
      fields = JSON.parse(payload);
      for (let i = 0; i < MAX_IMAGES; i++) {
        const file = formData.get(`image${i}`);
        if (file instanceof File && file.size > 0) {
          if (!(file.type in IMAGE_TYPES)) {
            return NextResponse.json({ error: 'Images must be JPG, PNG, WebP, or AVIF' }, { status: 400 });
          }
          if (file.size > MAX_IMAGE_SIZE) {
            return NextResponse.json({ error: 'Each image must be under 4MB' }, { status: 400 });
          }
          imageFiles.push(file);
        }
      }
    } else {
      fields = await req.json();
    }

    const parsed = SubmitSchema.safeParse(fields);

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
      name, type, email, website, phone, address,
      city, country, description, specialties, languages, tagline,
      price_range, social_instagram, social_facebook, social_youtube,
      social_tiktok, certification_id,
    } = parsed.data;

    const supabase = createAdminClient();
    const slug = slugify(name, city ?? '');

    // Upload images to the public listing-images bucket (service role —
    // the public form is unauthenticated). Failures are non-fatal: the
    // listing still submits and images can be added later via the dashboard.
    const imageUrls: string[] = [];
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      const ext = IMAGE_TYPES[file.type];
      const path = `submissions/${slug}/${i}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('listing-images')
        .upload(path, file, { contentType: file.type, upsert: true });
      if (uploadError) {
        console.error('[business/submit] image upload error:', uploadError.message);
        continue;
      }
      const { data: pub } = supabase.storage.from('listing-images').getPublicUrl(path);
      if (pub?.publicUrl) imageUrls.push(pub.publicUrl);
    }

    const { error: insertError } = await supabase.from('listings').insert({
      name,
      slug,
      type:          type as import('@/lib/supabase/types').ListingType,
      email,
      website:       website  || null,
      phone:         phone    || null,
      address:       address  || null,
      city:          city,
      country:       country  || null,
      description:   description || null,
      tagline:       tagline  || null,
      specialties:   specialties ?? [],
      price_range:   price_range || null,
      social_instagram: social_instagram || null,
      social_facebook:  social_facebook  || null,
      social_youtube:   social_youtube   || null,
      social_tiktok:    social_tiktok    || null,
      status:        'pending',
      is_featured:   false,
      is_verified:   false,
      owner_id:      null,
      images:        imageUrls,
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
