import Link from "next/link";
import { MapPin, BadgeCheck, ArrowUpRight, Star } from "lucide-react";
import CoverImage from "@/components/ui/CoverImage";
import { getListingUrl } from "@/lib/utils/listingUrl";

interface ListingCardProps {
  id:           string;
  slug:         string;
  name:         string;
  type:         string;
  tagline?:     string;
  city?:        string;
  country?:     string;
  logo_url?:    string | null;
  images?:      string[];
  specialties?: string[];
  rating_avg?:  number | null;
  rating_count?:number | null;
  is_verified?: boolean;
  is_featured?: boolean;
  price_range?: string | null;
  variant?:     "card" | "row";
  distance_km?: number | null;
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

const TYPE_LABELS: Record<string, string> = {
  gym: "Gym", trainer: "Coach", recovery: "Recovery", club: "Club",
  nutritionist: "Nutrition", store: "Store", youth: "Youth Sports",
};

/**
 * ListingCard — "The Brutalist Sanctuary"
 * Photography is the structure: full-bleed image, legibility scrim,
 * type overlaid at the base. Sharp corners, no borders, no shadows —
 * hierarchy comes from tonal contrast alone.
 */
export default function ListingCard({
  id, slug, name, type, tagline, city, country,
  logo_url, images, specialties,
  rating_avg, rating_count,
  is_verified, is_featured, price_range, variant = "card",
  distance_km,
}: ListingCardProps) {
  const coverImage = images?.[0] ?? logo_url ?? null;
  const location   = [city, country].filter(Boolean).join(" / ");
  const typeLabel  = TYPE_LABELS[type] ?? type;

  if (variant === "row") {
    return (
      <Link
        href={getListingUrl(type, slug)}
        className="group flex items-stretch gap-5 bg-surface-card hover:bg-surface-input transition-colors duration-400"
      >
        {/* Thumbnail */}
        <div className="relative w-28 flex-shrink-0 overflow-hidden bg-surface-low">
          {coverImage ? (
            <CoverImage src={coverImage} alt={name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-400" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center font-serif text-2xl font-extrabold text-outline-variant">
              {name.charAt(0)}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 py-4 pr-5">
          <p className="font-sans text-label-sm uppercase text-on-surface-variant mb-1.5">
            {typeLabel}
            {location && <span className="text-outline-variant"> / {location}</span>}
          </p>
          <h3 className="font-serif text-lg font-extrabold uppercase tracking-tight text-on-surface group-hover:text-primary transition-colors duration-300 truncate">
            {name}
            {is_verified && <BadgeCheck size={14} className="inline-block ml-2 text-primary align-baseline" />}
          </h3>
          {specialties && specialties.length > 0 && (
            <p className="font-sans text-xs text-on-surface-variant mt-1.5 truncate">
              {specialties.slice(0, 3).join("  ·  ")}
            </p>
          )}
        </div>

        <div className="flex items-center pr-5">
          <ArrowUpRight size={18} className="text-on-surface-variant group-hover:text-primary transition-colors duration-300" />
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={getListingUrl(type, slug)}
      className="group relative block overflow-hidden bg-surface-card"
    >
      {/* Full-bleed cover */}
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-low">
        {coverImage ? (
          <CoverImage
            src={coverImage}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-[800ms]"
          />
        ) : (
          <div className="w-full h-full flex items-end p-6">
            <span className="font-serif text-7xl font-extrabold text-surface-bright select-none">
              {name.charAt(0)}
            </span>
          </div>
        )}
        {/* Legibility scrim */}
        <div className="absolute inset-0 bg-card-scrim pointer-events-none" />

        {/* Status labels — sharp, tracked, top-left */}
        <div className="absolute top-4 left-4 flex gap-2">
          {is_featured && (
            <span className="px-2.5 py-1 bg-primary text-primary-on font-sans text-label-sm uppercase">
              Featured
            </span>
          )}
          {typeof distance_km === "number" && (
            <span className="px-2.5 py-1 bg-bg/70 backdrop-blur-glass text-on-surface font-sans text-label-sm uppercase">
              {formatDistance(distance_km)}
            </span>
          )}
        </div>

        {/* Name block — overlaid on the image base */}
        <div className="absolute inset-x-0 bottom-0 p-5">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-serif text-2xl font-extrabold uppercase tracking-tight text-on-surface leading-none">
                {name}
                {is_verified && <BadgeCheck size={15} className="inline-block ml-2 text-primary" />}
              </h3>
              <p className="font-sans text-label-sm uppercase text-on-surface-variant mt-2 truncate">
                {location}
                {specialties?.[0] && <span> / {specialties[0]}</span>}
              </p>
            </div>
            {typeof rating_avg === "number" && rating_avg > 0 && (
              <span className="flex items-center gap-1 font-sans text-sm font-bold text-primary flex-shrink-0">
                <Star size={13} fill="currentColor" /> {rating_avg.toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Base strip — tonal Level 2, price + arrow */}
      <div className="flex items-center justify-between px-5 py-4">
        <div>
          <p className="font-sans text-label-sm uppercase text-on-surface-variant">
            {typeLabel}
            {rating_count ? <span className="text-outline-variant"> / {rating_count} reviews</span> : null}
          </p>
          {price_range && (
            <p className="font-sans text-sm font-bold text-on-surface mt-1">
              {price_range}
            </p>
          )}
        </div>
        <span className="w-10 h-10 flex items-center justify-center bg-surface-input group-hover:bg-primary group-hover:text-primary-on text-on-surface transition-colors duration-300">
          <ArrowUpRight size={16} />
        </span>
      </div>
    </Link>
  );
}
