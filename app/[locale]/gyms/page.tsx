import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import type { Listing } from "@/lib/supabase/types";
import { CATEGORIES } from "@/lib/config/categories";
import { getIpLocation } from "@/lib/utils/ipLocation";
import { SITE, DEFAULT_OG_IMAGE } from "@/lib/config/site";
import SearchBar from "@/components/directory/SearchBar";
import FilteredListingGrid from "@/components/directory/FilteredListingGrid";
import CategoryJsonLd from "@/components/directory/CategoryJsonLd";

// Training-floor modalities: strength, conditioning, combat, mind-body,
// endurance, and the catch-all "other" bucket (climbing, dance, aquatics...).
const GYM_STYLE_IDS = ["strength", "conditioning", "combat", "mindbody", "endurance", "other"];
const GYM_STYLES = CATEGORIES
  .filter(c => GYM_STYLE_IDS.includes(c.id))
  .flatMap(c => c.styles);

export const metadata: Metadata = {
  title: "Gyms & Training Studios Near You",
  description: "Strength floors, boxing gyms, HIIT studios, and conditioning spaces — curated and verified across the FitBodega network.",
  alternates: { canonical: `${SITE.url}/gyms` },
  openGraph: {
    title: "Gyms & Training Studios Near You",
    description: "Strength floors, boxing gyms, HIIT studios, and conditioning spaces — curated and verified across the network.",
    url: `${SITE.url}/gyms`,
    images: [DEFAULT_OG_IMAGE],
  },
};

export default async function GymsPage() {
  const [supabase, ipLocation] = await Promise.all([
    createClient(),
    getIpLocation(),
  ]);

  const { data, count } = await supabase
    .from("listings")
    .select("*", { count: "exact" })
    .eq("status", "approved")
    .eq("type", "gym")
    .order("is_featured", { ascending: false })
    .order("rating_avg", { ascending: false })
    .limit(500);

  const gyms: Listing[] = data ?? [];
  const total = count ?? 0;

  return (
    <>
      <CategoryJsonLd
        name="Gyms & Training Studios Near You"
        description="Gyms and training studios indexed in the FitBodega network, ranked by distance to the visitor."
        url={`${SITE.url}/gyms`}
        listings={gyms}
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
              Gyms &amp; Training Studios
            </h1>
            <p className="font-sans text-lg text-on-surface-variant leading-relaxed mt-6">
              Strength floors, boxing gyms, HIIT studios, and conditioning spaces —
              curated and verified for those who train with intent.
            </p>
            {total > 0 && (
              <p className="font-sans text-label-sm uppercase text-on-surface-variant mt-6">
                {total.toLocaleString()} space{total !== 1 ? "s" : ""} in the network
              </p>
            )}
          </div>
          <div className="mt-10 max-w-3xl">
            <SearchBar
              initialType="gym"
              showFilters={false}
              placeholder="Search gyms and studios by name or city..."
            />
          </div>
        </div>
      </section>

      <FilteredListingGrid
        listings={gyms}
        columns="4"
        filterGroups={[
          { field: "specialties", options: GYM_STYLES },
        ]}
        ipLocation={ipLocation}
        enableCountryFilter
        emptyTitle="Gyms coming soon"
        emptyDescription="We are growing the network. Be the first gym or studio listed in your city."
        emptyCta="List Your Space"
      />
    </>
  );
}
