import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import type { Listing } from "@/lib/supabase/types";
import { PRODUCT_CATEGORIES } from "@/lib/config/categories";
import { getIpLocation } from "@/lib/utils/ipLocation";
import { SITE, DEFAULT_OG_IMAGE } from "@/lib/config/site";
import SearchBar from "@/components/directory/SearchBar";
import FilteredListingGrid from "@/components/directory/FilteredListingGrid";
import CategoryJsonLd from "@/components/directory/CategoryJsonLd";

export const metadata: Metadata = {
  title: "Health Food & Supplement Stores Near You",
  description: "Clean fuel, supplements, and whole foods — curated health food and supplement stores in the FitBodega network.",
  alternates: { canonical: `${SITE.url}/health-food-stores` },
  openGraph: {
    title: "Health Food & Supplement Stores Near You",
    description: "Clean fuel, supplements, and whole foods — curated and verified.",
    url: `${SITE.url}/health-food-stores`,
    images: [DEFAULT_OG_IMAGE],
  },
};

export default async function HealthFoodStoresPage() {
  const [supabase, ipLocation] = await Promise.all([
    createClient(),
    getIpLocation(),
  ]);

  const { data, count } = await supabase
    .from("listings")
    .select("*", { count: "exact" })
    .eq("status", "approved")
    .eq("type", "store")
    .order("is_featured", { ascending: false })
    .order("rating_avg", { ascending: false })
    .limit(500);

  const stores: Listing[] = data ?? [];
  const total = count ?? 0;

  return (
    <>
      <CategoryJsonLd
        name="Health Food & Supplement Stores Near You"
        description="Health food and supplement stores indexed in the FitBodega network, ranked by distance to the visitor."
        url={`${SITE.url}/health-food-stores`}
        listings={stores}
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
              Health Food &amp; Supplement Stores
            </h1>
            <p className="font-sans text-lg text-on-surface-variant leading-relaxed mt-6">
              Clean fuel, supplements, and whole foods — the shelves that
              back up the training.
            </p>
            {total > 0 && (
              <p className="font-sans text-label-sm uppercase text-on-surface-variant mt-6">
                {total.toLocaleString()} store{total !== 1 ? "s" : ""} in the network
              </p>
            )}
          </div>
          <div className="mt-10 max-w-3xl">
            <SearchBar
              initialType="store"
              showFilters={false}
              placeholder="Search health food and supplement stores by name or city..."
            />
          </div>
        </div>
      </section>

      <FilteredListingGrid
        listings={stores}
        columns="4"
        filterGroups={[
          { field: "specialties", options: PRODUCT_CATEGORIES },
        ]}
        ipLocation={ipLocation}
        enableCountryFilter
        emptyTitle="Stores coming soon"
        emptyDescription="We are growing the network. Be the first health food store listed in your city."
        emptyCta="List Your Store"
      />
    </>
  );
}
