import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { dealRadarPage } from '../page-shell';

// One-click unsubscribe (CASL). GET serves the link in the email footer;
// POST serves RFC 8058 List-Unsubscribe-Post one-click from mail clients.

async function unsubscribe(token: string | null): Promise<{ body: string; status: number }> {
  if (!token) {
    return { body: dealRadarPage('Invalid link', 'No token provided.'), status: 400 };
  }

  const supabase = createAdminClient();
  const { data: sub } = await supabase
    .from('dr_subscribers')
    .select('id, status')
    .eq('unsubscribe_token', token)
    .maybeSingle();

  if (!sub) {
    return { body: dealRadarPage('Link not found', 'This link is invalid.'), status: 404 };
  }

  if (sub.status !== 'unsubscribed') {
    await supabase.from('dr_subscribers').update({ status: 'unsubscribed' }).eq('id', sub.id);
  }

  return {
    body: dealRadarPage('Unsubscribed', 'You will not receive Deal Radar again. No confirmation needed, no follow-up email coming.'),
    status: 200,
  };
}

export async function GET(req: NextRequest) {
  const { body, status } = await unsubscribe(new URL(req.url).searchParams.get('token'));
  return new NextResponse(body, { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

export async function POST(req: NextRequest) {
  const { status } = await unsubscribe(new URL(req.url).searchParams.get('token'));
  return new NextResponse(null, { status: status === 200 ? 200 : status });
}
