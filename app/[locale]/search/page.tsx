import Link from "next/link";
import { ArrowUpRight, SearchX } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";
import type { Listing } from "@/lib/supabase/types";
import { LISTING_TYPES, SITE } from "@/lib/config/site";
import Badge from "@/components/ui/Badge";
import SearchBar from "@/components/directory/SearchBar";
import SearchCountryFilter from "@/components/directory/SearchCountryFilter";
import { getListingUrl } from "@/lib/utils/listingUrl";

export const metadata = {
  title: "Search",
  description: "Search for recovery studios, gyms, coaches, nutritionists, health food stores, and youth sports programs in the FitBodega network.",
  // All ?q=/type=/country= variants consolidate to the bare /search URL so
  // parameterized result pages never compete as thin duplicates.
  alternates: { canonical: `${SITE.url}/search` },
  // Internal search results are thin/duplicative — keep them out of the index
  // but let crawlers follow links through to the listings and hub pages.
  robots: { index: false, follow: true },
};

interface SearchPageProps {
  searchParams: Promise<{ q?: string; type?: string; country?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q, type, country } = await searchParams;
  const query = (q ?? "").trim();
  const typeFilter = type ?? "";
  const countryFilter = (country ?? "").trim();

  const supabase = createAdminClient();

  // Distinct countries across approved listings — powers the country dropdown.
  const { data: countryRows } = await supabase
    .from("listings")
    .select("country")
    .eq("status", "approved")
    .not("country", "is", null);
  const countries = Array.from(
    new Set((countryRows ?? []).map((r) => r.country).filter(Boolean) as string[])
  ).sort((a, b) => a.localeCompare(b));

  let results: Listing[] = [];

  if (query || typeFilter || countryFilter) {
    let req = supabase
      .from("listings")
      .select("id, name, slug, type, tagline, city, country, is_verified, is_featured, logo_url")
      .eq("status", "approved");

    if (typeFilter) {
      req = req.eq("type", typeFilter);
    }

    if (countryFilter) {
      req = req.eq("country", countryFilter);
    }

    if (query) {
      req = req.or(
        `name.ilike.%${query}%,description.ilike.%${query}%,tagline.ilike.%${query}%,city.ilike.%${query}%`
      );
    }

    const { data } = await req.order("is_featured", { ascending: false }).limit(48);
    results = (data ?? []) as Listing[];
  }

