import type { Metadata } from "next";
import Link from "next/link";
import {
  Trophy,
  Megaphone,
  Video,
  TrendingUp,
  Globe,
  History,
  ChevronRight,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";
import { SITE, DEFAULT_OG_IMAGE } from "@/lib/config/site";
import SeriesLinks from "@/components/top100/SeriesLinks";
import data from "@/data/top-100/hyrox.json";

const WEIGHT_ICONS: Record<string, LucideIcon> = {
  results: Trophy,
  reach: Megaphone,
  content: Video,
  momentum: TrendingUp,
  crossover: Globe,
  longevity: History,
};

const HANDLE_LABELS: Record<string, string> = {
  instagram: "Instagram",
  youtube: "YouTube",
  tiktok: "TikTok",
  x: "X",
  podcast: "Podcast",
  strava: "Strava",
};

const PAGE_TITLE = "Top 100 Hyrox Athletes to Follow 2026";
const PAGE_DESC =
  "The Hyrox racers and voices worth following, ranked by the Hyrox Follow Score — results, reach, content, momentum, crossover, and longevity. Reviewed monthly against the current season.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESC,
  alternates: { canonical: `${SITE.url}/top-100-hyrox-athletes` },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESC,
    url: `${SITE.url}/top-100-hyrox-athletes`,
    images: [DEFAULT_OG_IMAGE],
    siteName: SITE.name,
    locale: "en_US",
    type: "website",
  },
};

type Handles = Record<string, string>;
type Entry = {
  rank: number;
  name: string;
  segment: string;
  tier: string;
  country?: string;
  score: number;
  who: string;
  why: string;
  reach?: string;
  warning?: string | null;
  website?: string | null;
  handles?: Handles;
};
type Bubbling = Omit<Entry, "rank">;
type Meta = {
  title: string;
  subtitle: string;
  series: string;
  updated: string;
  reviewCadence: string;
  disclaimer: string;
  scoreModel: { name: string; gate: string; weights: Record<string, number>; notes: string };
};

function handleHref(kind: string, val: string): string | null {
  if (kind === "podcast") return val.startsWith("http") ? val : null;
  return val;
}

