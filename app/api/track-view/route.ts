import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rateLimit';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  // Rate limit: 30 view tracks per minute per IP (prevents artificial inflation)
  const rl = rateLimit(req, { limit: 30, windowMs: 60_000, prefix: 'track-view' });
  if (!rl.success) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  try {
    const { listing_id } = await req.json() as { listing_id: string };

    // Validate UUID format to prevent junk data
    if (!listing_id || !UUID_RE.test(listing_id)) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Try Postgres RPC for atomic increment (recommended — add function to DB)
    const { error: rpcError } = await supabase.rpc('increment_view_count', {
      listing_id_param: listing_id,
    });

    if (rpcError) {
      // Fallback: read-then-write increment (not atomic, acceptable for view counts)
      const { data: current } = await supabase
        .from('listings')
        .select('view_count')
        .eq('id', listing_id)
        .single();

      if (current !== null) {
        await supabase
          .from('listings')
          .update({ view_count: (current?.view_count ?? 0) + 1 })
          .eq('id', listing_id);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[track-view] error:', err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
