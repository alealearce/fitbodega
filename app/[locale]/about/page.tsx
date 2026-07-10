import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SITE } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "About — The Local Fitness Magazine",
  description: `${SITE.name} showcases Vancouver's fitness and recovery talent — the spaces, the coaches, and the stories behind them.`,
  alternates: { canonical: `${SITE.url}/about` },
};

/**
 * About — a manifesto, not an SEO asset.
 * FitBodega is a magazine for the city's fitness talent: the directory is
 * the index, The Journal is the stories, and the FitBodega Vancouver FC
 * sponsorship photos are the receipts.
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
            Local talent deserves
            <br />
            a bigger stage<span className="text-primary">.</span>
          </h1>
          <div className="max-w-2xl mt-10 space-y-6 font-sans text-lg text-on-surface-variant leading-relaxed">
            <p>
              Every city has them. The gym that started in a garage. The coach who
              rebuilt a hundred bodies before anyone knew their name. The sauna house
              two friends opened because nothing like it existed here yet. The run
              crew that turned Sunday mornings into a movement.
            </p>
            <p className="text-on-surface">
              {SITE.name} exists to put those people on the record — a magazine for
              fitness and recovery culture.
            </p>
            <p>
              The directory is the index. The Journal is the stories: how these
              spaces got started, how they train, what they&apos;ve learned, and where
              they&apos;re going.
            </p>
          </div>
        </div>
      </section>

      {/* ── The receipts — FitBodega Vancouver FC ── */}
      <section className="py-24 lg:py-32 bg-surface-low">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-7 h-[3px] bg-primary" aria-hidden />
            <p className="font-sans text-label-md uppercase text-primary">We&apos;ve backed local talent before</p>
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
            — a squad of Vancouver players who carried our name to The Soccer
            Tournament, training at home and competing against teams backed by
            football legends. These photos are from that run. Supporting the
            city&apos;s athletes is where this whole thing started.
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

      {/* ── How it works — two pillars, typographic ── */}
      <section className="py-24 lg:py-32 bg-bg">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16">
            <div>
              <p className="font-sans text-label-sm text-on-surface-variant mb-4">01</p>
              <h3 className="font-serif text-3xl lg:text-4xl font-extrabold uppercase tracking-tight text-on-surface">
                The Directory
              </h3>
              <p className="font-sans text-base text-on-surface-variant leading-relaxed mt-5 max-w-md">
                Recovery studios, gyms, coaches, clubs, nutritionists, health food
                stores, and youth sports.
              </p>
              <Link
                href="/recovery"
                className="inline-flex items-center gap-2 mt-7 font-sans text-label-md uppercase text-on-surface hover:text-primary transition-colors duration-300"
              >
                Explore the network
                <ArrowUpRight size={15} />
              </Link>
            </div>
            <div>
              <p className="font-sans text-label-sm text-on-surface-variant mb-4">02</p>
              <h3 className="font-serif text-3xl lg:text-4xl font-extrabold uppercase tracking-tight text-on-surface">
                The Journal
              </h3>
              <p className="font-sans text-base text-on-surface-variant leading-relaxed mt-5 max-w-md">
                The magazine. Origin stories, training philosophies, and the people
                behind the city&apos;s best spaces.
              </p>
              <Link
                href="/community"
                className="inline-flex items-center gap-2 mt-7 font-sans text-label-md uppercase text-on-surface hover:text-primary transition-colors duration-300"
              >
                Read the Journal
                <ArrowUpRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA — tell your story ── */}
      <section className="bg-lime-gradient">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-24 lg:py-32">
          <h2 className="font-serif text-display-lg uppercase text-primary-on max-w-3xl">
            Got a space?
            <br />
            Are you a coach?
          </h2>
          <p className="font-sans text-lg text-primary-on/80 max-w-xl mt-6">
            Join the network and put yourself in front of the people looking for
            it — and let us help you grow your story.
          </p>
          <Link
            href="/submit"
            className="inline-flex items-center gap-2 mt-10 px-8 py-4 bg-bg text-on-surface font-sans text-sm font-bold tracking-wide uppercase transition-opacity duration-400 hover:opacity-90"
          >
            List Your Business
            <ArrowUpRight size={16} />
          </Link>
        </div>
      </section>
    </>
  );
}
