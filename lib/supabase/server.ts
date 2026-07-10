import { createServerClient as _createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createMockClient, isDemoMode } from '@/lib/demo/mockClient';

// ── Cookie-based server client (uses anon key + user session) ────────────────
// Use in Server Components, Server Actions, and API routes that handle
// user sessions (cookies are available in these contexts).
export async function createClient() {
  if (isDemoMode()) return createMockClient();
  const cookieStore = await cookies();
  return _createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
}

// Alias — used by pages that import `createServerClient`
export const createServerClient = createClient;

// ── Cookie-based service role client (bypasses RLS, has cookies) ─────────────
// Use in server actions where you need both user context AND admin DB access.
export async function createServiceClient() {
  if (isDemoMode()) return createMockClient();
  const cookieStore = await cookies();
  return _createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
}

// ── Cookieless admin client (bypasses RLS, NO cookie dependency) ──────────────
// Use in webhooks, Edge Functions, and cron jobs where no request cookies exist.
export function createAdminClient() {
  if (isDemoMode()) return createMockClient();
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
