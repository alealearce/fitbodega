import { redirect } from "next/navigation";
import { isAdminEmail, SITE } from "@/lib/config/site";
import type { DrDealSubmission, DrOpportunity, DrRun, DrWeeklyDigest } from "@/lib/deal-radar/types";
import { weekSlugToTitleDate } from "@/lib/deal-radar/week";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import DealRadarClient from "./DealRadarClient";

export const metadata = {
  title: `Deal Radar Admin — ${SITE.name}`,
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function DealRadarAdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/admin/deal-radar");
  if (!isAdminEmail(user.email)) redirect("/");

  const admin = createAdminClient();

  const { data: digestData } = await admin
    .from("dr_weekly_digests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const digest = digestData as DrWeeklyDigest | null;

  const { data: oppData } = digest
    ? await admin
        .from("dr_opportunities")
        .select("*")
        .eq("week_id", digest.id)
        .order("score", { ascending: false })
    : { data: [] };
  const opportunities = (oppData ?? []) as DrOpportunity[];

  const { data: runData } = await admin
    .from("dr_runs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(8);
  const runs = (runData ?? []) as DrRun[];

  const { count: activeSubs } = await admin
    .from("dr_subscribers")
    .select("id", { count: "exact", head: true })
    .eq("status", "active");

  const { data: submissionData } = await admin
    .from("dr_deal_submissions")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  const submissions = (submissionData ?? []) as DrDealSubmission[];

  return (
    <div className="min-h-screen bg-bg px-6 py-16">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-7 h-[3px] bg-primary" aria-hidden />
            <p className="font-sans text-label-md uppercase text-primary">Deal Radar</p>
          </div>
          <h1 className="font-serif text-display-sm uppercase text-on-surface font-extrabold tracking-tight">
            {digest ? `Week of ${weekSlugToTitleDate(digest.week_slug)}` : "No draft yet"}
          </h1>
          <p className="font-sans text-sm text-on-surface-variant mt-2">
            Review every word before it goes out. Nothing sends without your approval.
            {typeof activeSubs === "number" ? ` ${activeSubs} active subscribers.` : ""}
          </p>
        </div>

        {digest ? (
          <DealRadarClient
            digest={digest}
            opportunities={opportunities}
            runs={runs}
            activeSubscribers={activeSubs ?? 0}
            submissions={submissions}
          />
        ) : (
          <div className="bg-surface-card p-8">
            <p className="font-sans text-sm text-on-surface-variant">
              The Monday collection has not produced a draft yet. Trigger one manually:
            </p>
            <p className="font-sans text-sm text-on-surface mt-3">
              curl -X POST -H &quot;Authorization: Bearer $CRON_SECRET&quot; {SITE.url}/api/deal-radar/collect
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
