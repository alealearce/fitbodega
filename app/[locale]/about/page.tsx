import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { SITE, DEFAULT_OG_IMAGE } from "@/lib/config/site";

export const metadata: Metadata = {
  title: `About ${SITE.name} — The Fitness & Recovery Network`,
  description: `${SITE.tagline}. Learn about the mission behind ${SITE.name} — a curated directory for recovery studios, gyms, coaches, nutritionists, and health food stores, born in Vancouver.`,
  alternates: { canonical: `${SITE.url}/about` },
  openGraph: {
    title: `About ${SITE.name}`,
    description: `${SITE.tagline}. A curated directory for recovery studios, gyms, coaches, nutritionists, health food stores, and youth sports.`,
    url: `${SITE.url}/about`,
    images: [DEFAULT_OG_IMAGE],
    type: "website",
  },
};

const aboutSchema = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  name: `About ${SITE.name}`,
  url: `${SITE.url}/about`,
  description: `${SITE.tagline}. A curated directory for recovery studios, gyms, coaches, nutritionists, health food stores, and youth sports.`,
  mainEntity: {
    "@type": "Organization",
    name: SITE.name,
    url: SITE.url,
    email: SITE.email,
    logo: `${SITE.url}${SITE.logo}`,
    sameAs: [
      SITE.social.instagram,
      SITE.social.instagramSports,
    ],
  },
};

