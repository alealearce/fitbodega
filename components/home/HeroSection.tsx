import Link from "next/link";

/**
 * Hero — "The Brutalist Sanctuary", magazine-first.
 * The marketplace statement: creators find deals, brands post them.
 * Category wayfinding lives in the Index section below, not here.
 */
export default function HeroSection() {
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
        <div className="flex items-center gap-3 mb-8">
          <span className="w-7 h-[3px] bg-primary" aria-hidden />
          <p className="font-sans text-label-md uppercase text-primary">
            The Fitness Creator Marketplace
          </p>
        </div>

        <h1 className="font-serif text-display-xl uppercase tracking-tight text-on-surface max-w-5xl">
          Where creators find <span className="text-primary">brand deals</span>.
        </h1>

        <p className="font-sans text-lg text-on-surface-variant leading-relaxed max-w-xl mt-8">
          Open collabs, UGC briefs, and ambassador programs — vetted by hand, ranked by
          signal, updated every week. Brands post free. Creators take them free.
        </p>

        <div className="flex flex-wrap items-center gap-4 mt-10">
          <Link
            href="/deals"
            className="px-8 py-4 bg-primary text-primary-on font-sans text-sm font-bold tracking-wide uppercase hover:opacity-90 transition-opacity"
          >
            Find deals
          </Link>
          <Link
            href="/for-brands"
            className="px-8 py-4 text-on-surface font-sans text-sm font-bold tracking-wide uppercase hover:text-primary transition-colors"
            style={{ boxShadow: "inset 0 0 0 1px rgba(72,72,71,0.3)" }}
          >
            Post a deal
          </Link>
        </div>
      </div>
    </section>
  );
}
