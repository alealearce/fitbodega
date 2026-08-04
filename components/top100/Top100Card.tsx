import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

// Poster card for a FitBodega 100 list — giant cropped "100" watermark,
// full "Top 100 ..." title, optional top-3 teaser. Lime cards are permanently
// inverted; dark cards invert to lime on hover. Used by the /top-100 hub and
// the homepage strip so the series reads identically everywhere.
export default function Top100Card({
  slug,
  navLabel,
  top3,
  lime,
  indexLabel,
  minH = "min-h-[260px] lg:min-h-[300px]",
}: {
  slug: string;
  navLabel: string;
  top3?: readonly string[];
  lime?: boolean;
  indexLabel?: string;
  minH?: string;
}) {
  return (
    <Link
      href={slug}
      className={`group relative overflow-hidden flex flex-col justify-between ${minH} p-7 transition-colors duration-300 ${
        lime ? "bg-primary hover:opacity-95" : "bg-surface-card hover:bg-primary"
      }`}
    >
      {/* Watermark numeral */}
      <span
        aria-hidden
        className={`pointer-events-none select-none absolute -bottom-10 -right-4 font-serif font-extrabold leading-none tracking-tighter text-[11rem] lg:text-[13rem] transition-colors duration-300 ${
          lime
            ? "text-primary-on/10"
            : "text-on-surface/[0.05] group-hover:text-primary-on/10"
        }`}
      >
        100
      </span>

      <div className="relative flex items-start justify-between">
        <span
          className={`font-sans text-label-sm tabular-nums transition-colors duration-300 ${
            lime
              ? "text-primary-on/70"
              : "text-on-surface-variant group-hover:text-primary-on/70"
          }`}
        >
          {indexLabel ?? "The FitBodega 100"}
        </span>
        <ArrowUpRight
          size={20}
          className={`flex-shrink-0 transition-all duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 ${
            lime ? "text-primary-on" : "text-outline-variant group-hover:text-primary-on"
          }`}
        />
      </div>

      <div className="relative pt-10">
        <h3
          className={`font-serif text-2xl lg:text-3xl font-extrabold uppercase tracking-tight leading-[1.05] transition-colors duration-300 ${
            lime ? "text-primary-on" : "text-on-surface group-hover:text-primary-on"
          }`}
        >
          Top 100 {navLabel}
        </h3>
        {top3 && top3.length > 2 && (
          <p
            className={`font-sans text-xs mt-3 leading-relaxed transition-colors duration-300 ${
              lime
                ? "text-primary-on/70"
                : "text-on-surface-variant group-hover:text-primary-on/70"
            }`}
          >
            1 {top3[0]} · 2 {top3[1]} · 3 {top3[2]}
          </p>
        )}
      </div>
    </Link>
  );
}
