// Publish one weekly digest: make /deals/[week-slug] live and email the
// edition to active subscribers. Called by the Monday collect cron (auto,
// owner decision 2026-10-07: no review step) and by the admin Approve &
// Publish button for a draft triaged by hand.
// Sequence: publish post (status 'published' makes the page render) ->
// expire what was left out -> send to active subscribers with
// per-subscriber logging in dr_email_log. Partial failures are reported,
// not hidden.

import type { SupabaseClient } from '@supabase/supabase-js';
import { SITE } from '@/lib/config/site';
import {
  buildDealRadarDigestHtml,
  sendDealRadarDigest,
  type DigestEmailItem,
} from '@/lib/email/resend';
import type { DrOpportunity, DrSubscriber } from './types';
import { weekSlugToTitleDate } from './week';

// The email shows the best of each kind by score and links to the page for
// the rest (owner decision 2026-10-07: the full list made a long, flat email).
const EMAIL_TOP_COLLABS = 5;
const EMAIL_TOP_SPENDING = 3;

export type PublishResult =
  | { ok: true; postUrl: string; included: number; subscribers: number; sent: number; failed: number }
  | { ok: false; status: number; error: string };

export async function publishDigest(
  supabase: SupabaseClient,
  digestId: string,
  // includeAll: the cron path. Every collected opportunity goes in and a
  // missing intro gets a plain fallback instead of blocking the send.
  opts: { includeAll: boolean }
): Promise<PublishResult> {
  const { data: digest } = await supabase
    .from('dr_weekly_digests')
    .select('*')
    .eq('id', digestId)
    .maybeSingle();
  if (!digest) return { ok: false, status: 404, error: 'Digest not found' };
  if (digest.status === 'published') return { ok: false, status: 409, error: 'Already published' };

  if (opts.includeAll) {
    await supabase
      .from('dr_opportunities')
      .update({ status: 'included' })
      .eq('week_id', digest.id)
      .eq('status', 'new');
  }

  const { data: opps } = await supabase
    .from('dr_opportunities')
    .select('*')
    .eq('week_id', digest.id)
    .eq('status', 'included')
    .order('score', { ascending: false });
  const included = (opps ?? []) as DrOpportunity[];
  if (included.length === 0) {
    return { ok: false, status: 400, error: 'No opportunities marked included' };
  }

  let introCopy: string = digest.intro_copy?.trim() ?? '';
  if (!introCopy) {
    if (!opts.includeAll) {
      return { ok: false, status: 400, error: 'Intro copy is empty — write it before publishing' };
    }
    introCopy = `${included.length} fitness brand deals for the week of ${weekSlugToTitleDate(digest.week_slug)}: open collabs you can apply to now, and brands spending on creator ads.`;
  }

  const postUrl = `${SITE.url}/deals/${digest.week_slug}`;

  // 1. Publish the post. From this moment /deals/[slug] renders.
  const { error: pubError } = await supabase
    .from('dr_weekly_digests')
    .update({
      status: 'published',
      published_at: new Date().toISOString(),
      post_url: postUrl,
      intro_copy: introCopy,
    })
    .eq('id', digest.id);
  if (pubError) return { ok: false, status: 500, error: pubError.message };

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
    introCopy,
    collabs: included.filter((o) => o.source_type === 'listed_deal').slice(0, EMAIL_TOP_COLLABS).map(toItem),
    spending: included.filter((o) => o.source_type === 'spend_signal').slice(0, EMAIL_TOP_SPENDING).map(toItem),
    totalCount: included.length,
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

  return { ok: true, postUrl, included: included.length, subscribers: subscribers.length, sent, failed };
}
