import { NextRequest, NextResponse } from 'next/server';
import { SITE } from '@/lib/config/site';
import { createAdminClient } from '@/lib/supabase/server';
import { dealRadarPage } from '../page-shell';

// Double opt-in confirmation link target.

export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get('token');
  if (!token) {
    return html(dealRadarPage('Invalid link', 'No token provided. Use the link from your email.'), 400);
  }

  const supabase = createAdminClient();
  const { data: sub } = await supabase
    .from('dr_subscribers')
    .select('id, status')
    .eq('confirm_token', token)
    .maybeSingle();

  if (!sub) {
    return html(dealRadarPage('Link not found', 'This link is invalid or has already been used.'), 404);
  }

  if (sub.status !== 'active') {
    await supabase
      .from('dr_subscribers')
      .update({ status: 'active', confirmed_at: new Date().toISOString() })
      .eq('id', sub.id);
  }

  return html(
    dealRadarPage(
      'Subscription confirmed',
      'Deal Radar lands in your inbox every week after our editor signs off on the edition.',
      { label: 'Browse past editions', href: `${SITE.url}/deals` }
    ),
    200
  );
}

function html(body: string, status: number) {
  return new NextResponse(body, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
