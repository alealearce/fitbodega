import { ChevronRight, AlertTriangle, Zap, MapPin } from "lucide-react";

// The FitBodega 100 reading experience, shared by all nine list pages:
// podium cards for 1-3, large-type tier for 4-10, decade landmarks, score
// bars, monograms, "steal this / know before you go" takeaways, and factor
// breakdowns in the expanded view. Person lists show segment inline; place
// lists (showCity) show the city.

export type LedgerEntry = {
  rank: number;
  name: string;
  segment: string;
  tier: string;
  city?: string;
  country?: string;
  score: number;
  who: string;
  why: string;
  takeaway?: string;
  factors?: Record<string, number>;
  reach?: string;
  warning?: string | null;
  website?: string | null;
  handles?: Record<string, string>;
};

export type LedgerConfig = {
  scoreName: string;
  kicker: string;
  tierChips?: Record<string, string>;
  tierNotes?: Record<string, string>;
  handleLabels?: Record<string, string>;
  showCity?: boolean;
};

const DEFAULT_HANDLE_LABELS: Record<string, string> = {
  instagram: "Instagram",
  youtube: "YouTube",
  tiktok: "TikTok",
  x: "X",
  linkedin: "LinkedIn",
  facebook: "Facebook",
  podcast: "Podcast",
  strava: "Strava",
};

function handleHref(kind: string, val: string): string | null {
  if (kind === "podcast") return val.startsWith("http") ? val : null;
  return val;
}

