import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isAdminEmail } from '@/lib/config/site';
import { publishDigest } from '@/lib/deal-radar/publish';
import { createAdminClient, createClient } from '@/lib/supabase/server';

// Approve & Publish for a draft triaged by hand at /admin/deal-radar. The
// Monday cron publishes on its own (see collect/route.ts); this route is
// for a week the cron did not publish. Auth: the logged-in admin session or
// an ADMIN_SECRET bearer. The work is in lib/deal-radar/publish.ts.

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

  const result = await publishDigest(createAdminClient(), parsed.data.digestId, { includeAll: false });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json(result);
}
