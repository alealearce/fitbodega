// Lime hero CTAs shared by the Top 100 hub and every list page: claim your
// profile (via the /top-100/claim list finder), or get the Measure Up report
// if you're not ranked. Both open in a new tab so the reader keeps the ranking.
export default function HeroClaimLines() {
  return (
    <div className="mt-8 flex flex-wrap gap-3">
      <a
        href="/top-100/claim"
        target="_blank"
        rel="noopener"
        className="px-8 py-4 bg-primary text-primary-on font-sans text-sm font-bold tracking-wide uppercase hover:opacity-90 transition-opacity"
      >
        Claim your profile
      </a>
      <a
        href="/measure-up"
        target="_blank"
        rel="noopener"
        className="px-8 py-4 font-sans text-sm font-bold tracking-wide uppercase text-primary hover:bg-surface-input transition-colors"
        style={{ boxShadow: "inset 0 0 0 1px rgba(209,252,0,0.4)" }}
      >
        Not on the list? Get your report
      </a>
    </div>
  );
}
