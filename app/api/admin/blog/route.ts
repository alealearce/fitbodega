import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { isAdminEmail } from '@/lib/config/site';

// ── Zod schemas ───────────────────────────────────────────────────────────────

const CreatePostSchema = z.object({
  title:                 z.string().min(1).max(200),
  slug:                  z.string().min(1).max(200).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
  excerpt:               z.string().max(500).optional().nullable(),
  content:               z.string().min(1),
  author:                z.string().min(1).max(100),
  author_avatar:         z.string().url().optional().nullable(),
  cover_image:           z.string().url().optional().nullable(),
  tags:                  z.array(z.string().max(60)).max(10).optional(),
  is_published:          z.boolean().optional(),
  reading_time_minutes:  z.number().int().min(1).max(60).optional().nullable(),
});

const UpdatePostSchema = CreatePostSchema.partial().extend({
  id: z.string().uuid(),
});

const DeleteSchema = z.object({
  id: z.string().uuid(),
});

// ── Auth helper ───────────────────────────────────────────────────────────────

async function verifyAdmin(_req: NextRequest): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return !!user && isAdminEmail(user.email);
}

// ── POST — create blog post ───────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = CreatePostSchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json(
        { error: `Invalid input: ${firstIssue?.path?.join('.')} — ${firstIssue?.message}` },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Check slug uniqueness
    const { data: existing } = await supabase
      .from('blog_posts')
      .select('id')
      .eq('slug', parsed.data.slug)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'Slug already in use' }, { status: 409 });
    }

    const { data, error } = await supabase
      .from('blog_posts')
      .insert({
        ...parsed.data,
        tags:        parsed.data.tags ?? [],
        is_published: parsed.data.is_published ?? false,
      })
      .select()
      .single();

    if (error) {
      console.error('[admin/blog] insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, post: data }, { status: 201 });
  } catch (err) {
    console.error('[admin/blog POST] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── PUT — update blog post ────────────────────────────────────────────────────

export async function PUT(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = UpdatePostSchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json(
        { error: `Invalid input: ${firstIssue?.path?.join('.')} — ${firstIssue?.message}` },
        { status: 400 }
      );
    }

    const { id, ...fields } = parsed.data;
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('blog_posts')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[admin/blog] update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, post: data });
  } catch (err) {
    console.error('[admin/blog PUT] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── DELETE — delete blog post ─────────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = DeleteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request — id required' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', parsed.data.id);

    if (error) {
      console.error('[admin/blog] delete error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin/blog DELETE] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
