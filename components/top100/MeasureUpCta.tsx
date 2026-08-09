import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

// Lead-gen bar for the audit engine — same watermark language as the
// poster cards. Rendered on the hub and (via SeriesLinks) on every list.
export default function MeasureUpCta() {
  return (
    <Link
      href="/measure-up"
      className="group relative overflow-hidden flex items-center justify-between gap-6 bg-primary hover:bg-surface-card transition-colors duration-300 px-7 py-8 lg:px-10 lg:py-10"
    >
      <span
        aria-hidden
        className="pointer-events-none select-none absolute -top-16 right-6 font-serif font-extrabold leading-none tracking-tighter text-[11rem] text-primary-on/10 group-hover:text-on-surface/[0.05] transition-colors duration-300"
      >
        100
      </span>
      <span className="relative min-w-0">
        <span className="block font-serif text-xl lg:text-3xl font-extrabold uppercase tracking-tight text-primary-on group-hover:text-on-surface transition-colors duration-300">
          How do you measure up?
        </span>
        <span className="block font-sans text-sm text-primary-on/70 group-hover:text-on-surface-variant mt-2 transition-colors duration-300">
          Free audit of your presence, benchmarked against the 100 — sent to your inbox.
        </span>
      </span>
      <ArrowUpRight
        size={22}
        className="relative flex-shrink-0 text-primary-on group-hover:text-on-surface group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300"
      />
    </Link>
  );
}
