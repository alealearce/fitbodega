import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { SITE } from '@/lib/config/site';

const INK  = '#0e0e0e';
const LIME = '#d1fc00';
const LIME_TEXT = '#161900';
const BG   = '#ffffff';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token   = searchParams.get('token');
  const confirm = searchParams.get('confirm') === 'true';

  if (!token) {
    return new NextResponse(errorPage('Invalid Link', 'No token provided. Please use the link from your email.'), {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  const supabase = createAdminClient();

  const { data: subscriber, error } = await supabase
    .from('newsletter_subscribers')
    .select('id, email, is_confirmed')
    .eq('unsubscribe_token', token)
    .maybeSingle();

  if (error || !subscriber) {
    return new NextResponse(errorPage('Link Not Found', 'This link is invalid or has already been used.'), {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  if (confirm) {
    // Confirm subscription
    await supabase
      .from('newsletter_subscribers')
      .update({ is_confirmed: true, confirmed_at: new Date().toISOString() })
      .eq('unsubscribe_token', token);

    return new NextResponse(successPage(
      'Subscription Confirmed',
      `You're now subscribed to the ${SITE.name} newsletter.`,
      'Read the Journal',
      `${SITE.url}/community`
    ), {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  // Unsubscribe
  await supabase
    .from('newsletter_subscribers')
    .update({ is_confirmed: false })
    .eq('unsubscribe_token', token);

  return new NextResponse(successPage(
    'Unsubscribed',
    `You've been unsubscribed from the ${SITE.name} newsletter.`,
    `Return to ${SITE.name}`,
    SITE.url
  ), {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

// ── HTML helpers ─────────────────────────────────────────────────────────────

function successPage(title: string, message: string, ctaLabel: string, ctaHref: string): string {
  return page(title, `
    <p style="margin:0 0 24px;font-size:16px;line-height:1.7;color:#2d2d2d;">${message}</p>
    <a href="${ctaHref}" style="display:inline-block;background:${LIME};color:${LIME_TEXT};padding:14px 32px;border-radius:0;text-decoration:none;font-family:Arial,sans-serif;font-size:14px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;">${ctaLabel}</a>
  `);
}

function errorPage(title: string, message: string): string {
  return page(title, `
    <p style="margin:0 0 24px;font-size:16px;line-height:1.7;color:#c0392b;">${message}</p>
    <a href="${SITE.url}" style="display:inline-block;background:${LIME};color:${LIME_TEXT};padding:14px 32px;border-radius:0;text-decoration:none;font-family:Arial,sans-serif;font-size:14px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;">Return to ${SITE.name}</a>
  `);
}

function page(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title} — ${SITE.name}</title>
</head>
<body style="margin:0;padding:0;background:${BG};font-family:Arial,Helvetica,sans-serif;">
  <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:40px 20px;">
    <div style="max-width:480px;width:100%;background:#fff;border:1px solid #e8e8e8;border-radius:0;overflow:hidden;">
      <div style="background:${INK};padding:32px 40px;text-align:left;">
        <p style="margin:0;font-size:22px;font-weight:800;letter-spacing:-0.5px;text-transform:uppercase;font-family:Arial,sans-serif;">
          <span style="color:#ffffff;">FIT</span><span style="color:${LIME};">BODEGA</span>
        </p>
        <h1 style="margin:16px 0 0;color:#fff;font-size:20px;font-weight:normal;font-family:Arial,sans-serif;">${title}</h1>
      </div>
      <div style="padding:40px;">
        ${bodyHtml}
      </div>
    </div>
  </div>
</body>
</html>`;
}
