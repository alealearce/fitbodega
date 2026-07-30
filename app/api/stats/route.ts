import { NextResponse } from 'next/server';

// Aggregate growth counters for the weekly GAS growth report (see workspace
// OPERATIONS.md). Public + read-only: totals only — no PII, no revenue. The
// report stores weekly snapshots and emails the deltas, so totals are all it
// needs. A metric that errors returns null rather than failing the payload.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 15;

const SITE_ID = 'fitbodega';
const CACHE_TTL_MS = 60_000;

let cache: { at: number; payload: Record<string, unknown> } | null = null;

async function count(table: string, filter: string): Promise<number | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  try {
    const res = await fetch(
      `${url}/rest/v1/${table}?select=id${filter ? `&${filter}` : ''}&limit=1`,
      {
        method: 'HEAD',
        headers: { apikey: key, Authorization: `Bearer ${key}`, Prefer: 'count=exact' },
        signal: AbortSignal.timeout(6000),
      },
    );
    if (!res.ok) return null;
    const range = res.headers.get('content-range'); // e.g. "0-0/1234"
    const total = range?.split('/')[1];
    return total && total !== '*' ? Number(total) : null;
  } catch {
    return null;
  }
}

const METRICS: [string, string, string][] = [
  ['listings_total', 'listings', ''],
  ['listings_verified', 'listings', 'is_verified=eq.true'],
  ['leads_total', 'leads', ''],
  ['newsletter_subscribers', 'newsletter_subscribers', 'subscribed=eq.true'],
  ['blog_posts_published', 'blog_posts', 'is_published=eq.true'],
  ['reviews_total', 'reviews', ''],
  ['social_posts_published', 'social_posts', 'status=eq.published'],
];

export async function GET() {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) {
    return NextResponse.json({ ...cache.payload, cached: true });
  }
  const values = await Promise.all(METRICS.map(([, t, f]) => count(t, f)));
  const metrics: Record<string, number | null> = {};
  METRICS.forEach(([name], i) => { metrics[name] = values[i]; });
  const payload = { site: SITE_ID, ts: new Date().toISOString(), metrics };
  cache = { at: Date.now(), payload };
  return NextResponse.json(payload);
}
