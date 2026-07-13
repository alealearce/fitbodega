import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { COPY, SITE } from "@/lib/config/site";
import type { Listing, BlogPost } from "@/lib/supabase/types";
import type { Metadata } from "next";
import HeroSection from "@/components/home/HeroSection";
import ListingCard from "@/components/directory/ListingCard";

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

  return (
    <>
      <HeroSection />

      {/* ── Member Spotlight banner — join the network, get featured ── */}
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
            href="/submit"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-bg text-on-surface font-sans text-sm font-bold tracking-wide uppercase transition-opacity duration-400 hover:opacity-90 whitespace-nowrap"
          >
            {COPY.spotlightBanner.cta}
            <ArrowUpRight size={16} />
          </Link>
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
              description="Be among the first to list your space in the curated directory."
              cta={{ label: "List Your Space", href: "/submit" }}
            />
          )}
        </div>
      </section>

      {/* ── The Index — typographic category list, no cards ── */}
      <section className="py-24 lg:py-32 bg-bg">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-7 h-[3px] bg-primary" aria-hidden />
            <p className="font-sans text-label-md uppercase text-primary">
              The Directory
            </p>
          </div>
          <h2 className="font-serif text-display-md uppercase text-on-surface mb-14">
            The Index
          </h2>

          <div>
            {CATEGORIES.map((cat, i) => (
              <Link
                key={cat.href}
                href={cat.href}
                className="group flex items-baseline justify-between gap-6 py-7 hover:bg-surface-low -mx-6 lg:-mx-8 px-6 lg:px-8 transition-colors duration-300"
              >
                <div className="flex items-baseline gap-6 min-w-0">
                  <span className="font-sans text-label-sm text-on-surface-variant w-8 flex-shrink-0">
                    {String(i + 1).padStart(2, "0")}
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
                  className="flex-shrink-0 text-outline-variant group-hover:text-primary group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300"
                />
              </Link>
            ))}
          </div>
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

      {/* ── Access CTA — full lime block, mockup-style ── */}
      <section className="bg-lime-gradient">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-24 lg:py-32">
          <h2 className="font-serif text-display-lg uppercase text-primary-on max-w-3xl">
            {COPY.submitCta.title}
          </h2>
          <p className="font-sans text-lg text-primary-on/80 max-w-xl mt-6">
            {COPY.submitCta.subtitle}
          </p>
          <Link
            href="/submit"
            className="inline-flex items-center gap-2 mt-10 px-8 py-4 bg-bg text-on-surface font-sans text-sm font-bold tracking-wide uppercase transition-opacity duration-400 hover:opacity-90"
          >
            {COPY.submitCta.cta}
            <ArrowUpRight size={16} />
          </Link>
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
