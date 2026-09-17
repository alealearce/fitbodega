import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { CREATOR_QUESTIONS } from '@/lib/config/site';
import type { CreatorProfile } from '@/lib/creators/profile';
import { isCreatorSpotlightEligible, creatorAnsweredCount } from '@/lib/social/eligibility';
import { sendAdminCreatorSpotlightReady } from '@/lib/email/resend';

/**
 * POST /api/creators/spotlight — a creator's own Creator Spotlight material
 * (answers, photos, opt-out). Twin of /api/business/story.
 *
 * Auth: the signed-in user's confirmed email must match a creator_profiles
 * row. Profiles have no owner_id (they are token-keyed), so the confirmed
 * email is the ownership proof; the first save also records user_id.
 * Multipart: a JSON `payload` part + optional spotlightImage0..2 files.
 */

const MAX_PHOTOS = 3;
const MAX_IMAGE_SIZE = 4 * 1024 * 1024; // 4MB
const IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png':  'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
};

const answerShape = Object.fromEntries(
  CREATOR_QUESTIONS.map((q) => [q.key, z.string().max(1000).optional()])
);

const SpotlightSchema = z.object({
  spotlight_story: z.object(answerShape).optional(),
  spotlight_opt_out: z.boolean().optional().default(false),
  // Existing photo URLs the creator chose to keep, in order. Validated
  // against the row's current spotlight_images so arbitrary URLs can't land.
  existing_images: z.array(z.string().url()).max(MAX_PHOTOS).optional().default([]),
});

function cleanAnswers(
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
    if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
    if (!user.email || !user.email_confirmed_at) {
      return NextResponse.json({ error: 'Confirm your email address first' }, { status: 403 });
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

    const parsed = SpotlightSchema.safeParse(JSON.parse(payload));
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return NextResponse.json(
        { error: `Invalid input: ${issue?.path?.join('.') ?? 'unknown'} — ${issue?.message ?? 'invalid'}` },
        { status: 400 }
      );
    }
    const { spotlight_story, spotlight_opt_out, existing_images } = parsed.data;

    const supabase = createAdminClient();
    const { data: profileData, error: fetchErr } = await supabase
      .from('creator_profiles')
      .select('id, name, email, spotlight_story, spotlight_images, spotlight_opt_out, spotlight_post_id')
      .eq('email', user.email.toLowerCase())
      .maybeSingle();
    if (fetchErr || !profileData) {
      return NextResponse.json({ error: 'No creator profile uses this email' }, { status: 404 });
    }
    const profile = profileData as Pick<
      CreatorProfile,
      'id' | 'name' | 'email' | 'spotlight_story' | 'spotlight_images' | 'spotlight_opt_out' | 'spotlight_post_id'
    >;
    const wasEligible = isCreatorSpotlightEligible(profile);

    // Keep only URLs that are genuinely on the row today, preserving order.
    const current: string[] = profile.spotlight_images ?? [];
    const kept = existing_images.filter((u) => current.includes(u));

    const newUrls: string[] = [];
    for (let i = 0; i < MAX_PHOTOS; i++) {
      const file = formData.get(`spotlightImage${i}`);
      if (!(file instanceof File) || file.size === 0) continue;
      if (!(file.type in IMAGE_TYPES)) {
        return NextResponse.json({ error: 'Photos must be JPG, PNG, WebP, or AVIF' }, { status: 400 });
      }
      if (file.size > MAX_IMAGE_SIZE) {
        return NextResponse.json({ error: 'Each photo must be under 4MB' }, { status: 400 });
      }
      const ext = IMAGE_TYPES[file.type];
      const path = `creators/${profile.id}/spotlight-${Date.now()}-${i}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('listing-images')
        .upload(path, file, { contentType: file.type, upsert: true });
      if (uploadError) {
        console.error('[creators/spotlight] upload error:', uploadError.message);
        continue;
      }
      const { data: pub } = supabase.storage.from('listing-images').getPublicUrl(path);
      if (pub?.publicUrl) newUrls.push(pub.publicUrl);
    }

    const spotlight_images = [...kept, ...newUrls].slice(0, MAX_PHOTOS);
    const next = {
      spotlight_story: cleanAnswers(spotlight_story),
      spotlight_images,
      spotlight_opt_out: spotlight_opt_out ?? false,
    };

    const { error: updateErr } = await supabase
      .from('creator_profiles')
      .update({ ...next, user_id: user.id, updated_at: new Date().toISOString() })
      .eq('id', profile.id);
    if (updateErr) {
      console.error('[creators/spotlight] update error:', updateErr);
      return NextResponse.json({ error: `DB error: ${updateErr.message}` }, { status: 500 });
    }

    // One admin nudge, the first time the material qualifies. Awaited: an
    // un-awaited promise dies when Vercel freezes the function.
    const after = { ...next, spotlight_post_id: profile.spotlight_post_id };
    if (!wasEligible && isCreatorSpotlightEligible(after)) {
      await sendAdminCreatorSpotlightReady({
        name: profile.name,
        email: profile.email,
        answered: creatorAnsweredCount(after),
        photos: spotlight_images.length,
      }).catch((err) => console.error('[creators/spotlight] admin email failed:', err));
    }

    return NextResponse.json({ ok: true, spotlight_images });
  } catch (err) {
    console.error('[creators/spotlight] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
