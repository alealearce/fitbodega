import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import type { Listing } from "@/lib/supabase/types";
import { getCategoryById } from "@/lib/config/categories";
import { getIpLocation } from "@/lib/utils/ipLocation";
import { SITE, DEFAULT_OG_IMAGE } from "@/lib/config/site";
import SearchBar from "@/components/directory/SearchBar";
import FilteredListingGrid from "@/components/directory/FilteredListingGrid";
import CategoryJsonLd from "@/components/directory/CategoryJsonLd";

const YOUTH_STYLES = getCategoryById("youthsports")?.styles ?? [];

export const metadata: Metadata = {
  title: "Youth Sports Clubs, Academies & Camps Near You",
  description: "Soccer clubs, academies, camps, and private coaching — development pathways for young athletes, curated for parents.",
  alternates: { canonical: `${SITE.url}/youth-sports` },
  openGraph: {
    title: "Youth Sports Clubs, Academies & Camps Near You",
    description: "Soccer clubs, academies, camps, and private coaching — development pathways for young athletes.",
    url: `${SITE.url}/youth-sports`,
    images: [DEFAULT_OG_IMAGE],
  },
};

export default async function YouthSportsPage() {
  const [supabase, ipLocation] = await Promise.all([
    createClient(),
    getIpLocation(),
  ]);

  const { data, count } = await supabase
    .from("listings")
    .select("*", { count: "exact" })
    .eq("status", "approved")
    .eq("type", "youth")
    .order("is_featured", { ascending: false })
    .order("rating_avg", { ascending: false })
    .limit(500);

  const clubs: Listing[] = data ?? [];
  const total = count ?? 0;

  return (
    <>
      <CategoryJsonLd
        name="Youth Sports Clubs, Academies & Camps Near You"
        description="Youth sports clubs, academies, and camps indexed in the FitBodega network, ranked by distance to the visitor."
        url={`${SITE.url}/youth-sports`}
        listings={clubs}
        total={total}
      />

      {/* Hero */}
      <section className="pt-32 pb-16 lg:pt-40 lg:pb-20 bg-bg">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-7 h-[3px] bg-primary" aria-hidden />
              <p className="font-sans text-label-md uppercase text-primary">The Directory</p>
            </div>
            <h1 className="font-serif text-display-lg uppercase text-on-surface">
              Youth Sports Clubs &amp; Academies
            </h1>
            <p className="font-sans text-lg text-on-surface-variant leading-relaxed mt-6">
              Soccer clubs, academies, camps, and private coaching — clear
              development pathways for young athletes, curated for parents.
            </p>
            {total > 0 && (
              <p className="font-sans text-label-sm uppercase text-on-surface-variant mt-6">
                {total.toLocaleString()} program{total !== 1 ? "s" : ""} in the network
              </p>
            )}
          </div>
          <div className="mt-10 max-w-3xl">
            <SearchBar
              initialType="youth"
              showFilters={false}
              placeholder="Search youth sports clubs and academies by name or city..."
            />
          </div>
        </div>
      </section>

      <FilteredListingGrid
        listings={clubs}
        columns="4"
        filterGroups={[
          { field: "specialties", options: YOUTH_STYLES },
        ]}
        ipLocation={ipLocation}
        enableCountryFilter
        emptyTitle="Youth programs coming soon"
        emptyDescription="We are growing the network. Be the first youth sports club listed in your city."
        emptyCta="List Your Program"
      />
    </>
  );
}
