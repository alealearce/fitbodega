import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getIpLocation } from "@/lib/utils/ipLocation";
import type { Listing } from "@/lib/supabase/types";
import { CATEGORIES, EXPERIENCE_LEVELS } from "@/lib/config/categories";
import { SITE, DEFAULT_OG_IMAGE } from "@/lib/config/site";
import SearchBar from "@/components/directory/SearchBar";
import FilteredListingGrid from "@/components/directory/FilteredListingGrid";
import CategoryJsonLd from "@/components/directory/CategoryJsonLd";

// Coaching specialties: strength, conditioning, combat, mind-body, endurance,
// and physio/bodywork practitioners who also coach.
const TRAINER_STYLE_IDS = ["strength", "conditioning", "combat", "mindbody", "endurance", "bodywork"];
const TRAINER_STYLES = CATEGORIES
  .filter(c => TRAINER_STYLE_IDS.includes(c.id))
  .flatMap(c => c.styles);

export const metadata: Metadata = {
  title: "Coaches & Trainers Near You",
  description: "Elite performance coaches and specialists — strength, conditioning, combat, and mobility. Verified trainers in the FitBodega network.",
  alternates: { canonical: `${SITE.url}/trainers` },
  openGraph: {
    title: "Coaches & Trainers Near You",
    description: "Elite performance coaches and specialists — strength, conditioning, combat, and mobility.",
    url: `${SITE.url}/trainers`,
    images: [DEFAULT_OG_IMAGE],
  },
};

export default async function TrainersPage() {
  const [supabase, ipLocation] = await Promise.all([
    createClient(),
    getIpLocation(),
  ]);

  const { data, count } = await supabase
    .from("listings")
    .select("*", { count: "exact" })
    .eq("status", "approved")
    .eq("type", "trainer")
    .order("is_featured", { ascending: false })
    .order("rating_avg", { ascending: false })
    .limit(500);

  const trainers: Listing[] = data ?? [];
  const total = count ?? 0;

  return (
    <>
      <CategoryJsonLd
        name="Coaches & Trainers Near You"
        description="Coaches and trainers indexed in the FitBodega network, ranked by distance to the visitor."
        url={`${SITE.url}/trainers`}
        listings={trainers}
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
              Coaches &amp; Trainers
            </h1>
            <p className="font-sans text-lg text-on-surface-variant leading-relaxed mt-6">
              Elite performance coaches and specialists — strength, conditioning,
              combat, and mobility. No fluff, results only.
            </p>
            {total > 0 && (
              <p className="font-sans text-label-sm uppercase text-on-surface-variant mt-6">
                {total.toLocaleString()} coach{total !== 1 ? "es" : ""} in the network
              </p>
            )}
          </div>
          <div className="mt-10 max-w-3xl">
            <SearchBar
              initialType="trainer"
              showFilters={false}
              placeholder="Search coaches and trainers by name or specialty..."
            />
          </div>
        </div>
      </section>

      <FilteredListingGrid
        listings={trainers}
        columns="4"
        filterGroups={[
          { field: "specialties", options: TRAINER_STYLES },
          { label: "Level:", field: "experience_levels", options: EXPERIENCE_LEVELS },
        ]}
        ipLocation={ipLocation}
        enableCountryFilter
        emptyTitle="Coaches coming soon"
        emptyDescription="Know an elite coach or trainer? Help them get discovered."
        emptyCta="List a Coach"
      />
    </>
  );
}
