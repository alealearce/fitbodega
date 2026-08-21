import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isAdminEmail, SITE } from '@/lib/config/site';
import type { DrOpportunity, DrSubscriber } from '@/lib/deal-radar/types';
import { weekSlugToTitleDate } from '@/lib/deal-radar/week';
import {
  buildDealRadarDigestHtml,
  sendDealRadarDigest,
  type DigestEmailItem,
} from '@/lib/email/resend';
import { createAdminClient, createClient } from '@/lib/supabase/server';

// Approve & Publish — the ONLY path that sends the digest email and makes
// the post live at /deals/[week-slug]. Auth: the logged-in admin session
// (the /admin/deal-radar button) or an ADMIN_SECRET bearer (publish on the
// owner's explicit approval given elsewhere, e.g. in chat).
// Sequence: mark approved -> publish post (status 'published' makes the page
// render) -> send batch to active subscribers with per-subscriber logging.
// Send results land in dr_email_log; partial failures are reported, not
// hidden.

export const maxDuration = 300;

async function isAuthorized(req: NextRequest): Promise<boolean> {
  const bearer = req.headers.get('authorization');
  if (process.env.ADMIN_SECRET && bearer === `Bearer ${process.env.ADMIN_SECRET}`) return true;
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  return Boolean(user && isAdminEmail(user.email));
}

export async function POST(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = z.object({ digestId: z.string().uuid() }).safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  const supabase = createAdminClient();

  const { data: digest } = await supabase
    .from('dr_weekly_digests')
    .select('*')
    .eq('id', parsed.data.digestId)
    .maybeSingle();
  if (!digest) return NextResponse.json({ error: 'Digest not found' }, { status: 404 });
  if (digest.status === 'published') {
    return NextResponse.json({ error: 'Already published' }, { status: 409 });
  }
  if (!digest.intro_copy?.trim()) {
    return NextResponse.json({ error: 'Intro copy is empty — write it before publishing' }, { status: 400 });
  }

  const { data: opps } = await supabase
    .from('dr_opportunities')
    .select('*')
    .eq('week_id', digest.id)
    .eq('status', 'included')
    .order('score', { ascending: false });
  const included = (opps ?? []) as DrOpportunity[];
  if (included.length === 0) {
    return NextResponse.json({ error: 'No opportunities marked included' }, { status: 400 });
  }

  const postUrl = `${SITE.url}/deals/${digest.week_slug}`;

  // 1. Publish the post. From this moment /deals/[slug] renders.
  const { error: pubError } = await supabase
    .from('dr_weekly_digests')
    .update({ status: 'published', published_at: new Date().toISOString(), post_url: postUrl })
    .eq('id', digest.id);
  if (pubError) return NextResponse.json({ error: pubError.message }, { status: 500 });

  // Expire everything left un-triaged so next week starts clean.
  await supabase
    .from('dr_opportunities')
    .update({ status: 'expired' })
    .eq('week_id', digest.id)
    .eq('status', 'new');

  // 2. Send to active subscribers.
  const toItem = (o: DrOpportunity): DigestEmailItem => ({
    brandName: o.brand_name,
    line: o.deliverables
      ?? (o.meta?.evidenceNote as string | undefined)
      ?? `${o.active_ad_count ?? 'Multiple'} active creator-style ads running`,
    compensation: o.compensation_text,
    pitchAngle: (o.meta?.pitchAngle as string | undefined) ?? null,
    url: o.source_url,
  });

  const htmlTemplate = buildDealRadarDigestHtml({
    weekSlug: weekSlugToTitleDate(digest.week_slug),
    introCopy: digest.intro_copy,
    collabs: included.filter((o) => o.source_type === 'listed_deal').map(toItem),
    spending: included.filter((o) => o.source_type === 'spend_signal').map(toItem),
    postUrl,
  });
  const subject = `Deal Radar — ${included.length} fitness brand deals, week of ${weekSlugToTitleDate(digest.week_slug)}`;

  const { data: subs } = await supabase
    .from('dr_subscribers')
    .select('id, email, unsubscribe_token')
    .eq('status', 'active');
  const subscribers = (subs ?? []) as Pick<DrSubscriber, 'id' | 'email' | 'unsubscribe_token'>[];

  let sent = 0;
  let failed = 0;
  for (const sub of subscribers) {
    let errorMsg: string | null = null;
    try {
      const result = await sendDealRadarDigest({
        to: sub.email,
        subject,
        htmlTemplate,
        unsubscribeUrl: `${SITE.url}/api/deal-radar/unsubscribe?token=${sub.unsubscribe_token}`,
      });
      if (result.error) errorMsg = result.error.message;
    } catch (e) {
      errorMsg = e instanceof Error ? e.message : String(e);
    }
    await supabase.from('dr_email_log').insert({
      digest_id: digest.id,
      subscriber_id: sub.id,
      status: errorMsg ? 'failed' : 'sent',
      error: errorMsg,
    });
    if (errorMsg) failed++; else sent++;
  }

  return NextResponse.json({
    ok: true,
    postUrl,
    included: included.length,
    subscribers: subscribers.length,
    sent,
    failed,
  });
}
