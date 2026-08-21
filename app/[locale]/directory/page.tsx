import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SITE } from "@/lib/config/site";
import type { Listing } from "@/lib/supabase/types";
import ListingCard from "@/components/directory/ListingCard";
import SearchBar from "@/components/directory/SearchBar";

// The directory's front door. It is no longer promoted in the primary nav, but
// it needs one page that holds the whole thing together: search, every
// category, and a few spaces worth looking at. Category pages keep their own
// URLs and their own SEO.

export const revalidate = 3600;

const PAGE_TITLE = "The Directory — Gyms, Recovery Studios, Coaches & More";
const PAGE_DESC =
  "Browse the FitBodega directory: recovery studios, gyms, coaches, clubs, nutritionists, health food stores, and youth sports — every listing reviewed by hand.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESC,
  alternates: { canonical: `${SITE.url}/directory` },
  openGraph: { title: PAGE_TITLE, description: PAGE_DESC, url: `${SITE.url}/directory` },
};

const CATEGORIES = [
  { name: "Recovery",           href: "/recovery",           desc: "Sauna, cold plunge, red light, float, and contrast therapy." },
  { name: "Gyms & Studios",     href: "/gyms",               desc: "Strength floors, boxing, HIIT, pilates, and conditioning." },
  { name: "Coaches & Trainers", href: "/trainers",           desc: "Elite performance coaches and specialists." },
  { name: "Clubs",              href: "/clubs",              desc: "Run crews, ride groups, swim clubs, and social fitness collectives." },
  { name: "Nutritionists",      href: "/nutritionists",      desc: "Sports dietitians and nutrition coaching." },
  { name: "Health Food Stores", href: "/health-food-stores", desc: "Supplements, whole foods, and clean fuel." },
  { name: "Youth Sports",       href: "/youth-sports",       desc: "Soccer clubs, academies, camps, and development." },
];

export default async function DirectoryPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("listings")
    .select("*")
    .eq("status", "approved")
    .eq("is_featured", true)
    .order("rating_avg", { ascending: false })
    .limit(6);
  const listings: Listing[] = data ?? [];

  return (
    <div className="min-h-screen bg-bg">
      {/* ── Masthead + search ── */}
      <section className="bg-surface-low">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-28 pb-14 lg:pt-32 lg:pb-16">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-7 h-[3px] bg-primary" aria-hidden />
            <p className="font-sans text-label-md uppercase text-primary">The Directory</p>
          </div>
          <h1 className="font-serif text-display-lg uppercase tracking-tight text-on-surface max-w-4xl">
            The world they train in
          </h1>
          <p className="font-sans text-base lg:text-lg text-on-surface-variant mt-6 max-w-2xl">
            Recovery studios, gyms, coaches, clubs, nutritionists, stores, and youth sports —
            every listing reviewed by hand before it goes live.
          </p>
          <div className="mt-10 max-w-3xl">
            <SearchBar placeholder="Search by city, coach, gym, cold plunge..." />
          </div>
        </div>
      </section>

      {/* ── Categories — typographic index rows ── */}
      <section className="py-16 lg:py-24 bg-bg">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-10">
            <span className="w-7 h-[3px] bg-primary" aria-hidden />
            <h2 className="font-sans text-label-md uppercase text-primary">Every category</h2>
          </div>
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
      </section>

      {/* ── Featured spaces ── */}
      {listings.length > 0 && (
        <section className="py-16 lg:py-24 bg-surface-low">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-10">
              <span className="w-7 h-[3px] bg-primary" aria-hidden />
              <h2 className="font-sans text-label-md uppercase text-primary">Featured spaces</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((listing) => (
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
          </div>
        </section>
      )}

      {/* ── List your space ── */}
      <section className="py-16 lg:py-24 bg-bg">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="relative overflow-hidden bg-surface-card px-7 py-10 lg:px-14 lg:py-14">
            <span
              aria-hidden
              className="pointer-events-none select-none absolute -bottom-16 right-4 font-serif font-extrabold leading-none tracking-tighter text-[13rem] text-on-surface/[0.04]"
            >
              F
            </span>
            <div className="relative max-w-2xl">
              <h2 className="font-serif text-display-md uppercase text-on-surface">
                Get featured in the network
              </h2>
              <p className="font-sans text-base text-on-surface-variant mt-5">
                Gyms, studios, coaches, and recovery spaces that join the network get a reviewed
                listing. Stand-out spaces are showcased in the Journal and across
                FitBodega&apos;s social channels.
              </p>
              <Link
                href="/submit"
                className="inline-flex items-center gap-2 mt-9 px-8 py-4 bg-primary text-primary-on font-sans text-sm font-bold tracking-wide uppercase transition-opacity duration-400 hover:opacity-90"
              >
                List your space
                <ArrowUpRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
