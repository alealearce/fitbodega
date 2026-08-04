import type { Metadata } from "next";
import Link from "next/link";
import { SITE, DEFAULT_OG_IMAGE } from "@/lib/config/site";
import { TOP100_LISTS } from "@/components/top100/lists";
import Top100Card from "@/components/top100/Top100Card";
import influencers from "@/data/top-100/fitness-influencers.json";
import gyms from "@/data/top-100/gyms.json";
import retreats from "@/data/top-100/retreats.json";
import hyrox from "@/data/top-100/hyrox.json";
import coaches from "@/data/top-100/coaches.json";
import recovery from "@/data/top-100/recovery.json";
import runclubs from "@/data/top-100/runclubs.json";
import stores from "@/data/top-100/stores.json";
import nutritionists from "@/data/top-100/nutritionists.json";

const PAGE_TITLE = "The FitBodega 100 — Training Culture, Ranked";
const PAGE_DESC =
  "Top-100 world rankings of the people, places, and spaces that define training culture. One scoring system, hard editorial gates, reviewed monthly.";

export const metadata: Metadata = {
  title: "The FitBodega 100",
  description: PAGE_DESC,
  alternates: { canonical: `${SITE.url}/top-100` },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESC,
    url: `${SITE.url}/top-100`,
    images: [DEFAULT_OG_IMAGE],
    siteName: SITE.name,
    locale: "en_US",
    type: "website",
  },
};

type ListData = {
  meta: { updated: string; scoreModel: { name: string } };
  entries: { rank: number; name: string }[];
  bubblingUnder?: { name: string }[];
};

// Keyed by slug so the registry in components/top100/lists.ts stays the
// single source of truth for which lists exist and in what order.
const DATA: Record<string, ListData> = {
  "/top-100-fitness-influencers": influencers as unknown as ListData,
  "/top-100-gyms": gyms as unknown as ListData,
  "/top-100-fitness-retreats": retreats as unknown as ListData,
  "/top-100-hyrox-athletes": hyrox as unknown as ListData,
  "/top-100-online-fitness-coaches": coaches as unknown as ListData,
  "/top-100-recovery-spaces": recovery as unknown as ListData,
  "/top-100-run-clubs": runclubs as unknown as ListData,
  "/top-100-health-food-stores": stores as unknown as ListData,
  "/top-100-nutritionists": nutritionists as unknown as ListData,
};

export default function Top100HubPage() {
  const lists = TOP100_LISTS.map((l) => {
    const d = DATA[l.slug];
    return {
      ...l,
      updated: d?.meta.updated,
      scoreName: d?.meta.scoreModel.name,
      tracked: (d?.entries.length ?? 0) + (d?.bubblingUnder?.length ?? 0),
      top3: d?.entries.slice(0, 3).map((e) => e.name) ?? [],
    };
  });
  const latestUpdated = lists.reduce(
    (max, l) => (l.updated && l.updated > max ? l.updated : max),
    ""
  );
  const totalTracked = lists.reduce((s, l) => s + l.tracked, 0);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "The FitBodega 100",
    description: PAGE_DESC,
    url: `${SITE.url}/top-100`,
    hasPart: lists.map((l) => ({
      "@type": "ItemList",
      name: l.title,
      url: `${SITE.url}${l.slug}`,
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
              The rankings of record
            </p>
          </div>
          <h1 className="font-serif text-display-lg lg:text-display-xl uppercase tracking-tight text-on-surface max-w-4xl">
            The FitBodega <span className="text-primary">100</span>
          </h1>
          <p className="font-sans text-base lg:text-lg text-on-surface-variant mt-6 max-w-2xl">
            The people, places, and spaces that define training culture — ranked. Every list runs
            on the same architecture: six weighted factors, a hard editorial gate, research
            calibrated across segments, and a monthly review that promotes and relegates.
          </p>
          <p className="font-sans text-label-sm uppercase text-on-surface-variant mt-8">
            {totalTracked.toLocaleString()} ranked & tracked · Reviewed monthly · Updated {latestUpdated}
          </p>
        </div>
      </section>

      {/* ── The list wall — poster cards from the registry. Every 4th card
          is permanently lime; dark cards invert to lime on hover. A giant
          cropped "100" numeral textures every card. ── */}
      <section className="py-20 lg:py-24 bg-surface-low">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-7 h-[3px] bg-primary" aria-hidden />
            <p className="font-sans text-label-md uppercase text-primary">The rankings</p>
          </div>
          <h2 className="font-serif text-display-md uppercase text-on-surface mb-14">
            The Index
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {lists.map((l, i) => (
              <Top100Card
                key={l.slug}
                slug={l.slug}
                navLabel={l.navLabel}
                top3={l.top3}
                lime={i % 4 === 0}
                indexLabel={`${String(i + 1).padStart(2, "0")} / ${String(lists.length).padStart(2, "0")}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── How the system works ── */}
      <section className="py-20 lg:py-24 bg-bg">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-10">
            <span className="w-7 h-[3px] bg-primary" aria-hidden />
            <p className="font-sans text-label-md uppercase text-primary">How it works</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-3 max-w-5xl">
            <div className="bg-surface-card px-6 py-7">
              <p className="font-serif text-xl font-extrabold uppercase tracking-tight text-on-surface">
                Six factors
              </p>
              <p className="font-sans text-sm text-on-surface-variant mt-3">
                Every list scores six weighted factors tuned to its subject — reach is measured
                the same way everywhere; the judgment factors change with the territory.
              </p>
            </div>
            <div className="bg-surface-card px-6 py-7">
              <p className="font-serif text-xl font-extrabold uppercase tracking-tight text-on-surface">
                Hard gates
              </p>
              <p className="font-sans text-sm text-on-surface-variant mt-3">
                Coaches must actually coach. Nutritionists must hold real credentials. Gyms must
                be places you can walk into. Fame alone gets nobody in.
              </p>
            </div>
            <div className="bg-surface-card px-6 py-7">
              <p className="font-serif text-xl font-extrabold uppercase tracking-tight text-on-surface">
                Monthly review
              </p>
              <p className="font-sans text-sm text-on-surface-variant mt-3">
                Rankings are reviewed monthly. New names bubble up, closures and fades drop out,
                and every list keeps a public on-the-radar tier.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Outro CTA ── */}
      <section className="pb-20 lg:pb-24 bg-bg">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="bg-primary px-8 py-12 lg:px-14 lg:py-16">
            <h2 className="font-serif text-display-md uppercase text-primary-on max-w-2xl">
              Belong on one of these?
            </h2>
            <p className="font-sans text-base text-primary-on/80 mt-4 max-w-xl">
              Corrections, disputes, and names we should be tracking:{" "}
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
