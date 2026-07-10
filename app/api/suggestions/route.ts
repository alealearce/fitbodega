import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rateLimit';

export async function GET(req: NextRequest) {
  // Rate limit: 60 suggestion requests per minute per IP
  const rl = rateLimit(req, { limit: 60, windowMs: 60_000, prefix: 'suggestions' });
  if (!rl.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim() ?? '';

  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  // Sanitise: strip SQL special chars
  const safe = q.replace(/[%_\\]/g, (c) => `\\${c}`).slice(0, 100);

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('listings')
    .select('name, slug, type, city')
    .eq('status', 'approved')
    .ilike('name', `%${safe}%`)
    .limit(5);

  if (error) {
    console.error('[suggestions] db error:', error);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
