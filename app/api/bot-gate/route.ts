import { NextRequest, NextResponse } from 'next/server';
import { issueGateToken, refusedByGate } from '@/lib/botGate';
import { rateLimit } from '@/lib/rateLimit';

// GET  hands a form its signed load-time token (see lib/botGate.ts).
// POST is for /signup only: that page calls Supabase from the browser, so it
// asks here first whether the submission looks human. The newsletter and Deal
// Radar routes check the gate themselves.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ token: issueGateToken() }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: NextRequest) {
  const rl = rateLimit(req, { limit: 5, windowMs: 60 * 60_000, prefix: 'signup-gate' });
  const body = await req.json().catch(() => ({}));
  const refused = !rl.success || refusedByGate(body, 'signup');
  return NextResponse.json({ ok: !refused });
}
