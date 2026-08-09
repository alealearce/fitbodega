import { SITE } from '@/lib/config/site';

// Minimal dark-brand HTML shell for confirm/unsubscribe result pages.
// Brutalist Sanctuary rules: square corners, no borders, lime accent.

export function dealRadarPage(
  title: string,
  message: string,
  cta?: { label: string; href: string }
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — ${SITE.name}</title>
</head>
<body style="margin:0;background:#0e0e0e;font-family:Arial,Helvetica,sans-serif;color:#ffffff;">
  <div style="max-width:520px;margin:0 auto;padding:96px 24px;text-align:center;">
    <p style="margin:0 0 40px;font-size:22px;font-weight:800;letter-spacing:-0.5px;text-transform:uppercase;">
      <span style="color:#ffffff;">FIT</span><span style="color:#d1fc00;">BODEGA</span>
    </p>
    <h1 style="margin:0 0 16px;font-size:32px;font-weight:800;text-transform:uppercase;letter-spacing:-0.5px;">${title}</h1>
    <p style="margin:0 0 32px;font-size:16px;line-height:1.7;color:#b3b3b3;">${message}</p>
    ${cta ? `<a href="${cta.href}" style="display:inline-block;background:#d1fc00;color:#161900;padding:14px 32px;text-decoration:none;font-size:14px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;">${cta.label}</a>` : ''}
  </div>
</body>
</html>`;
}
