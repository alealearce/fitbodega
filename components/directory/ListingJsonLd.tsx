import { SITE, LISTING_TYPES } from "@/lib/config/site";
import { getListingUrl } from "@/lib/utils/listingUrl";
import type { Listing, Review } from "@/lib/supabase/types";

// Keep in sync with CategoryJsonLd.tsx — one schema.org type per listing type.
const SCHEMA_TYPE: Record<string, string> = {
  gym:          "ExerciseGym",
  recovery:     "HealthClub",
  trainer:      "Person",
  nutritionist: "LocalBusiness",
  store:        "Store",
  youth:        "SportsActivityLocation",
};

// Breadcrumb hub names + canonical hub URLs (mirror the HUBS map on the
// listing page — always the canonical hub, e.g. /gyms, /recovery).
const HUBS: Record<string, { url: string; name: string }> = Object.fromEntries(
  LISTING_TYPES.map(t => [t.id, { url: `/${t.slug}`, name: t.label }])
);

interface Props {
  listing: Listing;
  /** Approved reviews actually rendered on the page — drives AggregateRating. */
  reviews: Review[];
}

export default function ListingJsonLd({ listing, reviews }: Props) {
  const canonical = `${SITE.url}${getListingUrl(listing.type, listing.slug)}`;
  const hub = HUBS[listing.type] ?? HUBS.gym;

  const entity: Record<string, unknown> = {
    "@type": SCHEMA_TYPE[listing.type] ?? "LocalBusiness",
    name: listing.name,
    url: canonical,
  };

  const description = listing.description ?? listing.tagline;
  if (description) entity.description = description.slice(0, 500);

  const image = listing.images?.[0] ?? listing.logo_url;
  if (image) entity.image = image;

  if (listing.address || listing.city || listing.country) {
    entity.address = {
      "@type": "PostalAddress",
      ...(listing.address ? { streetAddress: listing.address } : {}),
      ...(listing.city ? { addressLocality: listing.city } : {}),
      ...(listing.country ? { addressCountry: listing.country } : {}),
    };
  }

  if (typeof listing.latitude === "number" && typeof listing.longitude === "number") {
    entity.geo = {
      "@type": "GeoCoordinates",
      latitude: listing.latitude,
      longitude: listing.longitude,
    };
  }

  if (listing.phone) entity.telephone = listing.phone;
  if (listing.price_range) entity.priceRange = listing.price_range;

  const sameAs = [
    listing.website,
    listing.social_instagram,
    listing.social_facebook,
    listing.social_youtube,
  ].filter(Boolean) as string[];
  if (sameAs.length > 0) entity.sameAs = sameAs;

  // AggregateRating only from real, rendered reviews — never fabricated.
  if (reviews.length > 0) {
    const avg =
      reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    entity.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: Math.round(avg * 10) / 10,
      reviewCount: reviews.length,
      bestRating: 5,
      worstRating: 1,
    };
  }

  const entityJson = {
    "@context": "https://schema.org",
    ...entity,
  };

  const breadcrumbJson = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE.url },
      { "@type": "ListItem", position: 2, name: hub.name, item: `${SITE.url}${hub.url}` },
      { "@type": "ListItem", position: 3, name: listing.name, item: canonical },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(entityJson) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJson) }}
      />
    </>
  );
}
