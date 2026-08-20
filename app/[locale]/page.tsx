import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { COPY, SITE } from "@/lib/config/site";
import type { Listing, BlogPost } from "@/lib/supabase/types";
import type { DrOpportunity } from "@/lib/deal-radar/types";
import type { Metadata } from "next";
import HeroSection from "@/components/home/HeroSection";
import AuditForm from "@/components/top100/AuditForm";
import ListingCard from "@/components/directory/ListingCard";
import { TOP100_LISTS } from "@/components/top100/lists";
import Top100Card from "@/components/top100/Top100Card";
import influencersList from "@/data/top-100/fitness-influencers.json";
import gymsList from "@/data/top-100/gyms.json";
import retreatsList from "@/data/top-100/retreats.json";

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

// Canonical category hubs — the homepage (highest-authority page) links every
// hub directly, distributing link equity across all six.
const CATEGORIES = [
  { name: "Recovery",           href: "/recovery",           desc: "Sauna, cold plunge, red light, float, and contrast therapy." },
  { name: "Gyms & Studios",     href: "/gyms",               desc: "Strength floors, boxing, HIIT, pilates, and conditioning." },
  { name: "Coaches & Trainers", href: "/trainers",           desc: "Elite performance coaches and specialists." },
  { name: "Clubs",              href: "/clubs",              desc: "Run crews, ride groups, swim clubs, and social fitness collectives." },
  { name: "Nutritionists",      href: "/nutritionists",      desc: "Sports dietitians and nutrition coaching." },
  { name: "Health Food Stores", href: "/health-food-stores", desc: "Supplements, whole foods, and clean fuel." },
  { name: "Youth Sports",       href: "/youth-sports",       desc: "Soccer clubs, academies, camps, and development." },
];

