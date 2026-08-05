import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

// Lead-gen bar for the audit engine — same watermark language as the
// poster cards. Rendered on the hub and (via SeriesLinks) on every list.
export default function MeasureUpCta() {
  return (
    <Link
      href="/measure-up"
      className="group relative overflow-hidden flex items-center justify-between gap-6 bg-surface-card hover:bg-primary transition-colors duration-300 px-7 py-8 lg:px-10 lg:py-10"
    >
      <span
        aria-hidden
        className="pointer-events-none select-none absolute -top-16 right-6 font-serif font-extrabold leading-none tracking-tighter text-[11rem] text-on-surface/[0.05] group-hover:text-primary-on/10 transition-colors duration-300"
      >
        100
      </span>
      <span className="relative min-w-0">
        <span className="block font-serif text-xl lg:text-3xl font-extrabold uppercase tracking-tight text-on-surface group-hover:text-primary-on transition-colors duration-300">
          How do you measure up?
        </span>
        <span className="block font-sans text-sm text-on-surface-variant group-hover:text-primary-on/70 mt-2 transition-colors duration-300">
          Free audit of your presence, benchmarked against the 100 — sent to your inbox.
        </span>
      </span>
      <ArrowUpRight
        size={22}
        className="relative flex-shrink-0 text-outline-variant group-hover:text-primary-on group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300"
      />
    </Link>
  );
}
