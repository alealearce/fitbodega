import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import { SITE } from "@/lib/config/site";
import CreatorApplicationForm from "@/components/creators/CreatorApplicationForm";

export const metadata: Metadata = {
  title: "Join the Creator Network",
  description:
    "The network for fitness creators: FitBodega 100 rankings, Journal profiles, and first look at brand deals. Apply to join.",
  alternates: { canonical: `${SITE.url}/creators` },
};

// What you get — the three doors the network opens.
const BENEFITS = [
  {
    title: "Ranking",
    body: "Every creator in the network is considered for the FitBodega 100 — monthly rankings that brands and the community keep an eye on.",
  },
  {
    title: "The Journal",
    body: "We profile creators in the network: your story, your training, your work.",
  },
  {
    title: "Deals",
    body: "When brand campaigns come through FitBodega, network creators get first consideration.",
  },
];

export default function CreatorsPage() {
  return (
    <>
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
            <p className="font-sans text-label-md uppercase text-primary">For Creators</p>
          </div>
          <h1 className="font-serif text-display-lg uppercase tracking-tight text-on-surface max-w-4xl">
            Get ranked. Get featured.{" "}
            <span className="text-primary">Get first look at deals</span>.
          </h1>
          <p className="font-sans text-lg text-on-surface-variant leading-relaxed max-w-xl mt-8">
            FitBodega is the network for fitness creators — the FitBodega 100 rankings,
            profiles in the Journal, and brand campaigns routed to creators in the network
            first.
          </p>
          <a
            href="#apply"
            className="inline-flex items-center gap-2 mt-10 px-8 py-4 bg-primary text-primary-on font-sans text-sm font-bold tracking-wide uppercase transition-opacity duration-400 hover:opacity-90"
          >
            Apply to join
            <ArrowUpRight size={16} />
          </a>
        </div>
      </section>

      {/* ── What you get — three typographic index rows on tonal cards ── */}
      <section className="py-24 lg:py-32 bg-surface-low">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-14">
            <span className="w-7 h-[3px] bg-primary" aria-hidden />
            <p className="font-sans text-label-md uppercase text-primary">What you get</p>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            {BENEFITS.map((b, i) => (
              <div key={b.title} className="bg-surface-card p-8 lg:p-10">
                <span className="font-sans text-label-sm text-on-surface-variant tabular-nums">
                  {String(i + 1).padStart(2, "0")} / {String(BENEFITS.length).padStart(2, "0")}
                </span>
                <h3 className="font-serif text-2xl font-extrabold uppercase tracking-tight text-on-surface mt-5">
                  {b.title}
                </h3>
                <p className="font-sans text-sm text-on-surface-variant leading-relaxed mt-4">
                  {b.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Who we're looking for ── */}
      <section className="py-24 lg:py-32 bg-bg">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-7 h-[3px] bg-primary" aria-hidden />
              <p className="font-sans text-label-md uppercase text-primary">
                Who we&apos;re looking for
              </p>
            </div>
            <p className="font-sans text-lg text-on-surface leading-relaxed">
              Fitness, training, recovery, and nutrition creators — from 5K to 500K followers
              — who make genuine content and want brand work that doesn&apos;t compromise it.
              Follower count matters less than audience trust.
            </p>
          </div>
        </div>
      </section>

      {/* ── Application form ── */}
      <section id="apply" className="py-24 lg:py-32 bg-surface-low scroll-mt-20">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-7 h-[3px] bg-primary" aria-hidden />
            <p className="font-sans text-label-md uppercase text-primary">Apply</p>
          </div>
          <h2 className="font-serif text-display-md uppercase text-on-surface mb-4">
            Join the network
          </h2>
          <p className="font-sans text-base text-on-surface-variant mb-12">
            We review every application. If it&apos;s a fit, you&apos;ll hear from us with
            next steps.
          </p>
          <CreatorApplicationForm />
        </div>
      </section>
    </>
  );
}
