import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SITE } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "About — The Fitness Creator Network",
  description: `${SITE.name} is a professional marketing team with a passion for fitness — connecting training culture with its creators through rankings, stories, and campaigns backed by 15 years in paid media.`,
  alternates: { canonical: `${SITE.url}/about` },
};

/**
 * About — a manifesto, not an SEO asset.
 * FitBodega is a marketing team for training culture: the 100 is the
 * ranking, The Journal is the stories, and the FitBodega Vancouver FC
 * sponsorship photos are the receipts — we've sponsored fitness before.
 */
export default function AboutPage() {
  return (
    <>
      {/* ── Manifesto ── */}
      <section className="pt-32 pb-20 lg:pt-44 lg:pb-28 bg-bg relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 90% 0%, rgba(209,252,0,0.05) 0%, transparent 60%)",
          }}
        />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-8">
            <span className="w-7 h-[3px] bg-primary" aria-hidden />
            <p className="font-sans text-label-md uppercase text-primary">The Story</p>
          </div>
          <h1 className="font-serif text-display-xl uppercase text-on-surface max-w-5xl">
            Connecting training culture
            <br />
            with <span className="text-primary">its creators</span>.
          </h1>
          <div className="max-w-2xl mt-10 space-y-6 font-sans text-lg text-on-surface-variant leading-relaxed">
            <p>
              {SITE.name} is a marketing team — professional, experienced, and
              obsessed with fitness. Fifteen years in customer acquisition and
              paid media across Google and Meta, now pointed at the world we
              train in.
            </p>
            <p>
              We rank the creators shaping training culture, tell their stories
              in the Journal, and connect them with the brands that fuel it.
            </p>
            <p className="text-on-surface">
              {SITE.name} is the fitness creator network.
            </p>
          </div>
        </div>
      </section>

      {/* ── The receipts — FitBodega Vancouver FC ── */}
      <section className="py-24 lg:py-32 bg-surface-low">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-7 h-[3px] bg-primary" aria-hidden />
            <p className="font-sans text-label-md uppercase text-primary">We&apos;ve sponsored fitness before</p>
          </div>
          <p className="font-sans text-lg text-on-surface-variant leading-relaxed max-w-2xl mt-6">
            In 2024 we sponsored{" "}
            <a
              href="https://www.instagram.com/fitbodegavancouverfc/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-on-surface underline underline-offset-4 decoration-primary hover:text-primary transition-colors duration-300"
            >
              FitBodega Vancouver FC
            </a>{" "}
            — kits, content, and a squad of Vancouver players who carried our
            name to The Soccer Tournament, competing against teams backed by
            football legends.
          </p>

          {/* Editorial photo composition — asymmetric, sharp, full-bleed */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mt-14">
            {/* Tall hero — green kit */}
            <div className="row-span-2 relative overflow-hidden bg-surface-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/about/match.jpg"
                alt="FitBodega Vancouver FC player in the green FitBodega Supplements kit at The Soccer Tournament"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <a
              href="https://www.instagram.com/fitbodegavancouverfc/reel/C8AdxSnu9Ce/"
              target="_blank"
              rel="noopener noreferrer"
              className="relative overflow-hidden bg-surface-card aspect-[4/3] block group"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/about/fc-reel-1.jpg"
                alt="FitBodega Vancouver FC player in the white FitBodega Supplements away kit — watch the reel"
                className="w-full h-full object-cover object-[center_42%] group-hover:scale-[1.03] transition-transform duration-[600ms]"
                loading="lazy"
              />
            </a>
            <a
              href="https://www.instagram.com/fitbodegavancouverfc/reel/C8NUrJ8yyoG/"
              target="_blank"
              rel="noopener noreferrer"
              className="relative overflow-hidden bg-surface-card aspect-[4/3] block group"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/about/fc-reel-3.jpg"
                alt="FitBodega Vancouver FC player in the green kit on the pitch at TST — watch the reel"
                className="w-full h-full object-cover object-[center_35%] group-hover:scale-[1.03] transition-transform duration-[600ms]"
                loading="lazy"
              />
            </a>
            <a
              href="https://www.instagram.com/fitbodegavancouverfc/reel/C8SIt1kputd/"
              target="_blank"
              rel="noopener noreferrer"
              className="relative overflow-hidden bg-surface-card aspect-[4/3] block group"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/about/fc-reel-4.jpg"
                alt="FitBodega Vancouver FC squad and staff between games at TST — watch the reel"
                className="w-full h-full object-cover object-[center_60%] group-hover:scale-[1.03] transition-transform duration-[600ms]"
                loading="lazy"
              />
            </a>
            <a
              href="https://www.instagram.com/fitbodegavancouverfc/reel/C79AQ1yuPZw/"
              target="_blank"
              rel="noopener noreferrer"
              className="relative overflow-hidden bg-surface-card aspect-[4/3] block group"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/about/fc-reel-2.jpg"
                alt="FitBodega Vancouver FC night match action at TST 7v7 — watch the reel"
                className="w-full h-full object-cover object-[center_60%] group-hover:scale-[1.03] transition-transform duration-[600ms]"
                loading="lazy"
              />
            </a>
          </div>
          <p className="font-sans text-label-sm uppercase text-on-surface-variant mt-5">
            FitBodega Vancouver FC / The Soccer Tournament, 2024
          </p>
        </div>
      </section>

      {/* ── How it works — three pillars, typographic ── */}
      <section className="py-24 lg:py-32 bg-bg">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-16">
            <div>
              <p className="font-sans text-label-sm text-on-surface-variant mb-4">01</p>
              <h3 className="font-serif text-3xl lg:text-4xl font-extrabold uppercase tracking-tight text-on-surface">
                The FitBodega 100
              </h3>
              <p className="font-sans text-base text-on-surface-variant leading-relaxed mt-5 max-w-md">
                The ranking. Who&apos;s rising, who&apos;s credible, and who&apos;s
                worth a brand&apos;s attention — reviewed monthly.
              </p>
              <Link
                href="/top-100"
                className="inline-flex items-center gap-2 mt-7 font-sans text-label-md uppercase text-on-surface hover:text-primary transition-colors duration-300"
              >
                See the rankings
                <ArrowUpRight size={15} />
              </Link>
            </div>
            <div>
              <p className="font-sans text-label-sm text-on-surface-variant mb-4">02</p>
              <h3 className="font-serif text-3xl lg:text-4xl font-extrabold uppercase tracking-tight text-on-surface">
                The Journal
              </h3>
              <p className="font-sans text-base text-on-surface-variant leading-relaxed mt-5 max-w-md">
                The stories. Creators, coaches, and the industry shaping training
                culture — and what&apos;s next.
              </p>
              <Link
                href="/community"
                className="inline-flex items-center gap-2 mt-7 font-sans text-label-md uppercase text-on-surface hover:text-primary transition-colors duration-300"
              >
                Read the Journal
                <ArrowUpRight size={15} />
              </Link>
            </div>
            <div>
              <p className="font-sans text-label-sm text-on-surface-variant mb-4">03</p>
              <h3 className="font-serif text-3xl lg:text-4xl font-extrabold uppercase tracking-tight text-on-surface">
                The Directory
              </h3>
              <p className="font-sans text-base text-on-surface-variant leading-relaxed mt-5 max-w-md">
                The world they train in. Recovery studios, gyms, coaches, clubs,
                nutritionists, stores, and youth sports.
              </p>
              <Link
                href="/directory"
                className="inline-flex items-center gap-2 mt-7 font-sans text-label-md uppercase text-on-surface hover:text-primary transition-colors duration-300"
              >
                Explore the network
                <ArrowUpRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Managed campaigns — deliberately in the background for now ── */}
      <section id="managed-campaigns" className="py-24 lg:py-32 bg-surface-low scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-7 h-[3px] bg-primary" aria-hidden />
              <p className="font-sans text-label-md uppercase text-primary">Managed campaigns</p>
            </div>
            <h2 className="font-serif text-display-sm uppercase text-on-surface">
              When a listing is not enough
            </h2>
            <p className="font-sans text-base text-on-surface-variant leading-relaxed mt-5">
              The marketplace is self-serve and free. For brands that want the work done,
              we also run a small number of managed creator campaigns — creator selection
              from the network, deal negotiation, paid amplification of the content, and
              reporting in plain numbers. Built and run by a 15-year customer-acquisition
              operator. Write to{" "}
              <a href={`mailto:${SITE.supportEmail}`} className="text-on-surface hover:text-primary underline">
                {SITE.supportEmail}
              </a>{" "}
              with what you sell and who buys it.
            </p>
          </div>
        </div>
      </section>

      {/* ── CTA — two doors ── */}
      <section className="bg-lime-gradient">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-24 lg:py-32">
          <h2 className="font-serif text-display-lg uppercase text-primary-on max-w-3xl">
            Building a brand?
            <br />
            Creating fitness content?
          </h2>
          <p className="font-sans text-lg text-primary-on/80 max-w-xl mt-6">
            Brands get creator campaigns run like media buys. Creators get
            ranked, featured, and first look at deals.
          </p>
          <div className="flex flex-wrap items-center gap-4 mt-10">
            <Link
              href="/for-brands"
              className="inline-flex items-center gap-2 px-8 py-4 bg-bg text-on-surface font-sans text-sm font-bold tracking-wide uppercase transition-opacity duration-400 hover:opacity-90"
            >
              For Brands
              <ArrowUpRight size={16} />
            </Link>
            <Link
              href="/creators"
              className="inline-flex items-center gap-2 px-8 py-4 text-primary-on font-sans text-sm font-bold tracking-wide uppercase transition-opacity duration-400 hover:opacity-80"
              style={{ boxShadow: "inset 0 0 0 1px rgba(22,25,0,0.4)" }}
            >
              For Creators
              <ArrowUpRight size={16} />
            </Link>
          </div>
          <Link
            href="/submit"
            className="mt-8 inline-flex items-center gap-2 font-sans text-label-md uppercase text-primary-on/70 hover:text-primary-on transition-colors duration-300"
          >
            Own a gym or studio? List your space
            <ArrowUpRight size={14} />
          </Link>
        </div>
      </section>
    </>
  );
}
