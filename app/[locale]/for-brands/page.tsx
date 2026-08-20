import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import PostDealForm from "@/components/deal-radar/PostDealForm";
import { SITE } from "@/lib/config/site";

// The brand door into the marketplace: post a deal, free. The managed-
// campaigns service is deliberately in the background for now — one line at
// the bottom pointing to /about#managed-campaigns.

export const metadata: Metadata = {
  title: "Post a Brand Deal — Reach Fitness Creators",
  description:
    "Post your brand deal, UGC brief, or ambassador program on FitBodega's Deal Radar — free. Reviewed by hand, seen by fitness creators on the board and in the weekly email.",
  alternates: { canonical: `${SITE.url}/for-brands` },
};

const STEPS = [
  {
    title: "Post the deal",
    body: "Pay, deliverables, platforms, where to apply. Two minutes, free.",
  },
  {
    title: "We review it",
    body: "Every deal on the board is checked by hand — real brand, real offer, pay stated up front. Usually within one business day.",
  },
  {
    title: "Creators find you",
    body: "Your deal goes on the board at /deals, ranked with everything else we track, and out in the weekly Deal Radar email to subscribed creators.",
  },
];

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

export default function ForBrandsPage() {
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
            The Deal Radar is where fitness creators look for their next brand deal — UGC
            briefs, paid collabs, ambassador programs. Post yours. Free for now.
          </p>
          <a
            href="#post"
            className="inline-flex items-center gap-2 mt-10 px-8 py-4 bg-primary text-primary-on font-sans text-sm font-bold tracking-wide uppercase transition-opacity duration-400 hover:opacity-90"
          >
            Post a deal
            <ArrowUpRight size={16} />
          </a>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-24 lg:py-32 bg-surface-low">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-7 h-[3px] bg-primary" aria-hidden />
            <p className="font-sans text-label-md uppercase text-primary">How it works</p>
          </div>
          <h2 className="font-serif text-display-md uppercase text-on-surface">
            Post it. We vet it. Creators take it.
          </h2>
          <div className="grid md:grid-cols-3 gap-3 mt-14">
            {STEPS.map((s, i) => (
              <div key={s.title} className="bg-surface-card p-8 lg:p-10">
                <span className="font-sans text-label-sm text-on-surface-variant tabular-nums">
                  {String(i + 1).padStart(2, "0")} / {String(STEPS.length).padStart(2, "0")}
                </span>
                <h3 className="font-serif text-2xl font-extrabold uppercase tracking-tight text-on-surface mt-5">
                  {s.title}
                </h3>
                <p className="font-sans text-sm text-on-surface-variant leading-relaxed mt-4">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
          <p className="font-sans text-sm text-on-surface-variant mt-10 max-w-2xl">
            Who posts here: supplement and nutrition brands, activewear and equipment,
            recovery tech, fitness apps, healthy food and drink — anyone hiring creators who
            train.
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
