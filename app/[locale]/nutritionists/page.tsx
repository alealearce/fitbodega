import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import type { Listing } from "@/lib/supabase/types";
import { getCategoryById } from "@/lib/config/categories";
import { getIpLocation } from "@/lib/utils/ipLocation";
import { SITE, DEFAULT_OG_IMAGE } from "@/lib/config/site";
import SearchBar from "@/components/directory/SearchBar";
import FilteredListingGrid from "@/components/directory/FilteredListingGrid";
import CategoryJsonLd from "@/components/directory/CategoryJsonLd";

const NUTRITION_STYLES = getCategoryById("nutrition")?.styles ?? [];

export const metadata: Metadata = {
  title: "Sports Nutritionists & Dietitians Near You",
  description: "Performance nutrition, body composition coaching, and meal planning — verified sports nutritionists and dietitians in the network.",
  alternates: { canonical: `${SITE.url}/nutritionists` },
  openGraph: {
    title: "Sports Nutritionists & Dietitians Near You",
    description: "Performance nutrition, body composition coaching, and meal planning — verified and curated.",
    url: `${SITE.url}/nutritionists`,
    images: [DEFAULT_OG_IMAGE],
  },
};

export default async function NutritionistsPage() {
  const [supabase, ipLocation] = await Promise.all([
    createClient(),
    getIpLocation(),
  ]);

  const { data, count } = await supabase
    .from("listings")
    .select("*", { count: "exact" })
    .eq("status", "approved")
    .eq("type", "nutritionist")
    .order("is_featured", { ascending: false })
    .order("rating_avg", { ascending: false })
    .limit(500);

  const nutritionists: Listing[] = data ?? [];
  const total = count ?? 0;

  return (
    <>
      <CategoryJsonLd
        name="Sports Nutritionists & Dietitians Near You"
        description="Sports nutritionists and dietitians indexed in the FitBodega network, ranked by distance to the visitor."
        url={`${SITE.url}/nutritionists`}
        listings={nutritionists}
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
              Sports Nutritionists &amp; Dietitians
            </h1>
            <p className="font-sans text-lg text-on-surface-variant leading-relaxed mt-6">
              Performance nutrition, body composition coaching, and meal
              planning — fuel strategy for those who train seriously.
            </p>
            {total > 0 && (
              <p className="font-sans text-label-sm uppercase text-on-surface-variant mt-6">
                {total.toLocaleString()} specialist{total !== 1 ? "s" : ""} in the network
              </p>
            )}
          </div>
          <div className="mt-10 max-w-3xl">
            <SearchBar
              initialType="nutritionist"
              showFilters={false}
              placeholder="Search nutritionists and dietitians by name or city..."
            />
          </div>
        </div>
      </section>

      <FilteredListingGrid
        listings={nutritionists}
        columns="4"
        filterGroups={[
          { field: "specialties", options: NUTRITION_STYLES },
        ]}
        ipLocation={ipLocation}
        enableCountryFilter
        emptyTitle="Nutritionists coming soon"
        emptyDescription="We are growing the network. Be the first nutrition specialist listed in your city."
        emptyCta="List Your Practice"
      />
    </>
  );
}
