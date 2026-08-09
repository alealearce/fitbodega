import type { DrOpportunity, DrWeeklyDigest } from "@/lib/deal-radar/types";

// Renders one Deal Radar edition (intro + Open Collabs + Spending Now).
// Server-safe and purely presentational; used by the /deals showcase, the
// /deals/[slug] permalink, and the admin preview.

interface Props {
  digest: DrWeeklyDigest;
  opportunities: DrOpportunity[];
}

function OpportunityRow({ o }: { o: DrOpportunity }) {
  const evidence = o.meta?.evidence as string | undefined;
  const evidenceNote = o.meta?.evidenceNote as string | undefined;
  const pitchAngle = o.meta?.pitchAngle as string | undefined;

  return (
    <div className="mb-8">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <p className="font-serif text-2xl font-extrabold uppercase tracking-tight text-on-surface">
          {o.brand_name}
        </p>
        {o.compensation_text && (
          <p className="font-sans text-sm text-primary">{o.compensation_text}</p>
        )}
        {o.active_ad_count !== null && (
          <p className="font-sans text-label-sm uppercase text-on-surface-variant">
            {o.active_ad_count} active ads
          </p>
        )}
        {evidence && (
          <p className="font-sans text-label-sm uppercase text-on-surface-variant">{evidence}</p>
        )}
      </div>
      {o.deliverables && (
        <p className="font-sans text-base text-on-surface-variant mt-2">{o.deliverables}</p>
      )}
      {evidenceNote && (
        <p className="font-sans text-base text-on-surface-variant mt-2">{evidenceNote}</p>
      )}
      {pitchAngle && (
        <p className="font-sans text-base text-on-surface mt-2">
          <span className="text-primary">The pitch:</span> {pitchAngle}
        </p>
      )}
      {o.platforms.length > 0 && (
        <p className="font-sans text-label-sm uppercase text-on-surface-variant mt-2">
          {o.platforms.join(" · ")}
        </p>
      )}
      {o.source_url && (
        <a
          href={o.source_url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="font-sans text-sm text-on-surface-variant hover:text-primary mt-2 inline-block break-all"
        >
          {o.source_type === "listed_deal" ? "Apply / view listing" : "View evidence"}
        </a>
      )}
    </div>
  );
}

export default function DigestContent({ digest, opportunities }: Props) {
  const collabs = opportunities.filter((o) => o.source_type === "listed_deal");
  const signals = opportunities.filter((o) => o.source_type === "spend_signal");

  return (
    <div>
      {digest.intro_copy && (
        <p className="font-sans text-lg text-on-surface leading-relaxed whitespace-pre-line mb-14 max-w-2xl">
          {digest.intro_copy}
        </p>
      )}

      {collabs.length > 0 && (
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <span className="w-7 h-[3px] bg-primary" aria-hidden />
            <h2 className="font-sans text-label-md uppercase text-primary">
              Open collabs — apply now
            </h2>
          </div>
          {collabs.map((o) => <OpportunityRow key={o.id} o={o} />)}
        </section>
      )}

      {signals.length > 0 && (
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <span className="w-7 h-[3px] bg-primary" aria-hidden />
            <h2 className="font-sans text-label-md uppercase text-primary">
              Spending now — pitch them
            </h2>
          </div>
          {signals.map((o) => <OpportunityRow key={o.id} o={o} />)}
        </section>
      )}
    </div>
  );
}
