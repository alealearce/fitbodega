import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { SITE } from '@/lib/config/site';
import {
  AUDIENCE_RANGES,
  CREATOR_PLATFORMS,
  normalizeHandle,
  type CreatorProfile,
} from '@/lib/creators/profile';
import { sendAdminCreatorProfile, sendCreatorProfileSaved } from '@/lib/email/resend';
import { rateLimit } from '@/lib/rateLimit';
import { createAdminClient } from '@/lib/supabase/server';
import { friendlyValidationError, normalizeUrl } from '@/lib/utils/validation';

// Creator network profile — step 2 of the creator flow. No auth account: the
// profile is keyed to the email captured in step 1 and edited through the
// token link mailed back on save.

const ProfileSchema = z
  .object({
    email:            z.string().email(),
    name:             z.string().min(2).max(100),
    niche:            z.string().min(2).max(120),
    location:         z.string().max(120).optional().or(z.literal('')),
    audience_size:    z.enum(AUDIENCE_RANGES),
    primary_platform: z.enum(CREATOR_PLATFORMS),
    instagram:        z.string().max(120).optional().or(z.literal('')),
    tiktok:           z.string().max(120).optional().or(z.literal('')),
    youtube:          z.string().max(120).optional().or(z.literal('')),
    website:          z.string().max(300).optional().or(z.literal('')),
    content_examples: z.array(z.string().max(500)).max(3).optional(),
    note:             z.string().max(300).optional().or(z.literal('')),
    edit_token:       z.string().max(100).optional().or(z.literal('')),
  })
  .refine((d) => d.instagram?.trim() || d.tiktok?.trim() || d.youtube?.trim() || d.website?.trim(), {
    message: 'Add at least one handle or link — brands need somewhere to look.',
  });

function editUrlFor(token: string): string {
  return `${SITE.url}/creators/profile?token=${token}`;
}

// GET /api/creators/profile?token=… — load a profile for editing.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });

  const supabase = createAdminClient();
  const { data } = await supabase
    .from('creator_profiles')
    .select('*')
    .eq('edit_token', token)
    .maybeSingle();

  if (!data) return NextResponse.json({ error: 'No profile for that link' }, { status: 404 });

  const p = data as CreatorProfile;
  return NextResponse.json({
    profile: {
      email: p.email,
      name: p.name,
      niche: p.niche,
      location: p.location ?? '',
      audience_size: p.audience_size,
      primary_platform: p.primary_platform,
      instagram: p.instagram ?? '',
      tiktok: p.tiktok ?? '',
      youtube: p.youtube ?? '',
      website: p.website ?? '',
      content_examples: p.content_examples,
      note: p.note ?? '',
      edit_token: p.edit_token,
    },
  });
}

export async function POST(req: NextRequest) {
  const rl = rateLimit(req, { limit: 10, windowMs: 60 * 60_000, prefix: 'creator-profile' });
  if (!rl.success) {
    return NextResponse.json({ error: 'Too many submissions — try again later.' }, { status: 429 });
  }

  const parsed = ProfileSchema.safeParse(await req.json());
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = issue?.path?.join('.') ?? '';
    const message = issue?.message ?? 'Check the form and try again.';
    // The cross-field rule (needs one handle) already reads as a sentence;
    // single-field issues get the field name in front.
    return NextResponse.json(
      { error: field ? friendlyValidationError(field, message) : message },
      { status: 400 }
    );
  }
  const d = parsed.data;
  const email = d.email.toLowerCase();
  const supabase = createAdminClient();

  const row = {
    email,
    name:             d.name.trim(),
    niche:            d.niche.trim(),
    location:         d.location?.trim() || null,
    audience_size:    d.audience_size,
    primary_platform: d.primary_platform,
    instagram:        normalizeHandle(d.instagram),
    tiktok:           normalizeHandle(d.tiktok),
    youtube:          normalizeHandle(d.youtube),
    website:          d.website?.trim() ? normalizeUrl(d.website.trim()) : null,
    content_examples: (d.content_examples ?? [])
      .map((u) => u.trim())
      .filter(Boolean)
      .map((u) => normalizeUrl(u)),
    note:             d.note?.trim() || null,
    updated_at:       new Date().toISOString(),
  };

  const { data: existing } = await supabase
    .from('creator_profiles')
    .select('id, edit_token, email, name')
    .eq('email', email)
    .maybeSingle();

  // Knowing an address must never be enough to overwrite that person's
  // profile. Edits need the token from their emailed link; a token-less post
  // to a taken address mails the link to the owner and stops there.
  if (existing && d.edit_token !== existing.edit_token) {
    await sendCreatorProfileSaved({
      to: email,
      name: (existing.name as string) ?? d.name.trim(),
      editUrl: editUrlFor(existing.edit_token as string),
      isNew: false,
    }).catch((err) => console.error('[creators/profile] edit-link email failed:', err));
    return NextResponse.json(
      {
        error:
          'A profile already uses that email. We just sent the edit link to that inbox — open it to make changes.',
      },
      { status: 409 }
    );
  }

  // Link the profile to the Deal Radar subscriber row when one exists — that
  // pairing is what tells us who signed up but never finished a profile.
  const { data: subscriber } = await supabase
    .from('dr_subscribers')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  let token: string;
  if (existing) {
    const { error } = await supabase
      .from('creator_profiles')
      .update({ ...row, subscriber_id: subscriber?.id ?? null })
      .eq('id', existing.id);
    if (error) {
      console.error('[creators/profile] update error:', error);
      return NextResponse.json({ error: 'Could not save your profile.' }, { status: 500 });
    }
    token = existing.edit_token as string;
  } else {
    const { data: inserted, error } = await supabase
      .from('creator_profiles')
      .insert({ ...row, subscriber_id: subscriber?.id ?? null })
      .select('edit_token')
      .single();
    if (error || !inserted) {
      console.error('[creators/profile] insert error:', error);
      return NextResponse.json({ error: 'Could not save your profile.' }, { status: 500 });
    }
    token = inserted.edit_token as string;
  }

  const editUrl = editUrlFor(token);

  // Awaited: un-awaited promises die when Vercel freezes the function.
  await sendCreatorProfileSaved({
    to: email,
    name: row.name,
    editUrl,
    isNew: !existing,
  }).catch((err) => console.error('[creators/profile] creator email failed:', err));

  if (!existing) {
    const handles = [
      row.instagram && `IG @${row.instagram}`,
      row.tiktok && `TikTok @${row.tiktok}`,
      row.youtube && `YouTube @${row.youtube}`,
      row.website,
    ]
      .filter(Boolean)
      .join(' · ');
    await sendAdminCreatorProfile({
      name: row.name,
      email,
      niche: row.niche,
      audienceSize: row.audience_size,
      platform: row.primary_platform,
      handles,
    }).catch((err) => console.error('[creators/profile] admin email failed:', err));
  }

  return NextResponse.json({ ok: true, editUrl, isNew: !existing });
}
