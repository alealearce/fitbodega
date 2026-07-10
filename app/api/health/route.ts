import { NextResponse } from 'next/server';

// Deep health check — validates the real dependencies a signup/profile flow
// needs, not just that the homepage loads. Consumed by the arce.ca admin
// "Site Health" tab via the daily health-check runner. Public + read-only:
// it returns only ok/fail booleans, never secret values. Results are cached
// per warm instance for 60s so repeated hits can't hammer our upstream keys.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 15;

const SITE_ID = 'fitbodega';
const CACHE_TTL_MS = 60_000;

type Status = 'ok' | 'fail' | 'skipped';

// Module-level cache survives across requests on a warm serverless instance.
let cache: { at: number; payload: Record<string, unknown>; httpStatus: number } | null = null;

// Supabase reachable AND our anon key is accepted: a real (RLS-safe) read of the
// profiles table, which every project has. 200 = up + key valid; 401 = bad/rotated
// key; network error = project unreachable. (The bare /rest/v1/ root 401s for the
// anon role, so it can't be used here.)
async function checkDatabase(): Promise<Status> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return 'fail';
  try {
    const res = await fetch(`${url}/rest/v1/profiles?select=id&limit=1`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(6000),
    });
    return res.ok ? 'ok' : 'fail';
  } catch {
    return 'fail';
  }
}

// Resend key is present AND actually authenticates (catches revoked/typo'd keys
// — the class of failure behind the "never received the confirmation email"
// report). GET /domains is a cheap read-only call.
async function checkResend(): Promise<Status> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return 'fail';
  try {
    const res = await fetch('https://api.resend.com/domains', {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) return 'ok';
    // A restricted send-only key (name: restricted_api_key) can't read /domains
    // but CAN send email — that's healthy. Only a genuinely invalid key
    // (validation_error / "API key is invalid") is a real failure.
    if (res.status === 401) {
      const body = await res.text();
      if (body.includes('restricted_api_key')) return 'ok';
    }
    return 'fail';
  } catch {
    return 'fail';
  }
}

export async function GET() {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) {
    return NextResponse.json({ ...cache.payload, cached: true }, { status: cache.httpStatus });
  }

  const [database, resend] = await Promise.all([checkDatabase(), checkResend()]);

  const checks: Record<string, Status> = {
    database,
    resend,
    // Presence-only (never the value): validating these would cost tokens/charges.
    anthropic: process.env.ANTHROPIC_API_KEY ? 'ok' : 'fail',
    siteUrl: /^https:\/\//.test(process.env.NEXT_PUBLIC_SITE_URL ?? '') ? 'ok' : 'fail',
    // 'skipped' when the site doesn't use Stripe (e.g. no key configured yet).
    stripe: process.env.STRIPE_SECRET_KEY ? 'ok' : 'skipped',
  };

  const failed = Object.entries(checks).filter(([, s]) => s === 'fail').map(([k]) => k);
  const ok = failed.length === 0;
  const httpStatus = ok ? 200 : 503;

  const payload = {
    status: ok ? 'ok' : 'error', // legacy field kept for any existing consumer
    ok,
    site: SITE_ID,
    ts: new Date().toISOString(),
    checks,
    failed,
  };

  cache = { at: Date.now(), payload, httpStatus };
  return NextResponse.json(payload, { status: httpStatus });
}
