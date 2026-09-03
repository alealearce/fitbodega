import type { Metadata } from "next";
import Link from "next/link";
import {
  Megaphone,
  Activity,
  Award,
  TrendingUp,
  Banknote,
  Repeat,
  type LucideIcon,
} from "lucide-react";
import { SITE, DEFAULT_OG_IMAGE } from "@/lib/config/site";
import SeriesLinks from "@/components/top100/SeriesLinks";
import HeroClaimLines from "@/components/top100/HeroClaimLines";
import Top100Ledger, { type LedgerEntry } from "@/components/top100/Ledger";
import { getClaimedMap } from "@/lib/top100/claims";
import data from "@/data/top-100/van50.json";

const WEIGHT_ICONS: Record<string, LucideIcon> = {
  reach: Megaphone,
  engagement: Activity,
  credibility: Award,
  impact: TrendingUp,
  commerce: Banknote,
  consistency: Repeat,
};

// Same model as the global influencers list, reach curve recalibrated for a
// city: 10K followers scores 40, each decade of growth adds 20. Weights must
// match scripts/build-van50-journal.mjs.
const WEIGHTS: Record<string, number> = {
  reach: 0.25,
  credibility: 0.2,
  engagement: 0.15,
  impact: 0.15,
  consistency: 0.15,
  commerce: 0.1,
};

const PAGE_TITLE = "Top 50 Fitness Influencers in Vancouver 2026";
const PAGE_DESC =
  "The 50 people who actually move Vancouver — physios, lifters, dietitians, and run-club founders, ranked by the Fitness Influence Score. Reviewed monthly.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESC,
  alternates: { canonical: `${SITE.url}/top-50-fitness-influencers-vancouver` },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESC,
    url: `${SITE.url}/top-50-fitness-influencers-vancouver`,
    images: [DEFAULT_OG_IMAGE],
    siteName: SITE.name,
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: PAGE_TITLE,
    description: PAGE_DESC,
    images: [DEFAULT_OG_IMAGE.url],
  },
};

// Claimed-state comes from Supabase — revalidate hourly.
export const revalidate = 3600;

export default async function Van50Page() {
  const meta = data.meta as { title: string; updated: string };
  const entries = data.entries as unknown as LedgerEntry[];
  const claimed = await getClaimedMap("van50");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: meta.title,
    description: PAGE_DESC,
    numberOfItems: entries.length,
    itemListElement: entries.map((e) => ({
      "@type": "ListItem",
      position: e.rank,
      name: e.name,
      ...(e.website ? { url: e.website } : {}),
    })),
  };

  return (
    <main className="bg-bg">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── Hero ── */}
      <section className="pt-32 pb-20 lg:pt-40 lg:pb-24 bg-bg">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-7 h-[3px] bg-primary" aria-hidden />
            <p className="font-sans text-label-md uppercase text-primary">
              The Vancouver 50 · City Edition
            </p>
          </div>
          <h1 className="font-serif text-display-lg lg:text-display-xl uppercase tracking-tight text-on-surface max-w-4xl">
            Top 50 Fitness Influencers in{" "}
            <span className="text-primary">Vancouver</span> 2026
          </h1>
          <p className="font-sans text-base lg:text-lg text-on-surface-variant mt-6 max-w-2xl">
            The 50 people who actually move this city. Not the biggest follower
            counts — the physios, Olympic hopefuls, dietitians, and run-club
            founders Vancouver trains with, ranked by the Fitness Influence
            Score.
          </p>
          <HeroClaimLines />
          <p className="font-sans text-label-sm uppercase text-on-surface-variant mt-8">
            Reviewed monthly · Updated {meta.updated}
          </p>
        </div>
      </section>

      {/* ── Methodology ── */}
      <section className="py-20 lg:py-24 bg-surface-low">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-7 h-[3px] bg-primary" aria-hidden />
            <p className="font-sans text-label-md uppercase text-primary">How we rank</p>
          </div>
          <h2 className="font-serif text-display-md uppercase text-on-surface mb-6">
            The Fitness Influence Score
          </h2>
          <p className="font-sans text-base text-on-surface-variant max-w-3xl mb-12">
            Same model as the global Top 100, tuned for one city. To qualify, a
            creator lives and works in Greater Vancouver and posts fitness,
            training, or nutrition as a core topic. The reach curve is
            recalibrated for a city list — local depth beats global noise.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {Object.entries(WEIGHTS).map(([k, v]) => {
              const Icon = WEIGHT_ICONS[k];
              return (
                <div key={k} className="bg-surface-card px-5 py-6">
                  {Icon && <Icon size={16} className="mb-4 text-primary" aria-hidden />}
                  <div className="font-serif text-3xl font-extrabold tabular-nums text-on-surface leading-none">
                    {Math.round(v * 100)}
                    <span className="text-primary">%</span>
                  </div>
                  <div className="font-sans text-label-sm uppercase text-on-surface-variant mt-3">
                    {k}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="font-sans text-sm text-on-surface-variant max-w-3xl mt-8">
            Follower counts are point-in-time approximations from public
            profiles. Scores reflect our editorial read of public work — not
            endorsements, sponsorships, or paid placement.
          </p>
        </div>
      </section>

      {/* ── The ranking ── */}
      <section className="py-20 lg:py-24 bg-bg">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-7 h-[3px] bg-primary" aria-hidden />
            <p className="font-sans text-label-md uppercase text-primary">The ranking</p>
          </div>
          <h2 className="font-serif text-display-md uppercase text-on-surface mb-14">The 50</h2>
          <Top100Ledger
            entries={entries}
            claim={{ list: "van50", claimed }}
            config={{
              scoreName: "Fitness Influence Score",
              kicker: "Steal this",
            }}
          />
        </div>
      </section>

      <SeriesLinks current="/top-50-fitness-influencers-vancouver" />

      {/* ── Outro CTA ── */}
      <section className="pb-20 lg:pb-24 bg-bg">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="bg-primary px-8 py-12 lg:px-14 lg:py-16">
            <h2 className="font-serif text-display-md uppercase text-primary-on max-w-2xl">
              Know a name we missed?
            </h2>
            <p className="font-sans text-base text-primary-on/80 mt-4 max-w-xl">
              The ranking is reviewed monthly. Corrections, disputes, and
              Vancouver names we should be tracking:{" "}
              <a href={`mailto:${SITE.email}`} className="font-bold underline underline-offset-4">
                {SITE.email}
              </a>
            </p>
            <Link
              href="/submit"
              className="inline-block mt-8 px-8 py-4 bg-bg text-on-surface font-sans text-sm font-bold tracking-wide uppercase hover:opacity-90 transition-opacity"
            >
              List your space on FitBodega
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
