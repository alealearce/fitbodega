import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Auth Callback Route
 *
 * Handles two Supabase auth redirect types:
 *  1. PKCE flow (OAuth / magic link) — has a `code` param
 *  2. Email OTP / password reset      — has `token_hash` + `type` params
 *
 * After exchanging the token for a session, redirects the user to
 * the `next` param (default: /).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  const code      = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type      = searchParams.get('type') as 'recovery' | 'email' | 'signup' | null;
  const next      = searchParams.get('next') ?? '/';

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

  if (code) {
    // PKCE / OAuth / magic link flow
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error('[auth/callback] exchangeCodeForSession error:', error.message);
      return NextResponse.redirect(`${origin}/login?error=auth_error`);
    }
  } else if (tokenHash && type) {
    // Email OTP flow (password reset uses type=recovery)
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (error) {
      console.error('[auth/callback] verifyOtp error:', error.message);
      return NextResponse.redirect(`${origin}/login?error=auth_error`);
    }
  } else {
    // No token at all — redirect to login
    return NextResponse.redirect(`${origin}/login`);
  }

  // For signup email confirmation, send to login with a confirmed banner
  if (type === 'email' || type === 'signup') {
    return NextResponse.redirect(`${origin}/login?confirmed=true`);
  }

  // For all other flows (password reset, magic link), redirect to the intended destination
  const redirectUrl = next.startsWith('/') ? `${origin}${next}` : next;
  return NextResponse.redirect(redirectUrl);
}
