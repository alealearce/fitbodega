import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import { SITE } from "@/lib/config/site";
import JoinTheRadar from "@/components/creators/JoinTheRadar";

export const metadata: Metadata = {
  title: "For Creators — Join the Deal Radar",
  description:
    "Join the Deal Radar for the weekly list of fitness brand deals, complete a profile so brands can find you, and get considered for the FitBodega 100. Free.",
  alternates: { canonical: `${SITE.url}/creators` },
};

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
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 pt-28 pb-14 lg:pt-32 lg:pb-16">
          <div className="flex items-center gap-3 mb-8">
            <span className="w-7 h-[3px] bg-primary" aria-hidden />
            <p className="font-sans text-label-md uppercase text-primary">For Creators</p>
          </div>
          <h1 className="font-serif text-display-lg uppercase tracking-tight text-on-surface max-w-4xl">
            Know who&apos;s buying. <span className="text-primary">Be easy to find</span>.
          </h1>
          <p className="font-sans text-lg text-on-surface-variant leading-relaxed max-w-xl mt-6">
            FitBodega tracks the brands paying for creator content and ranks the creators
            making it. Join the Deal Radar for the weekly list, then complete a profile so the
            brands can find you.
          </p>
          <a
            href="#join"
            className="inline-flex items-center gap-2 mt-8 px-8 py-4 bg-primary text-primary-on font-sans text-sm font-bold tracking-wide uppercase transition-opacity duration-400 hover:opacity-90"
          >
            Join the Deal Radar
            <ArrowUpRight size={16} />
          </a>
        </div>
      </section>

      {/* ── Who it's for ── */}
      <section className="py-14 lg:py-16 bg-bg">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-7 h-[3px] bg-primary" aria-hidden />
              <p className="font-sans text-label-md uppercase text-primary">Who it&apos;s for</p>
            </div>
            <p className="font-sans text-lg text-on-surface leading-relaxed">
              Fitness, training, recovery, and nutrition creators at any size, anywhere. Follower
              count matters less than audience trust — the profile fields are there so a brand
              can judge the work, not the number.
            </p>
          </div>
        </div>
      </section>

      {/* ── The one action ── */}
      <section className="py-14 lg:py-20 bg-surface-low scroll-mt-20">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-7 h-[3px] bg-primary" aria-hidden />
            <p className="font-sans text-label-md uppercase text-primary">Join</p>
          </div>
          <h2 className="font-serif text-display-md uppercase text-on-surface mb-4">
            Start with the email
          </h2>
          <p className="font-sans text-base text-on-surface-variant mb-8">
            Your address gets you the weekly Deal Radar. The profile comes straight after —
            that is the part brands see.
          </p>
          <JoinTheRadar id="join" />
        </div>
      </section>
    </>
  );
}