const CORE_VALUES = [
  {
    icon: "C",
    title: "Curation",
    description: "Every listing is reviewed. What makes the cut has earned its place — nothing coasts on a paid placement.",
  },
  {
    icon: "P",
    title: "Performance",
    description: "We index the spaces built for output — strength floors, recovery protocols, and coaching that moves the needle.",
  },
  {
    icon: "S",
    title: "Standards",
    description: "Sauna, cold plunge, or squat rack — the bar is the same. Real equipment, real expertise, real results.",
  },
  {
    icon: "N",
    title: "Network",
    description: "Vancouver-first, worldwide by design. The best operators deserve to be found wherever they train.",
  },
];

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutSchema) }}
      />

      {/* Hero — Mission Statement */}
      <section className="relative overflow-hidden bg-bg pt-32 pb-20 lg:pt-40 lg:pb-28">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 15% 10%, rgba(209,252,0,0.06) 0%, transparent 60%)",
          }}
        />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-8">
            <span className="w-7 h-[3px] bg-primary" aria-hidden />
            <p className="font-sans text-label-md uppercase text-primary">Our Mission</p>
          </div>
          <h1 className="font-serif text-display-xl uppercase text-on-surface max-w-5xl">
            Curated spaces<br />deserve to be<br />
            <span className="text-primary">found.</span>
          </h1>
        </div>
      </section>

      {/* Why We Exist */}
      <section className="py-20 lg:py-28 bg-surface-low">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="w-7 h-[3px] bg-primary" aria-hidden />
                <p className="font-sans text-label-md uppercase text-primary">Why We Exist</p>
              </div>
              <h2 className="font-serif text-display-sm uppercase text-on-surface">
                Vancouver has the spaces.<br />It never had the index.
              </h2>
            </div>
            <div className="space-y-4 font-sans text-base text-on-surface-variant leading-relaxed">
              <p>
                Vancouver runs on training and recovery — sauna and cold plunge circuits, strength floors, boxing gyms, sports nutritionists, and youth academies scattered across every neighbourhood. Most of it never surfaces in a search.
              </p>
              <p>
                The operators behind these spaces are experts at their craft, not at SEO. The best cold plunge in the city can sit three clicks deep behind a chain gym with a bigger ad budget.
              </p>
              <p>
                FitBodega was built to fix that — a single, curated index of the fitness and recovery network, starting in Vancouver and open to the world.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What We Do */}
      <section className="py-20 lg:py-28 bg-bg">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="mb-14 max-w-2xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-7 h-[3px] bg-primary" aria-hidden />
              <p className="font-sans text-label-md uppercase text-primary">What We Do</p>
            </div>
            <h2 className="font-serif text-display-sm uppercase text-on-surface mb-4">
              One directory, six categories
            </h2>
            <p className="font-sans text-lg text-on-surface-variant leading-relaxed">
              Recovery studios, gyms, coaches, nutritionists, health food stores, and youth sports — reviewed and indexed so the right space is one search away.
            </p>
          </div>

          <div>
            {[
              { n: "01", href: "/recovery", title: "Recovery", desc: "Sauna, cold plunge, red light, float, and contrast therapy." },
              { n: "02", href: "/gyms", title: "Gyms & Studios", desc: "Strength floors, boxing, HIIT, pilates, and conditioning." },
              { n: "03", href: "/trainers", title: "Coaches & Trainers", desc: "Elite performance coaches and specialists." },
              { n: "04", href: "/nutritionists", title: "Nutritionists", desc: "Sports dietitians and nutrition coaching." },
              { n: "05", href: "/health-food-stores", title: "Health Food Stores", desc: "Supplements, whole foods, and clean fuel." },
              { n: "06", href: "/youth-sports", title: "Youth Sports", desc: "Soccer clubs, academies, camps, and development." },
            ].map((cat) => (
              <Link
                key={cat.href}
                href={cat.href}
                className="group flex items-baseline justify-between gap-6 py-6 hover:bg-surface-low -mx-6 lg:-mx-8 px-6 lg:px-8 transition-colors duration-300"
              >
                <div className="flex items-baseline gap-6 min-w-0">
                  <span className="font-sans text-label-sm text-on-surface-variant w-8 flex-shrink-0">
                    {cat.n}
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-serif text-xl lg:text-2xl font-extrabold uppercase tracking-tight text-on-surface group-hover:text-primary transition-colors duration-300">
                      {cat.title}
                    </h3>
                    <p className="font-sans text-sm text-on-surface-variant mt-1">
                      {cat.desc}
                    </p>
                  </div>
                </div>
                <ArrowUpRight
                  size={20}
                  className="flex-shrink-0 text-outline-variant group-hover:text-primary group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300"
                />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 lg:py-28 bg-surface-low">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="mb-14">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-7 h-[3px] bg-primary" aria-hidden />
              <p className="font-sans text-label-md uppercase text-primary">What We Stand For</p>
            </div>
            <h2 className="font-serif text-display-sm uppercase text-on-surface">
              Core Values
            </h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {CORE_VALUES.map((value) => (
              <div key={value.title} className="bg-surface-card p-7">
                <span className="font-serif text-3xl font-extrabold text-primary">
                  {value.icon}
                </span>
                <h3 className="font-serif text-lg font-extrabold uppercase tracking-tight text-on-surface mt-4 mb-2">
                  {value.title}
                </h3>
                <p className="font-sans text-sm text-on-surface-variant leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Sanctuary of Performance */}
      <section className="py-20 lg:py-28 bg-bg">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="w-7 h-[3px] bg-primary" aria-hidden />
                <p className="font-sans text-label-md uppercase text-primary">The Standard</p>
              </div>
              <h2 className="font-serif text-display-sm uppercase text-on-surface mb-6">
                The sanctuary of performance.
              </h2>
              <div className="space-y-4 font-sans text-base text-on-surface-variant leading-relaxed">
                <p>
                  Every listing in the network is reviewed before it goes live. We look for real equipment, real credentials, and real results — not just a nice website.
                </p>
                <p>
                  Verified badges go to operators who prove it: certified coaches, registered dietitians, licensed facilities. Featured placements are earned through performance, not just spend.
                </p>
                <p>
                  The result is a directory people actually trust — students, athletes, and parents searching for a space that will demand as much from them as they demand from themselves.
                </p>
              </div>
            </div>
            <div className="relative w-full overflow-hidden" style={{ aspectRatio: "4/5" }}>
              <Image
                src="/images/about-header.png"
                alt={`${SITE.name} — the fitness and recovery network`}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-lime-gradient">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-24 lg:py-32 text-center">
          <h2 className="font-serif text-display-lg uppercase text-primary-on max-w-3xl mx-auto">
            Join the Network
          </h2>
          <p className="font-sans text-lg text-primary-on/80 max-w-xl mx-auto mt-6">
            Own a recovery studio, gym, or practice? Your space belongs in the curated directory.
          </p>
          <Link
            href="/submit"
            className="inline-flex items-center gap-2 mt-10 px-8 py-4 bg-bg text-on-surface font-sans text-sm font-bold tracking-wide uppercase transition-opacity duration-400 hover:opacity-90"
          >
            Submit Your Space
            <ArrowUpRight size={16} />
          </Link>
        </div>
      </section>
    </>
  );
}
