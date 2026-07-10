import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import type { Listing } from "@/lib/supabase/types";
import { CATEGORIES } from "@/lib/config/categories";
import { getIpLocation } from "@/lib/utils/ipLocation";
import { SITE, DEFAULT_OG_IMAGE } from "@/lib/config/site";
import SearchBar from "@/components/directory/SearchBar";
import FilteredListingGrid from "@/components/directory/FilteredListingGrid";
import CategoryJsonLd from "@/components/directory/CategoryJsonLd";

// Community movement: run crews, ride groups, swim clubs, rec leagues,
// and social fitness collectives.
const CLUB_STYLE_IDS = ["clubs"];
const CLUB_STYLES = CATEGORIES
  .filter(c => CLUB_STYLE_IDS.includes(c.id))
  .flatMap(c => c.styles);

export const metadata: Metadata = {
  title: "Run Clubs, Ride Groups & Fitness Clubs Near You",
  description: "Run crews, cycling clubs, swim clubs, rec leagues, and social fitness collectives — community movement, curated across the FitBodega network.",
  alternates: { canonical: `${SITE.url}/clubs` },
  openGraph: {
    title: "Run Clubs, Ride Groups & Fitness Clubs Near You",
    description: "Run crews, cycling clubs, swim clubs, rec leagues, and social fitness collectives — community movement, curated.",
    url: `${SITE.url}/clubs`,
    images: [DEFAULT_OG_IMAGE],
  },
};

export default async function ClubsPage() {
  const [supabase, ipLocation] = await Promise.all([
    createClient(),
    getIpLocation(),
  ]);

  const { data, count } = await supabase
    .from("listings")
    .select("*", { count: "exact" })
    .eq("status", "approved")
    .eq("type", "club")
    .order("is_featured", { ascending: false })
    .order("rating_avg", { ascending: false })
    .limit(500);

  const clubs: Listing[] = data ?? [];
  const total = count ?? 0;

  return (
    <>
      <CategoryJsonLd
        name="Run Clubs, Ride Groups & Fitness Clubs Near You"
        description="Fitness clubs and community movement crews indexed in the FitBodega network, ranked by distance to the visitor."
        url={`${SITE.url}/clubs`}
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
              Clubs &amp; Crews
            </h1>
            <p className="font-sans text-lg text-on-surface-variant leading-relaxed mt-6">
              Elevated community movement — run crews, ride groups, swim clubs,
              and social fitness collectives. Show up. Join the collective.
            </p>
            {total > 0 && (
              <p className="font-sans text-label-sm uppercase text-on-surface-variant mt-6">
                {total.toLocaleString()} club{total !== 1 ? "s" : ""} in the network
              </p>
            )}
          </div>
          <div className="mt-10 max-w-3xl">
            <SearchBar
              initialType="club"
              showFilters={false}
              placeholder="Search run clubs, ride groups, swim clubs..."
            />
          </div>
        </div>
      </section>

      <FilteredListingGrid
        listings={clubs}
        columns="4"
        filterGroups={[
          { field: "specialties", options: CLUB_STYLES },
        ]}
        ipLocation={ipLocation}
        enableCountryFilter
        emptyTitle="Clubs coming soon"
        emptyDescription="We are growing the network. Be the first club or crew listed in your city."
        emptyCta="List Your Club"
      />
    </>
  );
}
