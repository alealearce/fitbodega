"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ChevronRight } from "lucide-react";
import { applyHost, originLabel } from "@/lib/deal-radar/board";
import type { DrOpportunity } from "@/lib/deal-radar/types";

// The board, in two sections that never blur into each other.
//
//   Section A — On the Board: deals a creator can act on today. Brand-posted
//     deals first (with a designed empty state when none have cleared review),
//     then open listings we found, each card naming where you apply.
//   Section B — The Radar: brands we track that are spending on creator
//     content somewhere else. Intelligence, labelled as intelligence.
//
// Ordering uses the internal score; the score is never shown (owner call
// 2026-08-19). Same ledger grammar as the FitBodega 100.

interface Props {
  posted: DrOpportunity[];
  found: DrOpportunity[];
  radar: DrOpportunity[];
  variant?: "preview" | "full";
}

const PREVIEW_LIMIT = 3;

function monogram(name: string): string {
  return name
    .replace(/\(.*?\)/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function Avatar({ o }: { o: DrOpportunity }) {
  return o.brand_domain ? (
    <span className="flex w-11 h-11 items-center justify-center bg-surface-input p-2">
      <Image
        src={`https://www.google.com/s2/favicons?domain=${o.brand_domain}&sz=128`}
        alt=""
        width={48}
        height={48}
        className="w-full h-full object-contain"
        unoptimized
      />
    </span>
  ) : (
    <span className="flex w-11 h-11 items-center justify-center bg-surface-input font-serif font-extrabold text-base text-on-surface">
      {monogram(o.brand_name)}
    </span>
  );
}

function Kicker({ children, heading }: { children: React.ReactNode; heading?: boolean }) {
  const label = "font-sans text-label-md uppercase text-primary";
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="w-7 h-[3px] bg-primary" aria-hidden />
      {heading ? <h3 className={label}>{children}</h3> : <p className={label}>{children}</p>}
    </div>
  );
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-sans text-label-sm uppercase text-on-surface-variant mb-5">{children}</p>
  );
}

// ── Section A row — an action, and where that action happens ───────────────

