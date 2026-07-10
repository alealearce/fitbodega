"use client";

import { useEffect, useMemo, useState } from "react";
import { MapPin, Globe, SlidersHorizontal } from "lucide-react";
import { countryFlag } from "@/lib/config/countries";
import type { Listing } from "@/lib/supabase/types";
import ListingCard from "@/components/directory/ListingCard";

function haversineKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

interface FilterGroup {
  label?: string;
  options: readonly string[];
  field: "specialties" | "experience_levels";
}

interface FilteredListingGridProps {
  listings: Listing[];
  filterGroups: FilterGroup[];
  columns?: "3" | "4";
  emptyTitle?: string;
  emptyDescription?: string;
  emptyCta?: string;
  /** Approximate location from edge headers (Vercel / Cloudflare). Used as
   * a fallback when the browser denies precise geolocation. */
  ipLocation?: { lat: number; lon: number; city: string | null } | null;
  /** Show a country dropdown built from the countries present in `listings`. */
  enableCountryFilter?: boolean;
}

export default function FilteredListingGrid({
  listings,
  filterGroups,
  columns = "3",
  emptyTitle = "Coming soon",
  emptyDescription = "Be the first to list here.",
  emptyCta = "List Your Space",
  ipLocation = null,
  enableCountryFilter = false,
}: FilteredListingGridProps) {
  // One active filter per group; null = "All"
  const [activeFilters, setActiveFilters] = useState<Record<string, string | null>>(
    Object.fromEntries(filterGroups.map(g => [g.field, null]))
  );
  const [activeCountry, setActiveCountry] = useState<string | null>(null);

  // Distinct countries present in the data, alphabetical.
  const countries = useMemo(() => {
    const set = new Set<string>();
    for (const l of listings) {
      if (l.country) set.add(l.country);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [listings]);
  // Seed coordinates with the edge-provided IP location so the first paint
  // is already sorted to roughly the right region. Precise browser geo
  // overrides this when granted.
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(
    ipLocation ? { lat: ipLocation.lat, lon: ipLocation.lon } : null,
  );
  const [coordSource, setCoordSource] = useState<"ip" | "precise" | null>(
    ipLocation ? "ip" : null,
  );
  const [geoState, setGeoState] = useState<"idle" | "requesting" | "denied" | "timeout" | "unavailable" | "unsupported">("idle");
  const [optedOut, setOptedOut] = useState(false);

  const requestNearMe = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoState("unsupported");
      return;
    }
    setGeoState("requesting");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setCoordSource("precise");
        setGeoState("idle");
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) setGeoState("denied");
        else if (err.code === err.TIMEOUT) setGeoState("timeout");
        else setGeoState("unavailable");
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 10 * 60 * 1000 },
    );
  };

  // Auto-request precise browser geolocation on mount unless the user has
  // opted out this session or has already denied permission. The IP-based
  // coords from `ipLocation` provide the initial near-me ordering until
  // (or unless) the precise location is granted.
  useEffect(() => {
    if (optedOut) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoState("unsupported");
      return;
    }
    if ("permissions" in navigator && navigator.permissions?.query) {
      navigator.permissions
        .query({ name: "geolocation" as PermissionName })
        .then((p) => {
          if (p.state === "denied") setGeoState("denied");
          else requestNearMe();
        })
        .catch(() => requestNearMe());
    } else {
      requestNearMe();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = (field: string, value: string) => {
    setActiveFilters(prev => ({ ...prev, [field]: prev[field] === value ? null : value }));
  };

  const baseFiltered = listings.filter(listing => {
    if (activeCountry && listing.country !== activeCountry) return false;
    return filterGroups.every(group => {
      const active = activeFilters[group.field];
      if (!active) return true;
      const values: string[] = (listing[group.field] as string[] | null) ?? [];
      return values.includes(active);
    });
  });

  const filtered = useMemo(() => {
    if (!userCoords) return baseFiltered;
    return [...baseFiltered]
      .map((l) => {
        const distance =
          typeof l.latitude === "number" && typeof l.longitude === "number"
            ? haversineKm(userCoords, { lat: l.latitude, lon: l.longitude })
            : null;
        return { listing: l, distance };
      })
      .sort((a, b) => {
        if (a.distance === null && b.distance === null) return 0;
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      })
      .map(({ listing, distance }) => ({ ...listing, _distance: distance } as Listing & { _distance: number | null }));
  }, [baseFiltered, userCoords]);

  const gridCols = columns === "4"
    ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";

  return (
    <>
      {/* Filter bars — Level 1 tonal shift, no divider line */}
      <section className="py-6 bg-surface-low">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 space-y-3">
          {/* Near me control */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={requestNearMe}
              disabled={geoState === "requesting"}
              className={`flex items-center gap-1.5 px-4 py-2.5 font-sans text-label-sm uppercase transition-colors duration-300 ${
                userCoords
                  ? "bg-primary text-primary-on"
                  : "bg-surface-input text-on-surface hover:bg-surface-bright"
              } disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              <MapPin size={13} />
              {coordSource === "precise"
                ? "Showing nearest to you"
                : userCoords && coordSource === "ip"
                ? `Near ${ipLocation?.city ?? "you"} — use precise location`
                : geoState === "requesting"
                ? "Locating…"
                : geoState === "denied"
                ? "Use my location"
                : geoState === "timeout"
                ? "Try location again"
                : "Use my location"}
            </button>
            {userCoords && (
              <button
                onClick={() => {
                  setUserCoords(null);
                  setCoordSource(null);
                  setOptedOut(true);
                }}
                className="font-sans text-label-sm uppercase text-on-surface-variant hover:text-primary transition-colors"
              >
                Default order
              </button>
            )}
            {geoState === "denied" && !userCoords && (
              <span className="font-sans text-xs text-on-surface-variant/70">
                Location blocked for this site — enable it in your browser&apos;s site settings.
              </span>
            )}
            {geoState === "unavailable" && !userCoords && (
              <span className="font-sans text-xs text-on-surface-variant/70">
                Couldn&apos;t determine your location — try again.
              </span>
            )}
            {geoState === "unsupported" && (
              <span className="font-sans text-xs text-on-surface-variant/70">
                Geolocation isn&apos;t supported in this browser.
              </span>
            )}

            {enableCountryFilter && countries.length > 1 && (
              <div className="relative flex items-center">
                <Globe size={13} className="absolute left-3 text-on-surface-variant/60 pointer-events-none" />
                <select
                  value={activeCountry ?? ""}
                  onChange={(e) => setActiveCountry(e.target.value || null)}
                  className={`appearance-none pl-8 pr-8 py-2.5 font-sans text-label-sm uppercase cursor-pointer outline-none transition-colors duration-300 ${
                    activeCountry
                      ? "bg-primary text-primary-on"
                      : "bg-surface-input text-on-surface-variant hover:bg-surface-bright"
                  }`}
                >
                  <option value="">All countries</option>
                  {countries.map((c) => (
                    <option key={c} value={c}>
                      {countryFlag(c)} {c}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {filterGroups.map(group => (
            <div key={group.field} className="flex flex-wrap gap-2">
              {group.label && (
                <span className="font-sans text-label-sm uppercase text-on-surface-variant self-center mr-1">
                  {group.label}
                </span>
              )}
              <button
                onClick={() => setActiveFilters(prev => ({ ...prev, [group.field]: null }))}
                className={`px-4 py-2.5 font-sans text-label-sm uppercase transition-colors duration-300 ${
                  activeFilters[group.field] === null
                    ? "bg-primary text-primary-on"
                    : "bg-surface-input text-on-surface-variant hover:bg-surface-bright hover:text-on-surface"
                }`}
              >
                {group.label ? "All" : "All Styles"}
              </button>
              {group.options.map(opt => (
                <button
                  key={opt}
                  onClick={() => toggle(group.field, opt)}
                  className={`px-4 py-2.5 font-sans text-label-sm uppercase transition-colors duration-300 ${
                    activeFilters[group.field] === opt
                      ? "bg-primary text-primary-on"
                      : "bg-surface-input text-on-surface-variant hover:bg-surface-bright hover:text-on-surface"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* Grid */}
      <section className="py-16 lg:py-20 bg-bg">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {userCoords && (
            <p className="flex items-center gap-2 font-sans text-sm text-on-surface-variant mb-6">
              <MapPin size={14} className="text-primary" />
              {coordSource === "precise"
                ? "Filtered by nearest to your location"
                : `Filtered by nearest to ${ipLocation?.city ?? "your area"} (from your IP) — click the pill above to share precise location`}
            </p>
          )}
          {filtered.length > 0 ? (
            <div className={`grid ${gridCols} gap-6`}>
              {filtered.map(listing => (
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
                  distance_km={(listing as Listing & { _distance?: number | null })._distance ?? null}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="flex justify-center mb-6">
                <SlidersHorizontal size={40} className="text-outline-variant" />
              </div>
              <h3 className="font-serif text-display-sm uppercase text-on-surface mb-3">{emptyTitle}</h3>
              <p className="font-sans text-sm text-on-surface-variant max-w-sm mx-auto mb-8">
                {emptyDescription}
              </p>
              <a
                href="/submit"
                className="inline-flex px-8 py-4 bg-primary text-primary-on font-sans text-sm font-bold tracking-wide uppercase transition-opacity duration-400 hover:opacity-90"
              >
                {emptyCta}
              </a>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