export default async function HomePage() {
  const supabase = await createClient();

  const [listingsRes, postsRes] = await Promise.all([
    supabase
      .from("listings")
      .select("*")
      .eq("status", "approved")
      .eq("is_featured", true)
      .order("rating_avg", { ascending: false })
      .limit(6),
    supabase
      .from("blog_posts")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(3),
  ]);

  const listings: Listing[] = listingsRes.data ?? [];
  const posts: BlogPost[]   = postsRes.data ?? [];

  // Top of the deal board: the latest published edition's deals plus
  // brand-posted board deals (week_id null), best score first.
  const adminDb = createAdminClient();
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
    .order("score", { ascending: false })
    .limit(5);
  const deals = (dealRows ?? []) as DrOpportunity[];

  return (
    <>
      <HeroSection />

      {/* ── The Deal Radar — the marketplace board, top five this week ── */}
      <section className="py-24 lg:py-32 bg-surface-low">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-14">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="w-7 h-[3px] bg-primary" aria-hidden />
                <p className="font-sans text-label-md uppercase text-primary">The Deal Radar</p>
              </div>
              <h2 className="font-serif text-display-md uppercase text-on-surface">
                Deals on the board
              </h2>
              <p className="font-sans text-base text-on-surface-variant mt-4 max-w-xl">
                Open collabs and spend signals, vetted by hand and ranked by signal strength.
                Updated every Monday, plus brand-posted deals as they clear review.
              </p>
            </div>
            <Link
              href="/deals"
              className="flex-shrink-0 inline-flex items-center gap-2 font-sans text-label-md uppercase text-on-surface hover:text-primary transition-colors duration-300"
            >
              The full board
              <ArrowUpRight size={16} />
            </Link>
          </div>

          {deals.length > 0 && (
            <div className="mb-12">
              {deals.map((deal, i) => (
                <DealRow key={deal.id} deal={deal} index={i} />
              ))}
            </div>
          )}

          {/* Brand door — post a deal, free */}
          <div className="relative overflow-hidden bg-surface-card px-7 py-8 lg:px-10 lg:py-10 flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-12">
            <span
              aria-hidden
              className="pointer-events-none select-none absolute -top-10 right-6 font-serif font-extrabold leading-none tracking-tighter text-[9rem] text-on-surface/[0.04]"
            >
              FREE
            </span>
            <div className="relative flex-1">
              <p className="font-sans text-label-sm uppercase text-primary mb-2">
                {COPY.brandsSection.kicker}
              </p>
              <p className="font-serif text-2xl lg:text-3xl font-extrabold uppercase tracking-tight text-on-surface">
                {COPY.brandsSection.title}
              </p>
              <p className="font-sans text-sm text-on-surface-variant mt-3 max-w-2xl">
                {COPY.brandsSection.body}
              </p>
            </div>
            <Link
              href="/for-brands"
              className="relative inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-on font-sans text-sm font-bold tracking-wide uppercase transition-opacity duration-400 hover:opacity-90 whitespace-nowrap self-start lg:self-auto"
            >
              {COPY.brandsSection.cta}
              <ArrowUpRight size={16} />
            </Link>
          </div>
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
                We rank creators for a living. The FitBodega 100 tracks who&apos;s rising,
                who&apos;s credible, and who&apos;s worth a brand&apos;s attention — updated
                monthly.
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

      {/* ── Measure up — the audit tool, full form in a box ── */}
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
                <p className="font-sans text-label-md uppercase text-primary">Not in the top 100... yet?</p>
              </div>
              <h2 className="font-serif text-display-md uppercase text-on-surface">
                How do you measure up?
              </h2>
              <p className="font-sans text-base text-on-surface-variant mt-4 mb-12 max-w-2xl">
                Free audit of your presence, benchmarked against the FitBodega 100 — concrete
                improvements, each one showing how a name from the rankings handles it.
              </p>
              <AuditForm />
            </div>
          </div>
        </div>
      </section>

      {/* ── Creator Spotlight banner — join the network, get featured ── */}
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
            href="/creators"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-bg text-on-surface font-sans text-sm font-bold tracking-wide uppercase transition-opacity duration-400 hover:opacity-90 whitespace-nowrap"
          >
            {COPY.spotlightBanner.cta}
            <ArrowUpRight size={16} />
          </Link>
        </div>
      </section>

      {/* ── The Journal — Bodega Labs ── */}
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

      {/* ── The Index — asymmetric split: sticky intro left, typographic
          rows right. Hovering a row slides in a giant ghost category word,
          echoing the FitBodega 100 watermark language. ── */}
      <section className="py-24 lg:py-32 bg-bg">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-[1fr_2fr] gap-10 lg:gap-16">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-7 h-[3px] bg-primary" aria-hidden />
                <p className="font-sans text-label-md uppercase text-primary">
                  The Directory
                </p>
              </div>
              <h2 className="font-serif text-display-md uppercase text-on-surface">
                The Index
              </h2>
              <p className="font-sans text-base text-on-surface-variant mt-5 max-w-sm">
                The gyms, recovery studios, coaches, clubs, and stores of the network — seven
                categories, every listing reviewed.
              </p>
              <Link
                href="/search"
                className="mt-8 inline-flex items-center gap-2 font-sans text-label-md uppercase text-on-surface hover:text-primary transition-colors duration-300"
              >
                Search the network
                <ArrowUpRight size={16} />
              </Link>
            </div>

            <div>
              {CATEGORIES.map((cat, i) => (
                <Link
                  key={cat.href}
                  href={cat.href}
                  className="group relative overflow-hidden flex items-baseline justify-between gap-6 py-7 hover:bg-surface-low -mx-6 lg:mx-0 px-6 transition-colors duration-300"
                >
                  {/* Ghost word — slides in on hover */}
                  <span
                    aria-hidden
                    className="pointer-events-none select-none absolute inset-y-0 right-0 flex items-center font-serif font-extrabold uppercase tracking-tighter leading-none whitespace-nowrap text-7xl lg:text-8xl text-primary/[0.07] opacity-0 translate-x-10 group-hover:opacity-100 group-hover:translate-x-4 transition-all duration-500"
                  >
                    {cat.name}
                  </span>

                  <div className="relative flex items-baseline gap-6 min-w-0">
                    <span className="font-sans text-label-sm text-on-surface-variant flex-shrink-0 tabular-nums">
                      {String(i + 1).padStart(2, "0")} / {String(CATEGORIES.length).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-serif text-2xl lg:text-4xl font-extrabold uppercase tracking-tight text-on-surface group-hover:text-primary transition-colors duration-300">
                        {cat.name}
                      </h3>
                      <p className="font-sans text-sm text-on-surface-variant mt-2 max-w-lg">
                        {cat.desc}
                      </p>
                    </div>
                  </div>
                  <ArrowUpRight
                    size={22}
                    className="relative flex-shrink-0 text-outline-variant group-hover:text-primary group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300"
                  />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Featured Spaces — Level 1 tonal section ── */}
      <section className="py-24 lg:py-32 bg-surface-low">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-14">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="w-7 h-[3px] bg-primary" aria-hidden />
                <p className="font-sans text-label-md uppercase text-primary">
                  {COPY.featuredSection.kicker}
                </p>
              </div>
              <h2 className="font-serif text-display-md uppercase text-on-surface">
                {COPY.featuredSection.title}
              </h2>
              <p className="font-sans text-base text-on-surface-variant mt-4 max-w-xl">
                {COPY.featuredSection.subtitle}
              </p>
            </div>
            <Link
              href="/recovery"
              className="flex-shrink-0 inline-flex items-center gap-2 font-sans text-label-md uppercase text-on-surface hover:text-primary transition-colors duration-300"
            >
              {COPY.featuredSection.cta}
              <ArrowUpRight size={15} />
            </Link>
          </div>

          {listings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map(listing => (
                <ListingCard
                  key={listing.id}
                  id={listing.id}
                  slug={listing.slug}
                  name={listing.name}
                  type={listing.type}
                  tagline={listing.tagline ?? undefined}
                  city={listing.city ?? undefined}
                  country={listing.country ?? undefined}
                  logo_url={listing.logo_url}
                  images={listing.images}
                  specialties={listing.specialties}
                  rating_avg={listing.rating_avg}
                  rating_count={listing.rating_count}
                  is_verified={listing.is_verified}
                  is_featured={listing.is_featured}
                  price_range={listing.price_range}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="The network is growing"
              description="Be among the first to list your space in the Index."
              cta={{ label: "List Your Space", href: "/submit" }}
            />
          )}
        </div>
      </section>

      {/* ── Access CTA — full lime block, two doors ── */}
      <section className="bg-lime-gradient">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-24 lg:py-32">
          <h2 className="font-serif text-display-lg uppercase text-primary-on max-w-3xl">
            {COPY.submitCta.title}
          </h2>
          <p className="font-sans text-lg text-primary-on/80 max-w-xl mt-6">
            {COPY.submitCta.subtitle}
          </p>
          <div className="flex flex-wrap items-center gap-4 mt-10">
            <Link
              href="/for-brands"
              className="inline-flex items-center gap-2 px-8 py-4 bg-bg text-on-surface font-sans text-sm font-bold tracking-wide uppercase transition-opacity duration-400 hover:opacity-90"
            >
              {COPY.submitCta.ctaBrands}
              <ArrowUpRight size={16} />
            </Link>
            <Link
              href="/creators"
              className="inline-flex items-center gap-2 px-8 py-4 text-primary-on font-sans text-sm font-bold tracking-wide uppercase transition-opacity duration-400 hover:opacity-80"
              style={{ boxShadow: "inset 0 0 0 1px rgba(22,25,0,0.4)" }}
            >
              {COPY.submitCta.ctaCreators}
              <ArrowUpRight size={16} />
            </Link>
          </div>
          <Link
            href="/submit"
            className="mt-8 inline-flex items-center gap-2 font-sans text-label-md uppercase text-primary-on/70 hover:text-primary-on transition-colors duration-300"
          >
            {COPY.submitCta.listLink}
            <ArrowUpRight size={14} />
          </Link>
        </div>
      </section>
    </>
  );
}

// ── Deal Row — compact board row: rank, favicon, brand, pay, score ──────────

function DealRow({ deal, index }: { deal: DrOpportunity; index: number }) {
  const pay =
    deal.compensation_text ??
    (deal.active_ad_count ? `${deal.active_ad_count} active creator ads` : "Spend signal");
  return (
    <Link
      href="/deals"
      className="group flex items-baseline gap-4 lg:gap-6 py-5 px-6 lg:px-8 -mx-6 lg:-mx-8 hover:bg-surface-card transition-colors duration-300"
    >
      <span className="font-sans text-label-sm text-on-surface-variant w-8 flex-shrink-0 tabular-nums">
        {String(index + 1).padStart(3, "0")}
      </span>
      <span className="hidden sm:flex flex-shrink-0 self-center w-11 h-11 items-center justify-center bg-surface-input p-2">
        {deal.brand_domain ? (
          <Image
            src={`https://www.google.com/s2/favicons?domain=${deal.brand_domain}&sz=128`}
            alt=""
            width={48}
            height={48}
            className="w-full h-full object-contain"
            unoptimized
          />
        ) : (
          <span className="font-serif font-extrabold text-base text-on-surface">
            {deal.brand_name.slice(0, 2).toUpperCase()}
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-serif text-xl lg:text-3xl font-extrabold uppercase tracking-tight text-on-surface group-hover:text-primary transition-colors duration-300">
          {deal.brand_name}
        </span>
        <span className="hidden sm:inline font-sans text-label-sm uppercase text-on-surface-variant">
          {pay}
        </span>
        <span className="font-sans text-label-sm uppercase text-primary">
          {deal.source_type === "listed_deal" ? "Apply now" : "Pitch them"}
        </span>
      </span>
      <span className="flex-shrink-0 font-sans text-base lg:text-lg font-bold tabular-nums text-primary">
        {deal.score}
      </span>
      <ArrowUpRight
        size={18}
        className="flex-shrink-0 self-center text-outline-variant group-hover:text-primary transition-colors duration-300"
      />
    </Link>
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

// ── Empty State ───────────────────────────────────────────────────────────────

function EmptyState({
  title,
  description,
  cta,
}: {
  title: string;
  description: string;
  cta: { label: string; href: string };
}) {
  return (
    <div className="py-24 text-center">
      <h3 className="font-serif text-display-sm uppercase text-on-surface mb-3">{title}</h3>
      <p className="font-sans text-sm text-on-surface-variant max-w-sm mx-auto mb-8">
        {description}
      </p>
      <Link
        href={cta.href}
        className="inline-flex px-8 py-4 bg-primary text-primary-on font-sans text-sm font-bold tracking-wide uppercase transition-opacity duration-400 hover:opacity-90"
      >
        {cta.label}
      </Link>
    </div>
  );
}
