import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import type { Listing } from "@/lib/supabase/types";
import { CATEGORIES } from "@/lib/config/categories";
import { getIpLocation } from "@/lib/utils/ipLocation";
import { SITE, DEFAULT_OG_IMAGE } from "@/lib/config/site";
import SearchBar from "@/components/directory/SearchBar";
import FilteredListingGrid from "@/components/directory/FilteredListingGrid";
import CategoryJsonLd from "@/components/directory/CategoryJsonLd";

// Heat, cold, and recovery-tech modalities — sauna, cold plunge, red light,
// float, cryo, hyperbaric.
const RECOVERY_STYLE_IDS = ["sauna", "coldplunge", "recoverytech"];
const RECOVERY_STYLES = CATEGORIES
  .filter(c => RECOVERY_STYLE_IDS.includes(c.id))
  .flatMap(c => c.styles);

// Recovery is the hero category of the network — highest search intent,
// leads every hub link on the homepage.
export const metadata: Metadata = {
  title: "Sauna, Cold Plunge & Recovery Studios Near You",
  description: "Sauna, cold plunge, contrast therapy, red light, float, cryo, and hyperbaric — Vancouver's curated recovery network, open worldwide.",
  alternates: { canonical: `${SITE.url}/recovery` },
  openGraph: {
    title: "Sauna, Cold Plunge & Recovery Studios Near You",
    description: "Sauna, cold plunge, contrast therapy, red light, float, cryo, and hyperbaric — curated and verified.",
    url: `${SITE.url}/recovery`,
    images: [DEFAULT_OG_IMAGE],
  },
};

export default async function RecoveryPage() {
  const [supabase, ipLocation] = await Promise.all([
    createClient(),
    getIpLocation(),
  ]);

  const { data, count } = await supabase
    .from("listings")
    .select("*", { count: "exact" })
    .eq("status", "approved")
    .eq("type", "recovery")
    .order("is_featured", { ascending: false })
    .order("rating_avg", { ascending: false })
    .limit(500);

  const studios: Listing[] = data ?? [];
  const total = count ?? 0;

  return (
    <>
      <CategoryJsonLd
        name="Sauna, Cold Plunge & Recovery Studios Near You"
        description="Recovery studios indexed in the FitBodega network, ranked by distance to the visitor."
        url={`${SITE.url}/recovery`}
        listings={studios}
        total={total}
      />

      {/* Hero — the flagship category gets the full-scale treatment */}
      <section className="relative overflow-hidden pt-32 pb-16 lg:pt-40 lg:pb-24 bg-bg">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 85% 10%, rgba(209,252,0,0.06) 0%, transparent 60%)",
          }}
        />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-7 h-[3px] bg-primary" aria-hidden />
              <p className="font-sans text-label-md uppercase text-primary">The Directory / Flagship</p>
            </div>
            <h1 className="font-serif text-display-xl uppercase text-on-surface">
              Sauna, Cold Plunge
              <br />&amp; Recovery
            </h1>
            <p className="font-sans text-lg text-on-surface-variant leading-relaxed mt-8 max-w-xl">
              Contrast therapy, red light, float, cryo, and hyperbaric — the
              sanctuary of performance. Rooted in Vancouver, open to the network worldwide.
            </p>
            {total > 0 && (
              <p className="font-sans text-label-sm uppercase text-on-surface-variant mt-6">
                {total.toLocaleString()} space{total !== 1 ? "s" : ""} in the network
              </p>
            )}
          </div>
          <div className="mt-10 max-w-3xl">
            <SearchBar
              initialType="recovery"
              showFilters={false}
              placeholder="Search saunas, cold plunge, and recovery studios..."
            />
          </div>
        </div>
      </section>

      <FilteredListingGrid
        listings={studios}
        columns="4"
        filterGroups={[
          { field: "specialties", options: RECOVERY_STYLES },
        ]}
        ipLocation={ipLocation}
        enableCountryFilter
        emptyTitle="Recovery studios coming soon"
        emptyDescription="We are growing the network. Be the first recovery studio listed in your city."
        emptyCta="List Your Space"
      />
    </>
  );
}
