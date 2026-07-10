import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { SITE } from '@/lib/config/site';

export async function GET(req: NextRequest) {
  // Verify this is called by Vercel Cron
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Find listings that have been pending for more than 48 hours
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

  const { data: pendingListings, error } = await supabase
    .from('listings')
    .select('id, name, type, created_at')
    .eq('status', 'pending')
    .lte('created_at', cutoff);

  if (error) {
    console.error('[pending-check] supabase error:', error);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }

  const count = pendingListings?.length ?? 0;

  if (count === 0) {
    return NextResponse.json({ ok: true, pending: 0, emailSent: false });
  }

  // Send admin reminder email
  const { Resend } = await import('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);

  const listingRows = (pendingListings ?? [])
    .map(
      (l) =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e8e8e0;">${l.name}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e8e8e0;text-transform:capitalize;">${l.type}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e8e8e0;font-size:13px;color:#888;">${new Date(l.created_at).toLocaleDateString()}</td>
        </tr>`
    )
    .join('');

  await resend.emails.send({
    from: SITE.fromEmail,
    to:   SITE.email,
    subject: `${count} listing${count > 1 ? 's' : ''} pending review for 48h+ — FitBodega`,
    html: `
      <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:24px;">
        <h2 style="color:#111111;">Pending Listings Reminder</h2>
        <p>The following ${count} listing${count > 1 ? 's have' : ' has'} been waiting for review for more than 48 hours:</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8e8e0;border-radius:4px;overflow:hidden;margin:16px 0;">
          <thead>
            <tr style="background:#f5f5f5;">
              <th style="padding:10px 12px;text-align:left;font-family:Arial,sans-serif;font-size:13px;">Name</th>
              <th style="padding:10px 12px;text-align:left;font-family:Arial,sans-serif;font-size:13px;">Type</th>
              <th style="padding:10px 12px;text-align:left;font-family:Arial,sans-serif;font-size:13px;">Submitted</th>
            </tr>
          </thead>
          <tbody>${listingRows}</tbody>
        </table>
        <a href="${SITE.url}/admin"
           style="display:inline-block;background:#111111;color:#fff;padding:12px 24px;border-radius:4px;text-decoration:none;font-family:Arial,sans-serif;font-size:14px;">
          Review in Admin →
        </a>
        <p style="margin-top:24px;font-size:12px;color:#888;font-family:Arial,sans-serif;">FitBodega — Automated cron notification</p>
      </div>
    `,
  });

  return NextResponse.json({ ok: true, pending: count, emailSent: true });
}