function DealRow({ o, rank }: { o: DrOpportunity; rank: number }) {
  const host = applyHost(o);
  const postedHere = o.source === "brand_direct";
  return (
    <details className="group">
      <summary className="list-none [&::-webkit-details-marker]:hidden cursor-pointer select-none flex items-baseline gap-4 lg:gap-6 py-5 px-6 lg:px-8 -mx-6 lg:-mx-8 hover:bg-surface-low transition-colors duration-300">
        <span className="font-sans text-label-sm text-on-surface-variant w-8 flex-shrink-0 tabular-nums">
          {String(rank).padStart(3, "0")}
        </span>
        <span className="hidden sm:block flex-shrink-0 self-center">
          <Avatar o={o} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h4 className="inline font-serif text-xl lg:text-3xl font-extrabold uppercase tracking-tight text-on-surface group-hover:text-primary transition-colors duration-300">
              {o.brand_name}
            </h4>
            {o.compensation_text && (
              <span className="font-sans text-label-sm uppercase text-on-surface-variant">
                {o.compensation_text}
              </span>
            )}
          </span>
          <span
            className={`mt-1.5 block font-sans text-label-sm uppercase ${
              postedHere ? "text-primary" : "text-on-surface-variant"
            }`}
          >
            {originLabel(o)}
            {host && !postedHere ? ` · apply on ${host}` : ""}
          </span>
        </span>
        <ChevronRight
          size={16}
          className="flex-shrink-0 self-center text-outline-variant transition-transform duration-300 group-open:rotate-90"
          aria-hidden
        />
      </summary>
      <div className="pb-8 pt-1 pl-12 lg:pl-14 pr-2 max-w-3xl">
        {o.deliverables && (
          <p className="font-sans text-base text-on-surface mb-3">{o.deliverables}</p>
        )}
        {o.platforms.length > 0 && (
          <p className="font-sans text-label-sm uppercase text-on-surface-variant mb-4">
            {o.platforms.join(" · ")}
          </p>
        )}
        {o.source_url ? (
          <a
            href={o.source_url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="inline-flex items-center gap-1.5 font-sans text-sm font-medium text-on-surface hover:text-primary transition-colors"
          >
            {postedHere ? "Apply for this deal" : `Apply on ${host ?? "the listing"}`}
            <ArrowUpRight size={13} aria-hidden />
          </a>
        ) : (
          <p className="font-sans text-sm text-on-surface-variant">
            No public application link — Radar subscribers get the contact details in the
            weekly email.
          </p>
        )}
      </div>
    </details>
  );
}

// ── Section B row — a spend signal, and what we know about it ──────────────

function RadarRow({ o, rank }: { o: DrOpportunity; rank: number }) {
  const evidence = (o.meta?.evidence as string | undefined) ?? null;
  const note = o.meta?.evidenceNote as string | undefined;
  const working = o.meta?.pitchAngle as string | undefined;
  const signal = o.active_ad_count
    ? `${o.active_ad_count} active creator ads`
    : "Spending on creator content";
  return (
    <details className="group">
      <summary className="list-none [&::-webkit-details-marker]:hidden cursor-pointer select-none flex items-baseline gap-4 lg:gap-6 py-5 px-6 lg:px-8 -mx-6 lg:-mx-8 hover:bg-surface-low transition-colors duration-300">
        <span className="font-sans text-label-sm text-on-surface-variant w-8 flex-shrink-0 tabular-nums">
          {String(rank).padStart(3, "0")}
        </span>
        <span className="hidden sm:block flex-shrink-0 self-center">
          <Avatar o={o} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h4 className="inline font-serif text-xl lg:text-3xl font-extrabold uppercase tracking-tight text-on-surface group-hover:text-primary transition-colors duration-300">
              {o.brand_name}
            </h4>
            <span className="font-sans text-label-sm uppercase text-on-surface-variant">
              {signal}
            </span>
          </span>
          <span className="mt-1.5 block font-sans text-label-sm uppercase text-on-surface-variant">
            No deal posted here{evidence ? ` · ${evidence}` : ""}
          </span>
        </span>
        <ChevronRight
          size={16}
          className="flex-shrink-0 self-center text-outline-variant transition-transform duration-300 group-open:rotate-90"
          aria-hidden
        />
      </summary>
      <div className="pb-8 pt-1 pl-12 lg:pl-14 pr-2 max-w-3xl">
        {note && <p className="font-sans text-base text-on-surface mb-3">{note}</p>}
        {working && (
          <>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="w-5 h-[3px] bg-primary" aria-hidden />
              <span className="font-sans text-label-sm uppercase text-primary">
                How they work with creators
              </span>
            </div>
            <p className="font-sans text-sm text-on-surface mb-4">{working}</p>
          </>
        )}
        {evidence === "inferred" && (
          <p className="font-sans text-sm text-on-surface-variant mb-4">
            Inferred from public reporting — verify before you spend time on it.
          </p>
        )}
        <div className="flex flex-wrap gap-x-5 gap-y-1.5">
          {o.source_url && (
            <a
              href={o.source_url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="inline-flex items-center gap-1.5 font-sans text-sm font-medium text-on-surface hover:text-primary transition-colors"
            >
              Where we saw the spend
              <ArrowUpRight size={13} aria-hidden />
            </a>
          )}
          {o.brand_domain && (
            <a
              href={`https://${o.brand_domain}`}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="font-sans text-sm text-on-surface-variant hover:text-primary transition-colors"
            >
              {o.brand_domain}
            </a>
          )}
        </div>
      </div>
    </details>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2.5 font-sans text-label-sm uppercase transition-colors duration-200 ${
        active ? "bg-primary text-primary-on" : "bg-surface-input text-on-surface hover:bg-surface-bright"
      }`}
    >
      {children}
    </button>
  );
}

export default function DealBoard({
  posted,
  found,
  radar,
  variant = "full",
}: Props) {
  const preview = variant === "preview";

  // Section A filters — deal type, platform, and whether the pay is stated.
  const [offerType, setOfferType] = useState<string>("all");
  const [platform, setPlatform] = useState<string>("all");
  const [payOnly, setPayOnly] = useState(false);
  // Section B filters — how strong the signal is and how it was established.
  const [spend, setSpend] = useState<string>("all");
  const [evidence, setEvidence] = useState<string>("all");

  // Source data tags platforms loosely ("social", "UGC video", "YouTube
  // Shorts"). Filter on the three that mean something to a creator, matched
  // loosely so "YouTube Shorts" counts as YouTube.
  const platforms = useMemo(() => {
    const canonical = ["Instagram", "TikTok", "YouTube"];
    const all = [...posted, ...found].flatMap((o) => o.platforms.map((p) => p.toLowerCase()));
    return canonical.filter((c) => all.some((p) => p.includes(c.toLowerCase())));
  }, [posted, found]);

  const matchDeal = (o: DrOpportunity) => {
    if (offerType !== "all" && o.offer_type !== offerType) return false;
    if (
      platform !== "all" &&
      !o.platforms.some((p) => p.toLowerCase().includes(platform.toLowerCase()))
    ) {
      return false;
    }
    if (payOnly && !o.compensation_text) return false;
    return true;
  };

  const matchRadar = (o: DrOpportunity) => {
    if (spend === "high" && (o.active_ad_count ?? 0) < 100) return false;
    if (spend === "tracked" && !o.active_ad_count) return false;
    if (evidence !== "all" && ((o.meta?.evidence as string | undefined) ?? "") !== evidence) return false;
    return true;
  };

  const postedShown = preview ? posted.slice(0, PREVIEW_LIMIT) : posted.filter(matchDeal);
  const foundShown = preview ? found.slice(0, PREVIEW_LIMIT) : found.filter(matchDeal);
  const radarShown = preview ? radar.slice(0, PREVIEW_LIMIT) : radar.filter(matchRadar);

  return (
    <div>
      {/* ── Section A — deals you can act on ── */}
      <section>
        <Kicker heading>On the board</Kicker>
        <p className="font-sans text-base text-on-surface-variant max-w-2xl">
          {posted.length > 0
            ? "Brand deals posted to FitBodega, plus open listings we found on public boards and brand program pages. Every card says where the application actually happens."
            : "Open listings we found on public boards and brand program pages. Every card says where the application actually happens."}
        </p>

        {!preview && (posted.length > 0 || found.length > 0) && (
          <div className="mt-8 space-y-3">
            <div className="flex flex-wrap gap-2">
              {[
                { id: "all", label: "All deals" },
                { id: "paid", label: "Paid" },
                { id: "commission", label: "Commission" },
                { id: "gifted", label: "Gifted" },
              ].map((t) => (
                <Chip key={t.id} active={offerType === t.id} onClick={() => setOfferType(t.id)}>
                  {t.label}
                </Chip>
              ))}
              <Chip active={payOnly} onClick={() => setPayOnly((v) => !v)}>
                Pay stated
              </Chip>
            </div>
            {platforms.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <Chip active={platform === "all"} onClick={() => setPlatform("all")}>
                  Any platform
                </Chip>
                {platforms.map((p) => (
                  <Chip key={p} active={platform === p} onClick={() => setPlatform(p)}>
                    {p}
                  </Chip>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Posted to FitBodega — shown only once a brand has actually posted.
            Owner call 2026-08-20: no empty-state block while the count is zero;
            when the first deal lands this group returns, without a CTA. */}
        {posted.length > 0 && (
          <div className="mt-12">
            <GroupLabel>Posted to FitBodega by brands</GroupLabel>
            {postedShown.length > 0 ? (
              <div>
                {postedShown.map((o, i) => (
                  <DealRow key={o.id} o={o} rank={i + 1} />
                ))}
              </div>
            ) : (
              <p className="font-sans text-sm text-on-surface-variant">
                Nothing matches those filters.
              </p>
            )}
          </div>
        )}

        {/* Open listings found elsewhere */}
        {found.length > 0 && (
          <div className={posted.length > 0 ? "mt-14" : "mt-12"}>
            {/* The group label only earns its place when there is a posted-deal
                group above it to tell apart; otherwise it just repeats the
                section line. Every card names its source either way. */}
            {posted.length > 0 && (
              <GroupLabel>Open listings we found — you apply on the source</GroupLabel>
            )}
            {foundShown.length > 0 ? (
              <div>
                {foundShown.map((o, i) => (
                  <DealRow key={o.id} o={o} rank={posted.length + i + 1} />
                ))}
              </div>
            ) : (
              <p className="font-sans text-sm text-on-surface-variant">
                Nothing matches those filters.
              </p>
            )}
            {preview && found.length > foundShown.length && (
              <Link
                href="/deals"
                className="inline-flex items-center gap-2 font-sans text-label-sm uppercase text-on-surface-variant hover:text-primary transition-colors duration-300 mt-6"
              >
                + {found.length - foundShown.length} more on the full board
                <ArrowUpRight size={14} aria-hidden />
              </Link>
            )}
          </div>
        )}
      </section>

      {/* ── Section B — spend intelligence. On the full board it carries the
          #radar anchor the homepage preview links into. ── */}
      <section id={preview ? undefined : "radar"} className="mt-24 lg:mt-32 scroll-mt-24">
        <Kicker>The Radar</Kicker>
        <h3 className="font-serif text-display-sm lg:text-display-md uppercase text-on-surface">
          Who&apos;s buying creator content right now
        </h3>
        <p className="font-sans text-base text-on-surface-variant mt-4 max-w-2xl">
          Market intelligence: these brands are actively spending on creator content. None of
          them has posted a deal to FitBodega yet. We publish these as opportunities for
          partnerships.
        </p>

        {!preview && radar.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2">
            {[
              { id: "all", label: "All brands" },
              { id: "high", label: "100+ active ads" },
              { id: "tracked", label: "Ad count tracked" },
            ].map((s) => (
              <Chip key={s.id} active={spend === s.id} onClick={() => setSpend(s.id)}>
                {s.label}
              </Chip>
            ))}
            {[
              { id: "observed", label: "Observed" },
              { id: "inferred", label: "Inferred" },
            ].map((e) => (
              <Chip
                key={e.id}
                active={evidence === e.id}
                onClick={() => setEvidence(evidence === e.id ? "all" : e.id)}
              >
                {e.label}
              </Chip>
            ))}
          </div>
        )}

        <div className="mt-12">
          {radarShown.length > 0 ? (
            radarShown.map((o, i) => <RadarRow key={o.id} o={o} rank={i + 1} />)
          ) : (
            <p className="font-sans text-sm text-on-surface-variant">
              {radar.length === 0
                ? "The first tracked brands land with this week's edition."
                : "Nothing matches those filters."}
            </p>
          )}
          {preview && radar.length > radarShown.length && (
            <Link
              href="/deals#radar"
              className="inline-flex items-center gap-2 font-sans text-label-sm uppercase text-on-surface-variant hover:text-primary transition-colors duration-300 mt-6"
            >
              + {radar.length - radarShown.length} more brands tracked
              <ArrowUpRight size={14} aria-hidden />
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
