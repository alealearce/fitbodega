import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { normalizeUrl, friendlyValidationError } from '@/lib/utils/validation';

/**
 * POST /api/business/update — owner-scoped edit of a listing's public
 * details (name, tagline, description, contact, socials, specialties,
 * photos). Auth: the signed-in user must own the listing. Multipart like
 * /api/business/story: a JSON `payload` part + optional image0..2 files.
 */

const MAX_IMAGES = 3;
const MAX_IMAGE_SIZE = 4 * 1024 * 1024; // 4MB
const IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png':  'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
};

// URL fields accept bare domains ("yourspace.com") — https:// is prepended
// before validation so people aren't rejected for skipping the protocol.
const urlField = z.preprocess(
  (v) => (typeof v === 'string' ? normalizeUrl(v) : v),
  z.string().url().optional().or(z.literal(''))
);

const UpdateSchema = z.object({
  slug:        z.string().min(1).max(120),
  name:        z.string().min(2).max(100),
  tagline:     z.string().max(200).optional().or(z.literal('')),
  description: z.string().max(2000).optional().or(z.literal('')),
  email:       z.string().email(),
  phone:       z.string().max(30).optional().or(z.literal('')),
  website:     urlField,
  address:     z.string().max(160).optional().or(z.literal('')),
  city:        z.string().min(2).max(100),
  country:     z.string().min(2).max(100),
  specialties: z.array(z.string().max(60)).max(20).optional().default([]),
  social_instagram: urlField,
  social_facebook:  urlField,
  social_youtube:   urlField,
  social_tiktok:    urlField,
  // Existing photo URLs the owner chose to keep, in order. Validated against
  // the listing's current images so arbitrary URLs can't be injected.
  existing_images: z.array(z.string().url()).max(MAX_IMAGES).optional().default([]),
});

export async function POST(req: NextRequest) {
  try {
    const userClient = await createClient();
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
    }

    const contentType = req.headers.get('content-type') ?? '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Expected multipart form data' }, { status: 400 });
    }

    const formData = await req.formData();
    const payload = formData.get('payload');
    if (typeof payload !== 'string') {
      return NextResponse.json({ error: 'Missing payload' }, { status: 400 });
    }

    const parsed = UpdateSchema.safeParse(JSON.parse(payload));
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json(
        { error: friendlyValidationError(firstIssue?.path?.join('.') ?? 'unknown', firstIssue?.message ?? 'invalid') },
        { status: 400 }
      );
    }
    const { slug, existing_images, ...fields } = parsed.data;

    const supabase = createAdminClient();
    const { data: listing, error: fetchErr } = await supabase
      .from('listings')
      .select('id, owner_id, images')
      .eq('slug', slug)
      .maybeSingle();

    if (fetchErr || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }
    if (listing.owner_id !== user.id) {
      return NextResponse.json({ error: 'You do not own this listing' }, { status: 403 });
    }

    // Keep only URLs that are genuinely on the listing today, preserving order.
    const current: string[] = listing.images ?? [];
    const kept = existing_images.filter((u) => current.includes(u));

    // Upload any new photos.
    const newUrls: string[] = [];
    for (let i = 0; i < MAX_IMAGES; i++) {
      const file = formData.get(`image${i}`);
      if (!(file instanceof File) || file.size === 0) continue;
      if (!(file.type in IMAGE_TYPES)) {
        return NextResponse.json({ error: 'Images must be JPG, PNG, WebP, or AVIF' }, { status: 400 });
      }
      if (file.size > MAX_IMAGE_SIZE) {
        return NextResponse.json({ error: 'Each image must be under 4MB' }, { status: 400 });
      }
      const ext = IMAGE_TYPES[file.type];
      // Timestamped path so kept URLs from earlier uploads never get clobbered.
      const path = `submissions/${slug}/img-${Date.now()}-${i}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('listing-images')
        .upload(path, file, { contentType: file.type, upsert: true });
      if (uploadError) {
        console.error('[business/update] upload error:', uploadError.message);
        continue;
      }
      const { data: pub } = supabase.storage.from('listing-images').getPublicUrl(path);
      if (pub?.publicUrl) newUrls.push(pub.publicUrl);
    }

    const images = [...kept, ...newUrls].slice(0, MAX_IMAGES);

    const { error: updateErr } = await supabase
      .from('listings')
      .update({
        name:        fields.name,
        tagline:     fields.tagline     || null,
        description: fields.description || null,
        email:       fields.email,
        phone:       fields.phone       || null,
        website:     fields.website     || null,
        address:     fields.address     || null,
        city:        fields.city,
        country:     fields.country,
        specialties: fields.specialties,
        social_instagram: fields.social_instagram || null,
        social_facebook:  fields.social_facebook  || null,
        social_youtube:   fields.social_youtube   || null,
        social_tiktok:    fields.social_tiktok    || null,
        images,
      })
      .eq('id', listing.id);

    if (updateErr) {
      console.error('[business/update] update error:', updateErr);
      return NextResponse.json({ error: `DB error: ${updateErr.message}` }, { status: 500 });
    }

    return NextResponse.json({ ok: true, images });
  } catch (err) {
    console.error('[business/update] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
