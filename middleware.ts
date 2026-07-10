import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './routing';

const intlMiddleware = createIntlMiddleware(routing);

export async function middleware(request: NextRequest) {
  // Demo mode (no database configured) — skip session refresh entirely.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return intlMiddleware(request);
  }

  // ── 1. Refresh the Supabase session on every request ──────────────────────
  // Without this, access tokens expire and the user gets "logged out" when
  // navigating between pages even though the refresh token is still valid.
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Write updated cookies back to the request so downstream code sees them
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refreshes the session and rotates the token if needed
  await supabase.auth.getUser();

  // ── 2. Apply next-intl locale routing ─────────────────────────────────────
  const intlResponse = intlMiddleware(request);

  // Merge any auth cookies Supabase set into the intl response so they
  // actually reach the browser
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    intlResponse.cookies.set(cookie.name, cookie.value, cookie);
  });

  return intlResponse;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|icon|sitemap|robots|.*\\..*).*)'],
};
