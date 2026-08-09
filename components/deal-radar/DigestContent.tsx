import Image from "next/image";
import { ArrowUpRight, ChevronRight, Zap } from "lucide-react";
import type { DrOpportunity, DrWeeklyDigest } from "@/lib/deal-radar/types";

// The Deal Radar reading experience — same grammar as the FitBodega 100
// Ledger (components/top100/Ledger.tsx): podium cards for the top three,
// collapsible ledger rows with score bars, monogram/favicon avatars, ghost
// numerals. One unified ranking by score; each row carries its signal chip
// (APPLY NOW for open collabs, PITCH THEM for spend signals).

interface Props {
  digest: DrWeeklyDigest;
  opportunities: DrOpportunity[];
}

function monogram(name: string): string {
  const words = name.replace(/\(.*?\)/g, "").trim().split(/\s+/);
  return words.slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

// Brand favicons give the ledger color without image-rights problems; the
// typographic monogram is the fallback for unnamed or domainless brands.
function faviconUrl(domain: string | null): string | null {
  return domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128` : null;
}

function segmentText(o: DrOpportunity): string {
  if (o.source_type === "listed_deal") return o.compensation_text ?? o.offer_type ?? "Open collab";
  const evidence = (o.meta?.evidence as string | undefined) ?? "signal";
  return o.active_ad_count ? `${o.active_ad_count} active ads · ${evidence}` : `Creator-ad spend · ${evidence}`;
}

function detailText(o: DrOpportunity): string | null {
  return o.deliverables ?? (o.meta?.evidenceNote as string | undefined) ?? null;
}

function Avatar({ o, sizeClass, monogramClass }: { o: DrOpportunity; sizeClass: string; monogramClass: string }) {
  const src = faviconUrl(o.brand_domain);
  return src ? (
    <span className={`${sizeClass} bg-surface-input p-2`}>
      <Image src={src} alt="" width={48} height={48} className="w-full h-full object-contain" unoptimized />
    </span>
  ) : (
    <span className={`${sizeClass} ${monogramClass}`}>{monogram(o.brand_name)}</span>
  );
}

function Links({ o, lime }: { o: DrOpportunity; lime?: boolean }) {
  const base = lime ? "text-primary-on font-medium" : "text-on-surface font-medium hover:text-primary";
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-1.5 font-sans text-sm">
      {o.source_url && (
        <a
          href={o.source_url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className={`inline-flex items-center gap-1.5 transition-colors ${base} ${lime ? "underline" : ""}`}
        >
          {o.source_type === "listed_deal" ? "Apply / view listing" : "View evidence"}
          <ArrowUpRight size={13} aria-hidden />
        </a>
      )}
      {o.brand_domain && (
        <a
          href={`https://${o.brand_domain}`}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className={`transition-colors ${lime ? "text-primary-on/80" : "text-on-surface-variant hover:text-primary"}`}
        >
          {o.brand_domain}
        </a>
      )}
    </div>
  );
}

function Pitch({ o, lime }: { o: DrOpportunity; lime?: boolean }) {
  const pitch = o.meta?.pitchAngle as string | undefined;
  if (!pitch) return null;
  return (
    <div className="mt-4">
      <div className="flex items-center gap-2.5 mb-1.5">
        <span className={`w-5 h-[3px] ${lime ? "bg-primary-on" : "bg-primary"}`} aria-hidden />
        <span className={`font-sans text-label-sm uppercase ${lime ? "text-primary-on" : "text-primary"}`}>
          The pitch
        </span>
      </div>
      <p className={`font-sans text-sm ${lime ? "text-primary-on/90" : "text-on-surface"}`}>{pitch}</p>
    </div>
  );
}

function Platforms({ o, lime }: { o: DrOpportunity; lime?: boolean }) {
  if (o.platforms.length === 0) return null;
  return (
    <p className={`font-sans text-label-sm uppercase mt-3 ${lime ? "text-primary-on/60" : "text-on-surface-variant"}`}>
      {o.platforms.join(" · ")}
    </p>
  );
}

function chipFor(o: DrOpportunity): { label: string } {
  return o.source_type === "listed_deal" ? { label: "Apply now" } : { label: "Pitch them" };
}

