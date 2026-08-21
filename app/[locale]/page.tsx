import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";
import { COPY, SITE } from "@/lib/config/site";
import type { BlogPost } from "@/lib/supabase/types";
import type { DrOpportunity } from "@/lib/deal-radar/types";
import { splitBoard } from "@/lib/deal-radar/board";
import type { Metadata } from "next";
import HeroSection from "@/components/home/HeroSection";
import ProofBar from "@/components/home/ProofBar";
import DealBoard from "@/components/deal-radar/DealBoard";
import AuditForm from "@/components/top100/AuditForm";
import { TOP100_LISTS } from "@/components/top100/lists";
import Top100Card from "@/components/top100/Top100Card";
import influencersList from "@/data/top-100/fitness-influencers.json";
import gymsList from "@/data/top-100/gyms.json";
import retreatsList from "@/data/top-100/retreats.json";

// Homepage order (2026-08-20 repositioning): hero → the loop → the board →
// the FitBodega 100 → the audit → creator spotlight → the Journal → get
// featured. The directory is no longer promoted here; its category pages stay
// live and indexed, reachable from the footer and the Get Featured section.

// Three featured rankings on the homepage; the /top-100 hub carries all nine.
const FEATURED_TOP100 = [
  { ...TOP100_LISTS[0], top3: influencersList.entries.slice(0, 3).map((e) => e.name) },
  { ...TOP100_LISTS[1], top3: gymsList.entries.slice(0, 3).map((e) => e.name) },
  { ...TOP100_LISTS[2], top3: retreatsList.entries.slice(0, 3).map((e) => e.name) },
];

export const metadata: Metadata = {
  title: `${SITE.name} — ${SITE.tagline}`,
  description: SITE.description,
  alternates: { canonical: SITE.url },
  openGraph: {
    url: SITE.url,
  },
};

export const revalidate = 3600;

