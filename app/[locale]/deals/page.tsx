import type { Metadata } from "next";
import Link from "next/link";
import DealRadarSubscribeForm from "@/components/deal-radar/DealRadarSubscribeForm";
import DigestContent from "@/components/deal-radar/DigestContent";
import { SITE } from "@/lib/config/site";
import type { DrOpportunity, DrWeeklyDigest } from "@/lib/deal-radar/types";
import { weekSlugToTitleDate } from "@/lib/deal-radar/week";
import { createAdminClient } from "@/lib/supabase/server";

// Deal Radar showcase. The current edition renders in full as a ledger
// (same reading grammar as the FitBodega 100); every earlier week collapses
// into a date-labeled dropdown. Permalinks live at /deals/[week-slug].

export const revalidate = 3600;

export const metadata: Metadata = {
  title: `Deal Radar — Fitness Brand Deals & Collabs for Creators | ${SITE.name}`,
  description:
    "A weekly, human-curated list of open fitness brand deals, UGC gigs, and brands actively spending on creator ads. Free for creators.",
  alternates: { canonical: `${SITE.url}/deals` },
  openGraph: {
    title: "Deal Radar — Fitness Brand Deals & Collabs",
    description: "Open brand deals and spend signals for fitness creators, every week.",
    url: `${SITE.url}/deals`,
  },
};

export default async function DealsShowcasePage() {
  const supabase = createAdminClient();

  const { data: digestData } = await supabase
    .from("dr_weekly_digests")
    .select("*")
    .eq("status", "published")
    .order("week_slug", { ascending: false });
  const digests = (digestData ?? []) as DrWeeklyDigest[];

  const { data: oppData } = digests.length
    ? await supabase
        .from("dr_opportunities")
        .select("*")
        .in("week_id", digests.map((d) => d.id))
        .eq("status", "included")
        .order("score", { ascending: false })
    : { data: [] };
  const allOpps = (oppData ?? []) as DrOpportunity[];
  const oppsFor = (id: string) => allOpps.filter((o) => o.week_id === id);

  const [latest, ...past] = digests;

  return (
    <div className="min-h-screen bg-bg">
      {/* Masthead — section shift, aggressive display type */}
      <div className="bg-surface-low">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-24 pb-16">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-7 h-[3px] bg-primary" aria-hidden />
            <p className="font-sans text-label-md uppercase text-primary">The Deal Radar</p>
          </div>
          <h1 className="font-serif text-display-lg lg:text-display-xl uppercase tracking-tight text-on-surface max-w-4xl">
            Fitness brand deals, every week
          </h1>
          <p className="font-sans text-base lg:text-lg text-on-surface-variant mt-6 max-w-2xl">
            Open collab listings you can apply to today. Brands actively spending on creator ads,
            with the pitch angle to reach them. Curated and verified by hand before it ships.
          </p>
          <div className="mt-10 max-w-xl">
            <p className="font-sans text-label-md uppercase text-primary mb-4">Get it in your inbox</p>
            <DealRadarSubscribeForm />
          </div>
        </div>
      </div>

      {/* Current edition */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
        {!latest ? (
          <p className="font-sans text-sm text-on-surface-variant">First edition ships soon.</p>
        ) : (
          <article>
            <div className="flex items-center gap-3 mb-4">
              <span className="w-7 h-[3px] bg-primary" aria-hidden />
              <p className="font-sans text-label-md uppercase text-primary">Current edition</p>
            </div>
            <h2 className="font-serif text-display-sm lg:text-display-md uppercase font-extrabold tracking-tight text-on-surface mb-12">
              Week of {weekSlugToTitleDate(latest.week_slug)}
            </h2>
            <DigestContent digest={latest} opportunities={oppsFor(latest.id)} />
            <Link
              href={`/deals/${latest.week_slug}`}
              className="mt-12 inline-block font-sans text-sm text-on-surface-variant hover:text-primary uppercase"
            >
              Permalink for this edition
            </Link>
          </article>
        )}

        {/* Past editions — date-labeled dropdowns */}
        {past.length > 0 && (
          <section className="mt-24">
            <div className="flex items-center gap-3 mb-8">
              <span className="w-7 h-[3px] bg-primary" aria-hidden />
              <h2 className="font-sans text-label-md uppercase text-primary">Past editions</h2>
            </div>
            {past.map((d) => (
              <details key={d.id} className="group bg-surface-card mb-6">
                <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden p-6 lg:p-8 flex items-center justify-between hover:bg-surface-input transition-colors duration-300">
                  <span className="font-serif text-xl lg:text-2xl font-extrabold uppercase tracking-tight text-on-surface">
                    Week of {weekSlugToTitleDate(d.week_slug)}
                  </span>
                  <span className="font-sans text-label-sm uppercase text-primary group-open:hidden" aria-hidden>
                    Read
                  </span>
                  <span className="font-sans text-label-sm uppercase text-on-surface-variant hidden group-open:inline" aria-hidden>
                    Close
                  </span>
                </summary>
                <div className="px-6 lg:px-8 pb-10 pt-4">
                  <DigestContent digest={d} opportunities={oppsFor(d.id)} />
                  <Link
                    href={`/deals/${d.week_slug}`}
                    className="mt-8 inline-block font-sans text-sm text-on-surface-variant hover:text-primary uppercase"
                  >
                    Permalink for this edition
                  </Link>
                </div>
              </details>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