function Podium({ o, i }: { o: DrOpportunity; i: number }) {
  const lime = i === 0;
  const rank = i + 1;
  return (
    <div className={`relative overflow-hidden flex flex-col p-7 lg:p-8 min-h-[320px] ${lime ? "bg-primary" : "bg-surface-card"}`}>
      <span
        aria-hidden
        className={`pointer-events-none select-none absolute -bottom-14 -right-2 font-serif font-extrabold leading-none tracking-tighter text-[16rem] ${lime ? "text-primary-on/10" : "text-on-surface/[0.05]"}`}
      >
        {rank}
      </span>
      <div className="relative flex items-start justify-between">
        <div>
          <span className={`font-serif text-4xl font-extrabold tabular-nums leading-none ${lime ? "text-primary-on" : "text-on-surface"}`}>
            {String(rank).padStart(2, "0")}
          </span>
          <p className={`font-sans text-label-sm uppercase mt-2 ${lime ? "text-primary-on/70" : "text-on-surface-variant"}`}>
            {chipFor(o).label} · {segmentText(o)}
          </p>
        </div>
        <div className="text-right">
          <span className={`font-serif text-3xl font-extrabold tabular-nums leading-none ${lime ? "text-primary-on/80" : "text-primary"}`} title="Deal Radar score">
            {o.score}
          </span>
          <p className={`font-sans text-[10px] uppercase tracking-[0.12em] mt-1.5 ${lime ? "text-primary-on/60" : "text-on-surface-variant"}`}>
            Score
          </p>
        </div>
      </div>
      <div className="relative mt-auto pt-10">
        <div className="mb-4">
          <Avatar
            o={o}
            sizeClass="inline-flex w-12 h-12 items-center justify-center"
            monogramClass={`font-serif font-extrabold text-lg ${lime ? "bg-primary-on text-primary" : "bg-surface-input text-on-surface"}`}
          />
        </div>
        <h3 className={`font-serif text-3xl lg:text-4xl font-extrabold uppercase tracking-tight leading-[1.02] ${lime ? "text-primary-on" : "text-on-surface"}`}>
          {o.brand_name}
        </h3>
        {detailText(o) && (
          <p className={`font-sans text-sm mt-3 ${lime ? "text-primary-on/80" : "text-on-surface"}`}>{detailText(o)}</p>
        )}
        <Pitch o={o} lime={lime} />
        <Platforms o={o} lime={lime} />
        <div className="mt-4">
          <Links o={o} lime={lime} />
        </div>
      </div>
    </div>
  );
}

function Row({ o, rank }: { o: DrOpportunity; rank: number }) {
  const big = rank <= 10;
  const evidence = o.meta?.evidence as string | undefined;
  return (
    <details className="group relative">
      <summary className="list-none [&::-webkit-details-marker]:hidden cursor-pointer select-none flex items-baseline gap-4 lg:gap-6 py-5 px-6 lg:px-8 -mx-6 lg:-mx-8 hover:bg-surface-low transition-colors duration-300">
        <span className="font-sans text-label-sm text-on-surface-variant w-8 flex-shrink-0 tabular-nums">
          {String(rank).padStart(3, "0")}
        </span>
        <span className="hidden sm:block flex-shrink-0 self-center">
          <Avatar
            o={o}
            sizeClass="flex w-11 h-11 items-center justify-center"
            monogramClass="font-serif font-extrabold text-base bg-surface-input text-on-surface group-hover:bg-primary group-hover:text-primary-on transition-colors duration-300"
          />
        </span>
        <span className="min-w-0 flex-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h3 className={`inline font-serif font-extrabold uppercase tracking-tight text-on-surface group-hover:text-primary transition-colors duration-300 ${big ? "text-2xl lg:text-4xl" : "text-lg lg:text-2xl"}`}>
            {o.brand_name}
          </h3>
          <span className="hidden sm:inline font-sans text-label-sm uppercase text-on-surface-variant">
            {segmentText(o)}
          </span>
          <span className="font-sans text-label-sm uppercase text-primary">{chipFor(o).label}</span>
        </span>
        <span className="flex-shrink-0 font-sans text-base lg:text-lg font-bold tabular-nums text-primary" title="Deal Radar score">
          {o.score}
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
        style={{ width: `${o.score}%` }}
      />
      <div className="pb-8 pt-1 pl-12 lg:pl-14 pr-2 max-w-3xl">
        <p className="font-sans text-label-sm uppercase text-on-surface-variant mb-2 sm:hidden">{segmentText(o)}</p>
        {evidence && (
          <p className="font-sans text-sm text-on-surface-variant mb-3 flex items-start gap-2">
            <Zap size={14} className="flex-shrink-0 mt-0.5 text-primary" aria-hidden />
            Evidence: {evidence}
            {evidence === "inferred" ? " — treat as warm, verify before pitching" : ""}
          </p>
        )}
        {detailText(o) && <p className="font-sans text-base text-on-surface mb-1">{detailText(o)}</p>}
        <Pitch o={o} />
        <Platforms o={o} />
        <div className="mt-5">
          <Links o={o} />
        </div>
      </div>
    </details>
  );
}

export default function DigestContent({ digest, opportunities }: Props) {
  const ranked = [...opportunities].sort((a, b) => b.score - a.score);
  const podium = ranked.slice(0, 3);
  const rest = ranked.slice(3);

  return (
    <div>
      {digest.intro_copy && (
        <p className="font-sans text-lg text-on-surface leading-relaxed whitespace-pre-line mb-14 max-w-2xl">
          {digest.intro_copy}
        </p>
      )}

      {/* Podium — the three strongest signals of the week */}
      {podium.length === 3 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-16">
          {podium.map((o, i) => <Podium key={o.id} o={o} i={i} />)}
        </div>
      )}

      {/* Ledger */}
      <div>
        {(podium.length === 3 ? rest : ranked).map((o, i) => (
          <Row key={o.id} o={o} rank={(podium.length === 3 ? 4 : 1) + i} />
        ))}
      </div>
    </div>
  );
}