// Typographic monogram — the spec's answer to imagery (no photo rights
// issues; real photos come later through claimed entries).
function monogram(name: string): string {
  const words = name.replace(/\(.*?\)/g, "").replace(/^Dr\.?\s+/i, "").trim().split(/\s+/);
  return words.slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

export default function Top100Ledger({
  entries,
  config,
}: {
  entries: LedgerEntry[];
  config: LedgerConfig;
}) {
  const labels = { ...DEFAULT_HANDLE_LABELS, ...config.handleLabels };

  const renderLinks = (e: LedgerEntry) => (
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
        const label = labels[kind] ?? kind;
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
  );

  const renderTakeaway = (e: LedgerEntry, lime?: boolean) =>
    e.takeaway ? (
      <div className="mt-4">
        <div className="flex items-center gap-2.5 mb-1.5">
          <span className={`w-5 h-[3px] ${lime ? "bg-primary-on" : "bg-primary"}`} aria-hidden />
          <span className={`font-sans text-label-sm uppercase ${lime ? "text-primary-on" : "text-primary"}`}>
            {config.kicker}
          </span>
        </div>
        <p className={`font-sans text-sm ${lime ? "text-primary-on/90" : "text-on-surface"}`}>
          {e.takeaway}
        </p>
      </div>
    ) : null;

  const renderFactors = (e: LedgerEntry) =>
    e.factors ? (
      <div className="mt-5 grid grid-cols-3 sm:grid-cols-6 gap-x-4 gap-y-3 max-w-xl">
        {Object.entries(e.factors).map(([k, v]) => (
          <div key={k}>
            <div className="font-sans text-[10px] uppercase tracking-[0.1em] text-on-surface-variant mb-1.5">
              {k}
            </div>
            <div className="h-[3px] bg-surface-input">
              <div className="h-full bg-primary" style={{ width: `${v}%` }} />
            </div>
          </div>
        ))}
      </div>
    ) : null;

  const renderPodium = (e: LedgerEntry, i: number) => (
    <div
      key={e.rank}
      className={`relative overflow-hidden flex flex-col p-7 lg:p-8 min-h-[340px] ${
        i === 0 ? "bg-primary" : "bg-surface-card"
      }`}
    >
      <span
        aria-hidden
        className={`pointer-events-none select-none absolute -bottom-14 -right-2 font-serif font-extrabold leading-none tracking-tighter text-[16rem] ${
          i === 0 ? "text-primary-on/10" : "text-on-surface/[0.05]"
        }`}
      >
        {e.rank}
      </span>
      <div className="relative flex items-start justify-between">
        <div>
          <span className={`font-serif text-4xl font-extrabold tabular-nums leading-none ${i === 0 ? "text-primary-on" : "text-on-surface"}`}>
            {String(e.rank).padStart(2, "0")}
          </span>
          <p className={`font-sans text-label-sm uppercase mt-2 ${i === 0 ? "text-primary-on/70" : "text-on-surface-variant"}`}>
            {config.showCity ? e.city ?? e.segment : e.segment}
          </p>
        </div>
        <div className="text-right">
          <span
            className={`font-serif text-3xl font-extrabold tabular-nums leading-none ${i === 0 ? "text-primary-on/80" : "text-primary"}`}
            title={config.scoreName}
          >
            {e.score}
          </span>
          <p className={`font-sans text-[10px] uppercase tracking-[0.12em] mt-1.5 ${i === 0 ? "text-primary-on/60" : "text-on-surface-variant"}`}>
            Score
          </p>
        </div>
      </div>
      <div className="relative mt-auto pt-10">
        <div className={`inline-flex w-12 h-12 items-center justify-center font-serif font-extrabold text-lg mb-4 ${i === 0 ? "bg-primary-on text-primary" : "bg-surface-input text-on-surface"}`}>
          {monogram(e.name)}
        </div>
        <h3 className={`font-serif text-3xl lg:text-4xl font-extrabold uppercase tracking-tight leading-[1.02] ${i === 0 ? "text-primary-on" : "text-on-surface"}`}>
          {e.name}
        </h3>
        <p className={`font-sans text-sm mt-3 ${i === 0 ? "text-primary-on/80" : "text-on-surface"}`}>{e.who}</p>
        <p className={`font-sans text-sm italic mt-1.5 ${i === 0 ? "text-primary-on/60" : "text-on-surface-variant"}`}>{e.why}</p>
        {renderTakeaway(e, i === 0)}
        <div className={`mt-4 ${i === 0 ? "[&_a]:!text-primary-on [&_span]:!text-primary-on/60" : ""}`}>
          {renderLinks(e)}
        </div>
      </div>
    </div>
  );

  const renderDivider = (from: number) => (
    <div key={`div-${from}`} aria-hidden className="relative overflow-hidden flex items-center gap-4 pt-16 pb-6">
      <span className="font-sans text-label-md uppercase text-primary">
        {String(from).padStart(2, "0")} — {String(from + 9).padStart(2, "0")}
      </span>
      <span className="flex-1" />
      <span className="pointer-events-none select-none absolute right-0 -bottom-8 font-serif font-extrabold leading-none tracking-tighter text-[7rem] text-on-surface/[0.04]">
        {String(from).padStart(2, "0")}
      </span>
    </div>
  );

  const renderRow = (e: LedgerEntry) => {
    const big = e.rank <= 10;
    const chip = config.tierChips?.[e.tier];
    const note = config.tierNotes?.[e.tier];
    return (
      <details key={e.rank} className="group relative">
        <summary className="list-none [&::-webkit-details-marker]:hidden cursor-pointer select-none flex items-baseline gap-4 lg:gap-6 py-5 px-6 lg:px-8 -mx-6 lg:-mx-8 hover:bg-surface-low transition-colors duration-300">
          <span className="font-sans text-label-sm text-on-surface-variant w-8 flex-shrink-0 tabular-nums">
            {String(e.rank).padStart(3, "0")}
          </span>
          {big && (
            <span className="hidden sm:flex flex-shrink-0 self-center w-11 h-11 items-center justify-center font-serif font-extrabold text-base bg-surface-input text-on-surface group-hover:bg-primary group-hover:text-primary-on transition-colors duration-300">
              {monogram(e.name)}
            </span>
          )}
          <span className="min-w-0 flex-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h3 className={`inline font-serif font-extrabold uppercase tracking-tight text-on-surface group-hover:text-primary transition-colors duration-300 ${big ? "text-2xl lg:text-4xl" : "text-lg lg:text-2xl"}`}>
              {e.name}
            </h3>
            <span className="hidden sm:inline font-sans text-label-sm uppercase text-on-surface-variant">
              {config.showCity ? e.city ?? e.segment : e.segment}
            </span>
            {chip && (
              <span className="font-sans text-label-sm uppercase text-primary">{chip}</span>
            )}
          </span>
          <span
            className="flex-shrink-0 font-sans text-base lg:text-lg font-bold tabular-nums text-primary"
            title={config.scoreName}
          >
            {e.score}
          </span>
          <ChevronRight
            size={16}
            className="flex-shrink-0 self-center text-outline-variant transition-transform duration-300 group-open:rotate-90"
            aria-hidden
          />
        </summary>
        {/* Score bar — the ledger reads as a bar chart while skimming */}
        <span
          aria-hidden
          className="pointer-events-none absolute left-6 lg:left-8 -mx-6 lg:-mx-8 bottom-0 h-[2px] bg-primary/30 group-open:bg-primary transition-colors duration-300"
          style={{ width: `${e.score}%` }}
        />
        <div className="pb-8 pt-1 pl-12 lg:pl-14 pr-2 max-w-3xl">
          <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1">
            {config.showCity && e.city && (
              <span className="font-sans text-label-sm uppercase text-on-surface-variant inline-flex items-center gap-1.5">
                <MapPin size={12} className="text-primary" aria-hidden />
                {e.city}
              </span>
            )}
            <span className={`font-sans text-label-sm uppercase text-on-surface-variant ${config.showCity ? "" : "sm:hidden"}`}>
              {e.segment}
            </span>
          </div>
          {note && (
            <p className="font-sans text-sm text-on-surface-variant mb-3 flex items-start gap-2">
              <Zap size={14} className="flex-shrink-0 mt-0.5 text-primary" aria-hidden />
              {note}
            </p>
          )}
          <p className="font-sans text-base text-on-surface mb-1">{e.who}</p>
          <p className="font-sans text-sm text-on-surface-variant italic mb-3">{e.why}</p>
          {e.warning && (
            <p className="font-sans text-sm text-on-surface bg-surface-input px-4 py-3 mb-4 flex items-start gap-2">
              <AlertTriangle size={14} className="flex-shrink-0 mt-1 text-error" aria-hidden />
              {e.warning}
            </p>
          )}
          {renderTakeaway(e)}
          {renderFactors(e)}
          <div className="mt-5">{renderLinks(e)}</div>
        </div>
      </details>
    );
  };

  return (
    <>
      {/* Podium — 1, 2, 3 */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-16">
        {entries.slice(0, 3).map(renderPodium)}
      </div>

      {/* Ledger — 4-10 large, 11+ compact, decade landmarks every ten */}
      <div>
        {entries.slice(3).flatMap((e) => {
          const parts = [];
          if (e.rank > 10 && (e.rank - 1) % 10 === 0) parts.push(renderDivider(e.rank));
          parts.push(renderRow(e));
          return parts;
        })}
      </div>
    </>
  );
}
