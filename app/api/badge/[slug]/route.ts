import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { CLAIMABLE_LISTS, getEntryByName, isClaimableList } from '@/lib/top100/registry';

// Embeddable Top 100 ranking badge (SVG). Name-locked: the rank comes from
// the approved claim in the DB plus the current list JSON — never from URL
// params — so badges can't be spoofed (the peptide lesson). ?list= only
// selects among the listing's own approved claims.

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function badgeSvg(label: string, rank: number, name: string): string {
  const FONT = 'Arial, Helvetica, sans-serif';
  const rankText = `#${rank}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="88" viewBox="0 0 360 88" role="img" aria-label="${esc(`FitBodega ${label} 2026 — ${name}, ranked ${rankText}`)}">
  <title>${esc(`FitBodega ${label} 2026 — ${name} — Ranked ${rankText}`)}</title>
  <rect width="360" height="88" fill="#0e0e0e"/>
  <rect width="4" height="88" fill="#d1fc00"/>
  <text x="24" y="36" font-family="${FONT}" font-size="16" font-weight="800" letter-spacing="0.5"><tspan fill="#ffffff">FIT</tspan><tspan fill="#d1fc00">BODEGA</tspan></text>
  <text x="24" y="58" font-family="${FONT}" font-size="10" font-weight="700" letter-spacing="1.6" fill="#9a9a9a">${esc(label)} 2026</text>
  <text x="336" y="34" text-anchor="end" font-family="${FONT}" font-size="9" font-weight="700" letter-spacing="1.8" fill="#9a9a9a">RANKED</text>
  <text x="336" y="66" text-anchor="end" font-family="${FONT}" font-size="30" font-weight="800" fill="#d1fc00">${esc(rankText)}</text>
</svg>`;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const admin = createAdminClient();

  const { data: listing } = await admin
    .from('listings')
    .select('id, name, status')
    .eq('slug', slug)
    .eq('status', 'approved')
    .maybeSingle();

  if (!listing) {
    return NextResponse.json({ error: 'No badge for this listing.' }, { status: 404 });
  }

  const { data: claims } = await admin
    .from('top100_claims')
    .select('list_id, entry_name, rank_at_claim')
    .eq('listing_id', listing.id)
    .eq('status', 'approved');

  if (!claims?.length) {
    return NextResponse.json({ error: 'No badge for this listing.' }, { status: 404 });
  }

  // Resolve each claim to its current rank (fall back to the rank at claim
  // time if the entry left the list), then honor ?list= or pick the best.
  const resolved = claims
    .filter((c) => isClaimableList(c.list_id))
    .map((c) => {
      const listId = c.list_id as keyof typeof CLAIMABLE_LISTS;
      const current = getEntryByName(listId, c.entry_name);
      return {
        listId,
        label: CLAIMABLE_LISTS[listId].badgeLabel,
        rank: current?.rank ?? c.rank_at_claim,
      };
    });

  if (!resolved.length) {
    return NextResponse.json({ error: 'No badge for this listing.' }, { status: 404 });
  }

  const wanted = req.nextUrl.searchParams.get('list');
  const pick =
    resolved.find((r) => r.listId === wanted) ??
    [...resolved].sort((a, b) => a.rank - b.rank)[0];

  return new NextResponse(badgeSvg(pick.label, pick.rank, listing.name), {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}
