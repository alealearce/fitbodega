import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import { SITE } from "@/lib/config/site";
import BrandInquiryForm from "@/components/brands/BrandInquiryForm";

export const metadata: Metadata = {
  title: "Creator Marketing for Fitness Brands",
  description:
    "FitBodega connects fitness brands with creators and runs the campaign end to end — selection, deals, paid amplification, and honest reporting. Built by a 15-year paid media operator.",
  alternates: { canonical: `${SITE.url}/for-brands` },
};

// What we do — three stages, run as one engagement.
const SERVICES = [
  {
    title: "Selection",
    body: "We shortlist creators from the FitBodega network based on audience fit and engagement quality — not follower count. You approve every name.",
  },
  {
    title: "Deal & content",
    body: "We negotiate rates and usage rights, brief the content, and make sure it's built to be amplified — not just posted.",
  },
  {
    title: "Amplification & reporting",
    body: "We run the content as paid ads through the creator's handle (whitelisting / Spark Ads), track it like any acquisition channel, and report spend and results in plain numbers.",
  },
];

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Creator Marketing for Fitness Brands",
  serviceType: "Influencer marketing",
  description:
    "Creator campaigns run like performance marketing — creator selection, deal negotiation, paid amplification, and reporting for fitness and wellness brands.",
  url: `${SITE.url}/for-brands`,
  provider: {
    "@type": "Organization",
    name: SITE.name,
    url: SITE.url,
  },
  areaServed: "Worldwide",
};

export default function ForBrandsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
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
            Creator <span className="text-primary">marketing</span>.
          </h1>
          <p className="font-sans text-lg text-on-surface-variant leading-relaxed max-w-xl mt-8">
            We find the right fitness creators, structure the deal, amplify the content with
            paid media, and report what it actually returned. One operator, end to end.
          </p>
          <a
            href="#contact"
            className="inline-flex items-center gap-2 mt-10 px-8 py-4 bg-primary text-primary-on font-sans text-sm font-bold tracking-wide uppercase transition-opacity duration-400 hover:opacity-90"
          >
            Book an intro call
            <ArrowUpRight size={16} />
          </a>
        </div>
      </section>

      {/* ── What we do — three typographic index rows on tonal cards ── */}
      <section className="py-24 lg:py-32 bg-surface-low">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-7 h-[3px] bg-primary" aria-hidden />
            <p className="font-sans text-label-md uppercase text-primary">What we do</p>
          </div>
          <h2 className="font-serif text-display-md uppercase text-on-surface">
            One operator, end to end
          </h2>
          <p className="font-sans text-base text-on-surface-variant leading-relaxed mt-5 mb-14 max-w-3xl">
            FitBodega is built by Alejandro Arce — 15 years in customer acquisition and paid
            media across Google and Meta, now focused on the fitness and recovery space.
          </p>
          <div className="grid md:grid-cols-3 gap-3">
            {SERVICES.map((s, i) => (
              <div key={s.title} className="bg-surface-card p-8 lg:p-10">
                <span className="font-sans text-label-sm text-on-surface-variant tabular-nums">
                  {String(i + 1).padStart(2, "0")} / {String(SERVICES.length).padStart(2, "0")}
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
        </div>
      </section>

      {/* ── Who it's for ── */}
      <section className="py-24 lg:py-32 bg-bg">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-7 h-[3px] bg-primary" aria-hidden />
              <p className="font-sans text-label-md uppercase text-primary">Who it&apos;s for</p>
            </div>
            <p className="font-sans text-lg text-on-surface leading-relaxed">
              Supplement and nutrition brands, recovery studios and gyms, fitness apparel and
              equipment, wellness products — anyone selling to people who train. Campaigns
              start small on purpose: a focused test with a shortlist of creators, measured
              properly, before anything scales.
            </p>
          </div>
        </div>
      </section>

      {/* ── Intro-call form ── */}
      <section id="contact" className="py-24 lg:py-32 bg-surface-low scroll-mt-20">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-7 h-[3px] bg-primary" aria-hidden />
            <p className="font-sans text-label-md uppercase text-primary">Book an intro call</p>
          </div>
          <h2 className="font-serif text-display-md uppercase text-on-surface mb-4">
            Start with a shortlist
          </h2>
          <p className="font-sans text-base text-on-surface-variant mb-12">
            Tell us what you sell and who buys it. We&apos;ll come back with a first take on
            creators worth testing — before you spend a dollar.
          </p>
          <BrandInquiryForm />
        </div>
      </section>
    </>
  );
}