  return (
    <div className="min-h-screen bg-bg px-6 py-32">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-7 h-[3px] bg-primary" aria-hidden />
            <p className="font-sans text-label-md uppercase text-primary">Search</p>
          </div>
          <h1 className="font-serif text-display-sm uppercase text-on-surface mb-3">
            {query
              ? `Results for "${query}"`
              : typeFilter
              ? `Browse ${typeFilter}`
              : countryFilter
              ? `The Network in ${countryFilter}`
              : "Search the Network"}
          </h1>
          <p className="font-sans text-sm text-on-surface-variant">
            {results.length} {results.length === 1 ? "result" : "results"} found
            {typeFilter && (
              <> in <span className="font-bold capitalize text-on-surface">{typeFilter}</span></>
            )}
            {countryFilter && (
              <> in <span className="font-bold text-on-surface">{countryFilter}</span></>
            )}
            {(query || typeFilter || countryFilter) && (
              <>
                {" · "}
                <Link href="/" className="text-primary hover:opacity-80">
                  Back to home
                </Link>
              </>
            )}
          </p>
        </div>

        {/* Search bar (stays active so users can edit, clear, or search again) */}
        <div className="mb-8">
          <SearchBar
            initialQuery={query}
            initialType={typeFilter}
            showFilters={false}
            placeholder="Search recovery, gyms, coaches..."
          />
        </div>

        {/* Filter pills */}
        <div className="flex flex-wrap items-center gap-2 mb-10">
          {(() => {
            const base = new URLSearchParams();
            if (query) base.set("q", query);
            if (countryFilter) base.set("country", countryFilter);
            const allHref = base.toString() ? `/search?${base.toString()}` : "/search";
            return (
              <Link
                href={allHref}
                className={`inline-flex items-center px-4 py-2.5 font-sans text-label-sm uppercase transition-colors duration-300 ${
                  !typeFilter
                    ? "bg-primary text-primary-on"
                    : "bg-surface-input text-on-surface-variant hover:bg-surface-bright hover:text-on-surface"
                }`}
              >
                All
              </Link>
            );
          })()}
          {LISTING_TYPES.map((t) => {
            const isActive = typeFilter === t.id;
            const p = new URLSearchParams();
            if (query) p.set("q", query);
            if (countryFilter) p.set("country", countryFilter);
            p.set("type", t.id);
            const href = `/search?${p.toString()}`;
            return (
              <Link
                key={t.id}
                href={href}
                className={`inline-flex items-center gap-1.5 px-4 py-2.5 font-sans text-label-sm uppercase transition-colors duration-300 ${
                  isActive
                    ? "bg-primary text-primary-on"
                    : "bg-surface-input text-on-surface-variant hover:bg-surface-bright hover:text-on-surface"
                }`}
              >
                {t.label}
              </Link>
            );
          })}

          {countries.length > 0 && (
            <span className="ml-1">
              <SearchCountryFilter
                countries={countries}
                current={countryFilter}
                query={query}
                type={typeFilter}
              />
            </span>
          )}
        </div>

        {/* Empty state */}
        {results.length === 0 && (query || typeFilter || countryFilter) && (
          <div className="text-center py-24">
            <div className="flex justify-center mb-6">
              <SearchX size={40} className="text-outline-variant" />
            </div>
            <h2 className="font-serif text-display-sm uppercase text-on-surface mb-3">
              No results found
            </h2>
            <p className="font-sans text-sm text-on-surface-variant mb-8 max-w-sm mx-auto">
              Try a different search term, or browse a category above.
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-on font-sans text-sm font-bold tracking-wide uppercase transition-opacity duration-400 hover:opacity-90"
            >
              Explore all listings
            </Link>
          </div>
        )}

        {/* No query */}
        {!query && !typeFilter && !countryFilter && (
          <div className="text-center py-24">
            <div className="flex justify-center mb-6">
              <SearchX size={40} className="text-outline-variant" />
            </div>
            <h2 className="font-serif text-display-sm uppercase text-on-surface mb-3">
              What are you training for?
            </h2>
            <p className="font-sans text-sm text-on-surface-variant max-w-sm mx-auto">
              Enter a search term above or choose a category to browse.
            </p>
          </div>
        )}

        {/* Results grid — sharp cards, tonal hover only */}
        {results.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {results.map((listing) => (
              <Link
                key={listing.id}
                href={getListingUrl(listing.type, listing.slug)}
                className="group bg-surface-card hover:bg-surface-input transition-colors duration-300 p-5 flex gap-4"
              >
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="font-serif text-base font-extrabold uppercase tracking-tight text-on-surface group-hover:text-primary transition-colors truncate">
                      {listing.name}
                    </h3>
                    {listing.is_verified && (
                      <Badge variant="verified">Verified</Badge>
                    )}
                    {listing.is_featured && (
                      <Badge variant="featured">Featured</Badge>
                    )}
                  </div>

                  {listing.tagline && (
                    <p className="font-sans text-sm text-on-surface-variant line-clamp-2 mb-2">
                      {listing.tagline}
                    </p>
                  )}

                  <div className="flex items-center gap-3">
                    <span className="font-sans text-label-sm uppercase text-on-surface-variant">
                      {listing.type}
                    </span>
                    {listing.city && (
                      <>
                        <span className="text-outline-variant">/</span>
                        <span className="font-sans text-xs text-on-surface-variant">
                          {listing.city}
                          {listing.country ? `, ${listing.country}` : ""}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center flex-shrink-0">
                  <ArrowUpRight size={18} className="text-on-surface-variant group-hover:text-primary transition-colors duration-300" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
