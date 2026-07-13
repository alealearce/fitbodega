import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient, createAdminClient } from '@/lib/supabase/server';

/**
 * POST /api/business/story — owner-scoped update of a listing's Member
 * Spotlight material (answers, photos, opt-out). Auth: the signed-in user
 * must own the listing. Multipart like /api/business/submit: a JSON
 * `payload` part + optional storyImage0..2 files.
 */

const MAX_STORY_PHOTOS = 3;
const MAX_IMAGE_SIZE = 4 * 1024 * 1024; // 4MB
const IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png':  'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
};

const StorySchema = z.object({
  slug: z.string().min(1).max(120),
  founder_story: z.object({
    origin:     z.string().max(1000).optional(),
    leap:       z.string().max(1000).optional(),
    hard_truth: z.string().max(1000).optional(),
    train_with: z.string().max(1000).optional(),
    why_you:    z.string().max(1000).optional(),
    feeling:    z.string().max(1000).optional(),
  }).optional(),
  story_opt_out: z.boolean().optional().default(false),
  // Existing photo URLs the owner chose to keep, in order. Validated against
  // the listing's current founder_images so arbitrary URLs can't be injected.
  existing_images: z.array(z.string().url()).max(MAX_STORY_PHOTOS).optional().default([]),
});

function cleanFounderStory(
  story: Record<string, string | undefined> | undefined
): Record<string, string> | null {
  if (!story) return null;
  const cleaned: Record<string, string> = {};
  for (const [key, value] of Object.entries(story)) {
    const v = typeof value === 'string' ? value.trim() : '';
    if (v) cleaned[key] = v;
  }
  return Object.keys(cleaned).length > 0 ? cleaned : null;
}

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

    const parsed = StorySchema.safeParse(JSON.parse(payload));
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json(
        { error: `Invalid input: ${firstIssue?.path?.join('.') ?? 'unknown'} — ${firstIssue?.message ?? 'invalid'}` },
        { status: 400 }
      );
    }
    const { slug, founder_story, story_opt_out, existing_images } = parsed.data;

    const supabase = createAdminClient();
    const { data: listing, error: fetchErr } = await supabase
      .from('listings')
      .select('id, owner_id, founder_images')
      .eq('slug', slug)
      .maybeSingle();

    if (fetchErr || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }
    if (listing.owner_id !== user.id) {
      return NextResponse.json({ error: 'You do not own this listing' }, { status: 403 });
    }

    // Keep only URLs that are genuinely on the listing today, preserving order.
    const current: string[] = listing.founder_images ?? [];
    const kept = existing_images.filter((u) => current.includes(u));

    // Upload any new photos.
    const newUrls: string[] = [];
    for (let i = 0; i < MAX_STORY_PHOTOS; i++) {
      const file = formData.get(`storyImage${i}`);
      if (!(file instanceof File) || file.size === 0) continue;
      if (!(file.type in IMAGE_TYPES)) {
        return NextResponse.json({ error: 'Photos must be JPG, PNG, WebP, or AVIF' }, { status: 400 });
      }
      if (file.size > MAX_IMAGE_SIZE) {
        return NextResponse.json({ error: 'Each photo must be under 4MB' }, { status: 400 });
      }
      const ext = IMAGE_TYPES[file.type];
      // Timestamped path so kept URLs from earlier uploads never get clobbered.
      const path = `submissions/${slug}/story-${Date.now()}-${i}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('listing-images')
        .upload(path, file, { contentType: file.type, upsert: true });
      if (uploadError) {
        console.error('[business/story] upload error:', uploadError.message);
        continue;
      }
      const { data: pub } = supabase.storage.from('listing-images').getPublicUrl(path);
      if (pub?.publicUrl) newUrls.push(pub.publicUrl);
    }

    const founder_images = [...kept, ...newUrls].slice(0, MAX_STORY_PHOTOS);

    const { error: updateErr } = await supabase
      .from('listings')
      .update({
        founder_story: cleanFounderStory(founder_story),
        founder_images,
        story_opt_out: story_opt_out ?? false,
      })
      .eq('id', listing.id);

    if (updateErr) {
      console.error('[business/story] update error:', updateErr);
      return NextResponse.json({ error: `DB error: ${updateErr.message}` }, { status: 500 });
    }

    return NextResponse.json({ ok: true, founder_images });
  } catch (err) {
    console.error('[business/story] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
