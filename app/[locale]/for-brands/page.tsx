import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import PostDealForm from "@/components/deal-radar/PostDealForm";
import { SITE } from "@/lib/config/site";
import { isNetworkOpen } from "@/lib/creators/network";

// The brand door into the marketplace: post a deal, free. The managed-
// campaigns service is deliberately in the background for now — one line at
// the bottom pointing to /about#managed-campaigns.

export const metadata: Metadata = {
  title: "Post a Brand Deal — Reach Fitness Creators",
  description:
    "Post your brand deal, UGC brief, or ambassador program on FitBodega's Deal Radar — free. Reviewed by hand, seen by fitness creators on the board and in the weekly email.",
  alternates: { canonical: `${SITE.url}/for-brands` },
};

const offerSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Post a Brand Deal for Fitness Creators",
  serviceType: "Creator marketplace listing",
  description:
    "Free listing of fitness brand deals, UGC briefs, and ambassador programs, reviewed by hand and distributed to fitness creators.",
  url: `${SITE.url}/for-brands`,
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  provider: { "@type": "Organization", name: SITE.name, url: SITE.url },
  areaServed: "Worldwide",
};

export default async function ForBrandsPage() {
  // The browse is only pitched once it holds real profiles to browse.
  const networkOpen = await isNetworkOpen();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(offerSchema) }}
      />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-bg">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 85% 10%, rgba(209,252,0,0.06) 0%, transparent 60%)",
          }}
        />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 pt-32 pb-24 lg:pt-40 lg:pb-32">
          <div className="flex items-center gap-3 mb-8">
            <span className="w-7 h-[3px] bg-primary" aria-hidden />
            <p className="font-sans text-label-md uppercase text-primary">For Brands</p>
          </div>
          <h1 className="font-serif text-display-lg uppercase tracking-tight text-on-surface max-w-4xl">
            Put your deal in front of <span className="text-primary">fitness creators</span>.
          </h1>
          <p className="font-sans text-lg text-on-surface-variant leading-relaxed max-w-xl mt-8">
            The Deal Radar is the weekly list fitness creators read for brand work — UGC
            briefs, paid collabs, ambassador programs. Post yours. Free for now.
          </p>
          <a
            href="#post"
            className="inline-flex items-center gap-2 mt-10 px-8 py-4 bg-primary text-primary-on font-sans text-sm font-bold tracking-wide uppercase transition-opacity duration-400 hover:opacity-90"
          >
            Post a deal
            <ArrowUpRight size={16} />
          </a>
          <p className="font-sans text-sm text-on-surface-variant mt-8 max-w-2xl">
            Who posts here: supplement and nutrition brands, activewear and equipment, recovery
            tech, fitness apps, healthy food and drink — anyone hiring creators who train.
          </p>
        </div>
      </section>

      {/* ── The form ── */}
      <section id="post" className="py-24 lg:py-32 bg-bg scroll-mt-20">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-7 h-[3px] bg-primary" aria-hidden />
            <p className="font-sans text-label-md uppercase text-primary">Post a deal</p>
          </div>
          <h2 className="font-serif text-display-md uppercase text-on-surface mb-4">
            The board is free
          </h2>
          <p className="font-sans text-base text-on-surface-variant mb-12">
            State the pay plainly — deals with clear compensation rank higher and get taken
            faster. We review everything by hand before it goes live.
          </p>
          <PostDealForm />
        </div>
      </section>

      {/* ── Browse the creator network — the reason to post here. Hidden until
          the browse holds real profiles (lib/creators/network.ts). ── */}
      {networkOpen && (
        <section className="py-24 lg:py-32 bg-surface-low">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="grid lg:grid-cols-[1fr_1fr] gap-10 lg:gap-20 items-start">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-7 h-[3px] bg-primary" aria-hidden />
                  <p className="font-sans text-label-md uppercase text-primary">The creator network</p>
                </div>
                <h2 className="font-serif text-display-md uppercase text-on-surface">
                  See who you&apos;re hiring
                </h2>
                <p className="font-sans text-base text-on-surface-variant mt-5 max-w-xl">
                  Creators in the network complete their own profile: niche, audience size,
                  platforms, and links to the work. Browse it before you write the brief, or after
                  you post, to see who your deal is going in front of.
                </p>
                <Link
                  href="/creators/network"
                  className="inline-flex items-center gap-2 mt-8 font-sans text-label-md uppercase text-on-surface hover:text-primary transition-colors duration-300"
                >
                  Browse the network
                  <ArrowUpRight size={16} />
                </Link>
              </div>
              <div className="bg-surface-card p-8 lg:p-10">
                <p className="font-sans text-label-sm uppercase text-on-surface-variant mb-5">
                  Why post here and not anywhere else
                </p>
                <ul className="space-y-5">
                  {[
                    "The people reading the board are fitness creators — that is the only audience this site has.",
                    "Every deal is read by a person before it goes live, so yours sits next to real offers, not spam.",
                    "The same creators are ranked in the FitBodega 100 and profiled in the Journal, so you can judge them by more than a follower count.",
                  ].map((line) => (
                    <li key={line} className="font-sans text-sm text-on-surface leading-relaxed">
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Get featured — the gym/studio/coach door, clearly secondary ── */}
      <section id="get-featured" className="py-24 lg:py-32 bg-bg scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="relative overflow-hidden bg-surface-card px-7 py-10 lg:px-14 lg:py-14">
            <span
              aria-hidden
              className="pointer-events-none select-none absolute -bottom-16 right-4 font-serif font-extrabold leading-none tracking-tighter text-[13rem] text-on-surface/[0.04]"
            >
              F
            </span>
            <div className="relative max-w-2xl">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-7 h-[3px] bg-primary" aria-hidden />
                <p className="font-sans text-label-md uppercase text-primary">
                  For gyms, studios &amp; coaches
                </p>
              </div>
              <h2 className="font-serif text-display-md uppercase text-on-surface">
                Get featured in the network
              </h2>
              <p className="font-sans text-base text-on-surface-variant mt-5">
                Not hiring creators, but want to be found? Gyms, studios, coaches, and recovery
                spaces that join the network get a reviewed listing, and stand-out spaces are
                showcased in the Journal and across FitBodega&apos;s social channels.
              </p>
              <Link
                href="/submit"
                className="inline-flex items-center gap-2 mt-9 px-8 py-4 text-on-surface font-sans text-sm font-bold tracking-wide uppercase transition-colors duration-300 hover:text-primary"
                style={{ boxShadow: "inset 0 0 0 1px rgba(72,72,71,0.3)" }}
              >
                List your space
                <ArrowUpRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Managed campaigns — deliberately in the background ── */}
      <section className="py-16 bg-surface-low">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <p className="font-sans text-sm text-on-surface-variant max-w-2xl">
            Want more than a listing? We also run a small number of managed creator
            campaigns — selection, deals, paid amplification, reporting.{" "}
            <Link href="/about#managed-campaigns" className="text-on-surface hover:text-primary underline">
              Read about it
            </Link>
            .
          </p>
        </div>
      </section>
    </>
  );
}
