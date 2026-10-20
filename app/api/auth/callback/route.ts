import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { EmailOtpType } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const CALLBACK_PATH = '/api/auth/callback';

/**
 * Auth Callback Route
 *
 * Handles two kinds of link from Supabase auth emails:
 *  1. `token_hash` + `type` — what the email templates send. verifyOtp needs
 *     nothing from the browser, so the link works wherever it opens,
 *     including a mail app's built-in browser.
 *  2. `code` (PKCE) — links sent before the templates switched, and any
 *     template still on {{ .ConfirmationURL }}. The exchange needs a verifier
 *     cookie that only the browser that asked for the email has, so it fails
 *     in any other browser ("PKCE code verifier not found").
 *
 * The templates pass the client's redirect URL as `next={{ .RedirectTo }}`.
 * resolveNext turns that back into a same-site path.
 */
async function verify(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  const code       = searchParams.get('code');
  const tokenHash  = searchParams.get('token_hash');
  const type       = searchParams.get('type') as EmailOtpType | null;
  const next       = resolveNext(searchParams.get('next'), origin);

  const loginPath = '/login';

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.delete({ name, ...options });
        },
      },
    }
  );

  if (tokenHash && type) {
    // Email link flow (signup confirmation, password reset, magic link)
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (error) {
      console.error('[auth/callback] verifyOtp error:', error.message);
      return NextResponse.redirect(`${origin}${loginPath}?error=auth_error`);
    }
  } else if (code) {
    // PKCE flow — only works in the browser that asked for the email
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      // Its own wording so the error sweep reports it as a new group: after
      // the switch, a code link means a template still sends {{ .ConfirmationURL }}.
      console.error('[auth/callback] code link failed (template on ConfirmationURL?):', error.message);
      return NextResponse.redirect(`${origin}${loginPath}?error=auth_error`);
    }
  } else {
    // No token at all — redirect to login
    return NextResponse.redirect(`${origin}${loginPath}`);
  }

  // Same destination for every flow: signup confirmation, password reset, magic link.
  return NextResponse.redirect(`${origin}${next}`);
}

/**
 * `next` is a path ("/en/dashboard") or, from the email templates, the full
 * redirect URL the client passed, which usually points back at this route
 * with its own ?next=. Returns a same-site path; anything else becomes "/".
 */
function resolveNext(raw: string | null, origin: string): string {
  if (!raw) return '/';
  if (raw.startsWith('/')) {
    return raw.startsWith('//') || raw.startsWith('/\\') ? '/' : raw;
  }
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return '/';
  }
  const bareHost = (host: string) => host.replace(/^www\./, '');
  if (bareHost(url.hostname) !== bareHost(new URL(origin).hostname)) return '/';
  if (url.pathname === CALLBACK_PATH) return resolveNext(url.searchParams.get('next'), origin);
  return url.pathname + url.search;
}

// Mail scanners (Outlook Safe Links and the like) open every link in an email
// before the person does, and a token_hash works once. When GET verified, the
// scanner used the link up and the person's own click failed ("Email link is
// invalid or has expired", VendorRoster 2026-10-20). Now a GET, and the HEAD
// Next answers with GET, only shows a Continue button. The button POSTs back
// to this same URL and only the POST verifies. Scanners don't submit forms.
const CONTINUE_PAGE = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>Continue</title><style>
body{margin:0;min-height:100vh;display:grid;place-items:center;background:#fff;color:#111;font:16px/1.5 system-ui,-apple-system,sans-serif}
main{padding:24px;text-align:center;max-width:360px}h1{font-size:22px;margin:0 0 8px}p{margin:0 0 24px;color:#555}
button{font:inherit;font-weight:600;padding:12px 32px;border:0;border-radius:6px;background:#111;color:#fff;cursor:pointer}
@media (prefers-color-scheme:dark){body{background:#111;color:#eee}p{color:#aaa}button{background:#eee;color:#111}}
</style></head><body><main><h1>One more step</h1><p>Press Continue to finish.</p>
<form method="post"><button type="submit">Continue</button></form></main></body></html>`;

export async function GET(request: NextRequest) {
  if (!new URL(request.url).searchParams.get('token_hash')) return verify(request);
  return new NextResponse(CONTINUE_PAGE, {
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex' },
  });
}

export async function POST(request: NextRequest) {
  const res = await verify(request);
  // 303 so the browser follows with a GET; verify's 307 would re-send the POST.
  return res.headers.get('location') ? new NextResponse(null, { status: 303, headers: res.headers }) : res;
}
