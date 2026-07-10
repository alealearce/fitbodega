import Link from "next/link";
import { Mail, ArrowUpRight } from "lucide-react";
import { SITE, LISTING_TYPES } from "@/lib/config/site";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg px-6 py-24 flex items-center justify-center">
      <div className="max-w-3xl w-full">
        {/* Mark + 404 */}
        <div className="mb-14">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-7 h-[3px] bg-primary" aria-hidden />
            <p className="font-sans text-label-md uppercase text-primary">
              Lost the plot
            </p>
          </div>
          <p className="font-serif text-display-xl uppercase text-primary leading-none">
            404
          </p>
          <h1 className="font-serif text-display-sm uppercase text-on-surface mt-6 mb-4">
            This space doesn&apos;t exist
          </h1>
          <p className="font-sans text-base text-on-surface-variant leading-relaxed max-w-md">
            The page you&apos;re looking for may have moved or closed its doors.
            Try one of the hubs below.
          </p>
        </div>

        {/* Category grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-10">
          {LISTING_TYPES.map((t) => (
            <Link
              key={t.id}
              href={`/${t.slug}`}
              className="group flex flex-col gap-1 px-5 py-6 bg-surface-low hover:bg-surface-input transition-colors duration-300"
            >
              <span className="font-sans text-sm font-bold uppercase text-on-surface group-hover:text-primary transition-colors">
                {t.label}
              </span>
              <span className="font-sans text-xs text-on-surface-variant">
                Browse {t.label.toLowerCase()}
              </span>
            </Link>
          ))}
        </div>

        {/* Primary CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <Link
            href="/"
            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-4 bg-primary text-primary-on font-sans text-sm font-bold tracking-wide uppercase transition-opacity duration-400 hover:opacity-90"
          >
            Return home
          </Link>
          <Link
            href="/search"
            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-4 font-sans text-sm font-bold tracking-wide uppercase text-on-surface hover:bg-surface-low transition-colors duration-300"
            style={{ boxShadow: "inset 0 0 0 1px rgba(72,72,71,0.3)" }}
          >
            Search the directory
          </Link>
        </div>

        {/* Contact */}
        <p className="font-sans text-sm text-on-surface-variant">
          Still can&apos;t find it?{" "}
          <a
            href={`mailto:${SITE.email}?subject=Help finding a listing`}
            className="inline-flex items-center gap-1.5 text-primary font-semibold hover:underline"
          >
            <Mail size={13} />
            Email us
            <ArrowUpRight size={13} />
          </a>
          {" "}— we&apos;ll point you in the right direction.
        </p>
      </div>
    </div>
  );
}