export default async function HomePage() {
  const adminDb = createAdminClient();

  const { data: postsRes } = await adminDb
    .from("blog_posts")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(3);
  const posts: BlogPost[] = postsRes ?? [];

  // The board: brand-posted deals (week_id null) plus the latest published
  // edition. Split into "you can take this" and "this is intelligence" below.
  const { data: latestDigest } = await adminDb
    .from("dr_weekly_digests")
    .select("id")
    .eq("status", "published")
    .order("week_slug", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { data: dealRows } = await adminDb
    .from("dr_opportunities")
    .select("*")
    .eq("status", "included")
    .or(latestDigest ? `week_id.eq.${latestDigest.id},week_id.is.null` : "week_id.is.null")
    .order("score", { ascending: false });
  const board = splitBoard((dealRows ?? []) as DrOpportunity[]);

  return (
    <>
      <HeroSection />

      {/* ── The Loop — how the two sides meet, in plain words ── */}
      <section className="bg-lime-gradient">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-14 lg:py-16">
          <div className="flex items-center gap-3">
            <span className="w-7 h-[3px] bg-primary-on" aria-hidden />
            <h2 className="font-sans text-label-md uppercase text-primary-on">
              {COPY.loopSection.title}
            </h2>
          </div>
          <p className="font-sans text-lg text-primary-on/80 max-w-2xl mt-6">
            {COPY.loopSection.body}
          </p>
          <p className="font-sans text-base text-primary-on/70 max-w-2xl mt-4">
            {COPY.loopSection.intel}
          </p>
          <Link
            href="/deals"
            className="inline-flex items-center gap-2 mt-8 px-8 py-4 bg-bg text-on-surface font-sans text-sm font-bold tracking-wide uppercase transition-opacity duration-400 hover:opacity-90"
          >
            {COPY.loopSection.cta}
            <ArrowUpRight size={16} />
          </Link>
        </div>
      </section>

      {/* Numbers — hidden until they are real (lib/config/site.ts PROOF_BAR) */}
      <ProofBar />

      {/* ── The Deal Radar board — Section A, then Section B ── */}
      <section className="py-24 lg:py-32 bg-surface-low">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <DealBoard
            posted={board.posted}
            found={board.found}
            radar={board.radar}
            variant="preview"
          />
        </div>
      </section>

      {/* ── The FitBodega 100 — featured poster cards + view-all bar ── */}
      <section className="py-24 lg:py-32 bg-bg">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-14">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="w-7 h-[3px] bg-primary" aria-hidden />
                <p className="font-sans text-label-md uppercase text-primary">Ranked monthly</p>
              </div>
              <h2 className="font-serif text-display-md uppercase text-on-surface">
                The FitBodega 100
              </h2>
              <p className="font-sans text-base text-on-surface-variant mt-4 max-w-xl">
                The FitBodega 100 tracks creators and businesses on the rise, who&apos;s
                credible, and who&apos;s worth a brand&apos;s attention — updated monthly.
              </p>
            </div>
            <Link
              href="/top-100"
              className="flex-shrink-0 inline-flex items-center gap-2 font-sans text-label-md uppercase text-on-surface hover:text-primary transition-colors duration-300"
            >
              The full index
              <ArrowUpRight size={16} />
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {FEATURED_TOP100.map((f, i) => (
              <Top100Card
                key={f.slug}
                slug={f.slug}
                navLabel={f.navLabel}
                top3={f.top3}
                lime={i === 1}
                indexLabel={`${String(i + 1).padStart(2, "0")} / ${String(TOP100_LISTS.length).padStart(2, "0")}`}
              />
            ))}
          </div>

          {/* View-all bar — same watermark language, full width */}
          <Link
            href="/top-100"
            className="group relative overflow-hidden mt-3 flex items-center justify-between gap-6 bg-surface-card hover:bg-primary transition-colors duration-300 px-7 py-8 lg:px-10 lg:py-10"
          >
            <span
              aria-hidden
              className="pointer-events-none select-none absolute -top-16 right-6 font-serif font-extrabold leading-none tracking-tighter text-[11rem] text-on-surface/[0.05] group-hover:text-primary-on/10 transition-colors duration-300"
            >
              100
            </span>
            <span className="relative font-serif text-xl lg:text-3xl font-extrabold uppercase tracking-tight text-on-surface group-hover:text-primary-on transition-colors duration-300">
              View all {TOP100_LISTS.length} rankings
            </span>
            <ArrowUpRight
              size={22}
              className="relative flex-shrink-0 text-outline-variant group-hover:text-primary-on group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300"
            />
          </Link>
        </div>
      </section>

      {/* ── Measure up — the audit, creators first ── */}
      <section className="pb-24 lg:pb-32 bg-bg">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="relative overflow-hidden bg-surface-card p-8 lg:p-14">
            <span
              aria-hidden
              className="pointer-events-none select-none absolute -top-14 right-6 font-serif font-extrabold leading-none tracking-tighter text-[13rem] text-on-surface/[0.04]"
            >
              100
            </span>
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-7 h-[3px] bg-primary" aria-hidden />
                <p className="font-sans text-label-md uppercase text-primary">Are you a creator not in the top 100... yet?</p>
              </div>
              <h2 className="font-serif text-display-md uppercase text-on-surface">
                How do you measure up?
              </h2>
              <p className="font-sans text-base text-on-surface-variant mt-4 mb-12 max-w-2xl">
                A free audit of your creator presence, benchmarked against the FitBodega 100 —
                concrete improvements, each one showing how a ranked name handles it.
              </p>
              <AuditForm />
            </div>
          </div>
        </div>
      </section>

      {/* ── Creator Spotlight — profile, visibility, ranking ── */}
      <section className="bg-primary">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10 lg:py-12 grid gap-6 lg:grid-cols-[auto_1fr_auto] lg:items-center lg:gap-12">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="w-7 h-[3px] bg-primary-on" aria-hidden />
              <p className="font-sans text-label-md uppercase text-primary-on">
                {COPY.spotlightBanner.kicker}
              </p>
            </div>
            <h2 className="font-serif text-3xl lg:text-4xl font-extrabold uppercase tracking-tight text-primary-on whitespace-pre-line">
              {COPY.spotlightBanner.headline}
            </h2>
          </div>
          <p className="font-sans text-sm lg:text-base text-primary-on/80 leading-relaxed max-w-xl">
            {COPY.spotlightBanner.body}
          </p>
          <Link
            href="/creators#join"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-bg text-on-surface font-sans text-sm font-bold tracking-wide uppercase transition-opacity duration-400 hover:opacity-90 whitespace-nowrap"
          >
            {COPY.spotlightBanner.cta}
            <ArrowUpRight size={16} />
          </Link>
        </div>
      </section>

      {/* ── The Journal ── */}
      <section className="py-24 lg:py-32 bg-surface-low">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-14">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="w-7 h-[3px] bg-primary" aria-hidden />
                <p className="font-sans text-label-md uppercase text-primary">
                  {COPY.communitySection.kicker}
                </p>
              </div>
              <h2 className="font-serif text-display-md uppercase text-on-surface">
                {COPY.communitySection.title}
              </h2>
              <p className="font-sans text-base text-on-surface-variant mt-4 max-w-xl">
                {COPY.communitySection.subtitle}
              </p>
            </div>
            <Link
              href="/community"
              className="flex-shrink-0 inline-flex items-center gap-2 font-sans text-label-md uppercase text-on-surface hover:text-primary transition-colors duration-300"
            >
              {COPY.communitySection.cta}
              <ArrowUpRight size={15} />
            </Link>
          </div>

          {posts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {posts.map(post => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Get featured — the business door, a benefit pitch not a browse ── */}
      <section className="py-24 lg:py-32 bg-bg">
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
                  {COPY.getFeaturedSection.kicker}
                </p>
              </div>
              <h2 className="font-serif text-display-md uppercase text-on-surface">
                {COPY.getFeaturedSection.title}
              </h2>
              <p className="font-sans text-base text-on-surface-variant mt-5">
                {COPY.getFeaturedSection.body}
              </p>
              <div className="flex flex-wrap items-center gap-4 mt-9">
                <Link
                  href="/submit"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-on font-sans text-sm font-bold tracking-wide uppercase transition-opacity duration-400 hover:opacity-90"
                >
                  {COPY.getFeaturedSection.cta}
                  <ArrowUpRight size={16} />
                </Link>
                <Link
                  href="/directory"
                  className="inline-flex items-center gap-2 px-8 py-4 text-on-surface font-sans text-sm font-bold tracking-wide uppercase transition-colors duration-300 hover:text-primary"
                  style={{ boxShadow: "inset 0 0 0 1px rgba(72,72,71,0.3)" }}
                >
                  See the directory
                  <ArrowUpRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

// ── Blog Card — image-led, open layout, no container chrome ─────────────────

function BlogCard({ post }: { post: BlogPost }) {
  return (
    <Link href={`/${post.slug}`} className="group block">
      {/* Cover */}
      <div className="relative aspect-[16/10] bg-surface-card overflow-hidden">
        {post.cover_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.cover_image}
            alt={post.title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-[800ms]"
          />
        ) : (
          <div className="w-full h-full flex items-end p-5">
            <span className="font-serif text-6xl font-extrabold text-surface-bright select-none">
              {post.title.charAt(0)}
            </span>
          </div>
        )}
      </div>

      {/* Content — open, no box */}
      <div className="pt-5">
        <p className="font-sans text-label-sm uppercase text-on-surface-variant mb-3">
          Journal
          {post.reading_time_minutes && (
            <span className="text-outline-variant"> / {post.reading_time_minutes} min</span>
          )}
        </p>
        <h3 className="font-serif text-xl font-extrabold tracking-tight text-on-surface group-hover:text-primary transition-colors duration-300 leading-snug">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="font-sans text-sm text-on-surface-variant leading-relaxed line-clamp-2 mt-3">
            {post.excerpt}
          </p>
        )}
      </div>
    </Link>
  );
}
