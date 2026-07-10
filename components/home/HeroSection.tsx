import Link from "next/link";
import { COPY, LISTING_TYPES } from "@/lib/config/site";
import SearchBar from "@/components/directory/SearchBar";

/**
 * Hero — "The Brutalist Sanctuary"
 * Typography is the structural element: an extreme-scale display headline
 * emerging from the void, a tracked-out kicker, and the category rail
 * as sharp rectangular chips. No containers, no rounding, no borders.
 */
export default function HeroSection() {
  const lines = COPY.hero.headline.split("\n");

  return (
    <section className="relative overflow-hidden bg-bg">
      {/* Ambient lime glow — 4% tint, the only "shadow" this system allows */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 85% 10%, rgba(209,252,0,0.06) 0%, transparent 60%)",
        }}
      />

      <div className="relative w-full max-w-7xl mx-auto px-6 lg:px-8 pt-20 pb-24 lg:pt-32 lg:pb-32">
        {/* Kicker */}
        <div className="flex items-center gap-3 mb-8">
          <span className="w-7 h-[3px] bg-primary" aria-hidden />
          <p className="font-sans text-label-md uppercase text-primary">
            {COPY.hero.kicker}
          </p>
        </div>

        {/* Headline — massive, tight, editorial */}
        <h1 className="font-serif text-display-xl text-on-surface max-w-5xl">
          {lines.map((line, i) => (
            <span key={i} className="block">
              {i === lines.length - 1 ? (
                <>
                  {line.replace(/\.$/, "")}
                  <span className="text-primary">.</span>
                </>
              ) : (
                line
              )}
            </span>
          ))}
        </h1>

        {/* Subheadline */}
        <p className="font-sans text-lg text-on-surface-variant leading-relaxed max-w-xl mt-8">
          {COPY.hero.subheadline}
        </p>

        {/* Search — bare input on the void; the rail below is the only
            category wayfinding, so no duplicate filter chips or CTAs here */}
        <div className="mt-12 max-w-3xl">
          <SearchBar placeholder={COPY.searchPlaceholder} showFilters={false} />
        </div>

        {/* Category rail — sharp rectangular chips, mockup-style */}
        <div className="flex flex-wrap gap-2 mt-6 max-w-3xl">
          {LISTING_TYPES.map(t => (
            <Link
              key={t.id}
              href={`/${t.slug}`}
              className="px-4 py-2.5 bg-surface-input text-on-surface-variant font-sans text-label-sm uppercase hover:bg-primary hover:text-primary-on transition-colors duration-300"
            >
              {t.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
