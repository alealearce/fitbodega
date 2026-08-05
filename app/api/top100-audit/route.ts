import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { sendAuditEmail } from "@/lib/email/resend";
import { rateLimit } from "@/lib/rateLimit";
import { generateAudit, type AuditEntityType } from "@/lib/top100/audit";

export const runtime = "nodejs";
export const maxDuration = 60;

const AuditSchema = z
  .object({
    email: z.string().email(),
    entity_type: z.enum([
      "coach",
      "gym",
      "creator",
      "recovery",
      "store",
      "club",
      "nutritionist",
      "retreat",
      "athlete",
    ]),
    instagram: z.string().max(120).optional().or(z.literal("")),
    website: z.string().max(300).optional().or(z.literal("")),
    goal: z.string().max(400).optional().or(z.literal("")),
  })
  .refine((d) => (d.instagram && d.instagram.trim()) || (d.website && d.website.trim()), {
    message: "Provide an Instagram or a website",
  });

function normalizeUrl(raw: string): string | null {
  let s = raw.trim();
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  try {
    const u = new URL(s);
    if (!u.hostname.includes(".")) return null;
    return u.toString();
  } catch {
    return null;
  }
}

// Fetch the lead's website and reduce it to readable text. Best-effort:
// a blocked or slow site just means the audit runs on declared info.
async function fetchSiteText(url: string): Promise<string | undefined> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; FitBodegaAudit/1.0)" },
      redirect: "follow",
    });
    clearTimeout(timer);
    if (!res.ok) return undefined;
    const html = (await res.text()).slice(0, 300_000);
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&[a-z#0-9]+;/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
    return text ? text.slice(0, 6000) : undefined;
  } catch {
    return undefined;
  }
}

export async function POST(req: NextRequest) {
  // Costly route (LLM call) — keep the limit tight.
  const rl = rateLimit(req, { limit: 3, windowMs: 60 * 60_000, prefix: "t100audit" });
  if (!rl.success) {
    return NextResponse.json({ error: "Too many audits from this connection — try again later." }, { status: 429 });
  }

  try {
    const parsed = AuditSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const { email, entity_type, instagram, goal } = parsed.data;
    const website = parsed.data.website ? normalizeUrl(parsed.data.website) : null;
    const ig = instagram?.trim().replace(/^@/, "") || undefined;

    const websiteText = website ? await fetchSiteText(website) : undefined;

    const report = await generateAudit({
      entityType: entity_type as AuditEntityType,
      instagram: ig,
      website: website ?? undefined,
      goal: goal?.trim() || undefined,
      websiteText,
    });

    const supabase = createAdminClient();
    const { error: insertError } = await supabase.from("top100_audits").insert({
      email,
      entity_type,
      instagram: ig ?? null,
      website: website ?? null,
      inputs: { goal: goal?.trim() || null, site_fetched: Boolean(websiteText) },
      report,
    });
    if (insertError) console.error("[top100-audit] insert error:", insertError);

    // Always await sends on Vercel — un-awaited promises die at freeze.
    try {
      await sendAuditEmail(email, report);
    } catch (e) {
      console.error("[top100-audit] email error:", e);
    }

    return NextResponse.json({ report });
  } catch (err) {
    console.error("[top100-audit] error:", err);
    // TEMP DEBUG — remove after diagnosing the prod-only failure
    return NextResponse.json(
      { error: "Audit failed — try again in a minute.", detail: String(err).slice(0, 300) },
      { status: 500 }
    );
  }
}