export default function Top100HyroxAthletesPage() {
  const meta = data.meta as unknown as Meta;
  const entries = data.entries as unknown as Entry[];
  const bubbling = (data.bubblingUnder ?? []) as unknown as Bubbling[];
  const weights = meta.scoreModel.weights;

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

  const renderRow = (e: Entry) => (
    <details key={e.rank} className="group">
      <summary className="list-none [&::-webkit-details-marker]:hidden cursor-pointer select-none flex items-baseline gap-4 lg:gap-6 py-5 px-6 lg:px-8 -mx-6 lg:-mx-8 hover:bg-surface-low transition-colors duration-300">
        <span className="font-sans text-label-sm text-on-surface-variant w-8 flex-shrink-0 tabular-nums">
          {String(e.rank).padStart(3, "0")}
        </span>
        <span className="min-w-0 flex-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h3 className="inline font-serif text-lg lg:text-2xl font-extrabold uppercase tracking-tight text-on-surface group-hover:text-primary transition-colors duration-300">
            {e.name}
          </h3>
          <span className="hidden sm:inline font-sans text-label-sm uppercase text-on-surface-variant">
            {e.segment}
          </span>
          {e.tier === "creator" && (
            <span className="font-sans text-label-sm uppercase text-primary">Creator</span>
          )}
        </span>
        <span
          className="flex-shrink-0 font-sans text-base lg:text-lg font-bold tabular-nums text-primary"
          title={meta.scoreModel.name}
        >
          {e.score}
        </span>
        <ChevronRight
          size={16}
          className="flex-shrink-0 self-center text-outline-variant transition-transform duration-300 group-open:rotate-90"
          aria-hidden
        />
      </summary>
      <div className="pb-8 pt-1 pl-12 lg:pl-14 pr-2 max-w-3xl">
        <div className="sm:hidden mb-2">
          <span className="font-sans text-label-sm uppercase text-on-surface-variant">{e.segment}</span>
        </div>
        <p className="font-sans text-base text-on-surface mb-1">{e.who}</p>
        <p className="font-sans text-sm text-on-surface-variant italic mb-3">{e.why}</p>
        {e.warning && (
          <p className="font-sans text-sm text-on-surface bg-surface-input px-4 py-3 mb-4 flex items-start gap-2">
            <AlertTriangle size={14} className="flex-shrink-0 mt-1 text-error" aria-hidden />
            {e.warning}
          </p>
        )}
        <div className="flex flex-wrap gap-x-5 gap-y-1.5 font-sans text-sm">
          {e.website && (
            <a
              href={e.website}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="text-on-surface font-medium hover:text-primary transition-colors"
            >
              Website
            </a>
          )}
          {Object.entries(e.handles ?? {}).map(([kind, val]) => {
            const href = handleHref(kind, val);
            const label = HANDLE_LABELS[kind] ?? kind;
            return href ? (
              <a
                key={kind}
                href={href}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="text-on-surface hover:text-primary transition-colors"
              >
                {label}
              </a>
            ) : (
              <span key={kind} className="text-on-surface-variant">
                {label}: {val}
              </span>
            );
          })}
          {e.reach && <span className="text-on-surface-variant">{e.reach}</span>}
        </div>
      </div>
    </details>
  );

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
            <p className="font-sans text-label-md uppercase text-primary">{meta.series}</p>
          </div>
          <h1 className="font-serif text-display-lg lg:text-display-xl uppercase tracking-tight text-on-surface max-w-5xl">
            Top 100 <span className="text-primary">Hyrox</span> Athletes to Follow
          </h1>
          <p className="font-sans text-base lg:text-lg text-on-surface-variant mt-6 max-w-2xl">
            {meta.subtitle}
          </p>
          <p className="font-sans text-label-sm uppercase text-on-surface-variant mt-8">
            Reviewed {meta.reviewCadence} · Updated {meta.updated}
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
            The {meta.scoreModel.name}
          </h2>
          <p className="font-sans text-base text-on-surface-variant max-w-3xl mb-12">
            {meta.scoreModel.gate}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {Object.entries(weights).map(([k, v]) => {
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
            {meta.scoreModel.notes}
          </p>
          <p className="font-sans text-xs text-on-surface-variant/70 max-w-3xl mt-3">
            {meta.disclaimer}
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
          <h2 className="font-serif text-display-md uppercase text-on-surface mb-14">The 100</h2>
          <div>{entries.map(renderRow)}</div>
        </div>
      </section>

      {/* ── Bubbling under ── */}
      {bubbling.length > 0 && (
        <section className="py-20 lg:py-24 bg-surface-low">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-7 h-[3px] bg-primary" aria-hidden />
              <p className="font-sans text-label-md uppercase text-primary">On the radar</p>
            </div>
            <h2 className="font-serif text-display-md uppercase text-on-surface mb-6">
              Bubbling Under
            </h2>
            <p className="font-sans text-base text-on-surface-variant max-w-2xl mb-10">
              Researched and scored, currently outside the 100. The monthly review promotes and
              relegates.
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-3">
              {bubbling.map((b) => (
                <span key={b.name} className="font-sans text-sm">
                  <span className="text-on-surface font-medium">{b.name}</span>{" "}
                  <span className="text-on-surface-variant tabular-nums">{b.score}</span>
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      <SeriesLinks current="/top-100-hyrox-athletes" />

      {/* ── Outro CTA ── */}
      <section className="pb-20 lg:pb-24 bg-bg">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="bg-primary px-8 py-12 lg:px-14 lg:py-16">
            <h2 className="font-serif text-display-md uppercase text-primary-on max-w-2xl">
              Racing elite and not on here?
            </h2>
            <p className="font-sans text-base text-primary-on/80 mt-4 max-w-xl">
              The ranking is reviewed {meta.reviewCadence} against the current season. Corrections,
              disputes, and athletes we should be tracking:{" "}
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
