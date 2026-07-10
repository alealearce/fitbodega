import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import type { Listing, Review } from "@/lib/supabase/types";
import { MapPin, Globe, Mail, Phone, BadgeCheck, Star, Instagram, Facebook, Youtube, ArrowLeft } from "lucide-react";
import { SITE, DEFAULT_OG_IMAGE, LISTING_TYPES } from "@/lib/config/site";
import { getListingUrl } from "@/lib/utils/listingUrl";
import CoverImage from "@/components/ui/CoverImage";
import ReviewForm from "@/components/reviews/ReviewForm";
import ListingJsonLd from "@/components/directory/ListingJsonLd";

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase  = await createClient();

  const { data } = await supabase
    .from("listings")
    .select("name, description, tagline, images, city, country, type")
    .eq("slug", slug)
    .single();

  if (!data) return { title: "Listing Not Found" };

  const location = [data.city, data.country].filter(Boolean).join(", ");
  const canonical = `${SITE.url}${getListingUrl(data.type, slug)}`;

  return {
    title: data.name,
    description: data.tagline ?? data.description ?? `${data.name} — ${SITE.name}`,
    alternates: { canonical },
    openGraph: {
      title: `${data.name}${location ? ` — ${location}` : ""}`,
      description: data.tagline ?? data.description ?? "",
      url: canonical,
      images: data.images?.[0] ? [{ url: data.images[0] }] : [DEFAULT_OG_IMAGE],
    },
  };
}

// Listing-type label + canonical hub, derived from the single source of
// truth in lib/config/site.ts — no hardcoded yoga-era maps.
const TYPE_META: Record<string, { label: string; hubUrl: string; hubLabel: string }> =
  Object.fromEntries(
    LISTING_TYPES.map(t => [t.id, { label: t.label, hubUrl: `/${t.slug}`, hubLabel: `Browse all ${t.label}` }])
  );

export default async function ListingPage({ params }: Props) {
  const { slug } = await params;
  const supabase  = await createClient();

  const [listingRes, reviewsRes] = await Promise.all([
    supabase
      .from("listings")
      .select("*")
      .eq("slug", slug)
      .eq("status", "approved")
      .single(),
    supabase
      .from("reviews")
      .select("*")
      .eq("is_approved", true)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const listing: Listing | null = listingRes.data;
  if (!listing) notFound();

  // Filter reviews for this listing
  const allReviews: Review[] = reviewsRes.data ?? [];
  const reviews = allReviews.filter(r => r.listing_id === listing.id);

  const location   = [listing.city, listing.country].filter(Boolean).join(", ");
  const coverImage = listing.images?.[0] ?? listing.logo_url ?? null;
  const meta       = TYPE_META[listing.type] ?? TYPE_META.gym;

  return (
    <>
      <ListingJsonLd listing={listing} reviews={reviews} />

      {/* Hero — full-bleed cover, name overlaid at the base like an athlete
          or space profile. No container chrome. */}
      <div className="relative w-full bg-surface-low" style={{ height: "clamp(320px, 52vw, 620px)" }}>
        {coverImage ? (
          <CoverImage src={coverImage} alt={listing.name} className="absolute inset-0 w-full h-full object-cover" priority />
        ) : (
          <div className="absolute inset-0 flex items-end justify-start p-8">
            <span className="font-serif text-[10rem] leading-none font-extrabold text-surface-bright select-none">
              {listing.name.charAt(0)}
            </span>
          </div>
        )}
        {/* Legibility scrim */}
        <div className="absolute inset-0 bg-card-scrim pointer-events-none" />

        {/* Status labels — top-left */}
        <div className="absolute top-24 left-6 lg:left-8 flex flex-wrap gap-2">
          <span className="px-2.5 py-1 bg-surface-input text-on-surface font-sans text-label-sm uppercase">
            {meta.label}
          </span>
          {listing.is_verified && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-bg/70 backdrop-blur-glass text-primary font-sans text-label-sm uppercase">
              <BadgeCheck size={12} /> Verified
            </span>
          )}
          {listing.is_featured && (
            <span className="px-2.5 py-1 bg-primary text-primary-on font-sans text-label-sm uppercase">
              Featured
            </span>
          )}
        </div>

        {/* Name block — overlaid at the base */}
        <div className="absolute inset-x-0 bottom-0 px-6 lg:px-8 pb-8 lg:pb-12">
          <div className="max-w-7xl mx-auto">
            <h1 className="font-serif text-display-lg lg:text-display-xl uppercase text-on-surface leading-none">
              {listing.name}
            </h1>
            {(location || listing.address) && (
              <p className="flex items-center gap-2 font-sans text-label-md uppercase text-on-surface-variant mt-4">
                <MapPin size={14} className="text-primary flex-shrink-0" />
                {listing.address && location ? `${listing.address} / ${location}` : (listing.address || location)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid lg:grid-cols-3 gap-16">

          {/* Main */}
          <div className="lg:col-span-2 space-y-14">
            {listing.tagline && (
              <p className="font-sans text-xl text-on-surface leading-relaxed max-w-2xl">
                {listing.tagline}
              </p>
            )}

            {/* Specialties */}
            {listing.specialties?.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <span className="w-7 h-[3px] bg-primary" aria-hidden />
                  <p className="font-sans text-label-md uppercase text-primary">Specialties</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {listing.specialties.map(style => (
                    <span
                      key={style}
                      className="px-4 py-2.5 bg-surface-input text-on-surface font-sans text-label-sm uppercase"
                    >
                      {style}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {(listing.long_description || listing.description) && (
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <span className="w-7 h-[3px] bg-primary" aria-hidden />
                  <p className="font-sans text-label-md uppercase text-primary">About</p>
                </div>
                <div className="max-w-none text-on-surface-variant leading-relaxed font-sans text-base">
                  {(listing.long_description ?? listing.description ?? "")
                    .split("\n\n")
                    .map((para, i) => (
                      <p key={i} className="mb-4">
                        {para}
                      </p>
                    ))}
                </div>
              </div>
            )}

            {/* Experience & Languages — stat rows, no boxes */}
            {(listing.experience_levels?.length > 0 || listing.languages?.length > 0) && (
              <div className="grid sm:grid-cols-2 gap-10">
                {listing.experience_levels?.length > 0 && (
                  <div>
                    <p className="font-sans text-label-sm uppercase text-on-surface-variant mb-3">
                      Levels
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {listing.experience_levels.map(level => (
                        <span key={level} className="px-3 py-1.5 bg-surface-low text-on-surface-variant font-sans text-xs uppercase">
                          {level}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {listing.languages?.length > 0 && (
                  <div>
                    <p className="font-sans text-label-sm uppercase text-on-surface-variant mb-3">
                      Languages
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {listing.languages.map(lang => (
                        <span key={lang} className="px-3 py-1.5 bg-surface-low text-on-surface-variant font-sans text-xs uppercase">
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Reviews */}
            {reviews.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <span className="w-7 h-[3px] bg-primary" aria-hidden />
                  <p className="font-sans text-label-md uppercase text-primary">Reviews</p>
                </div>
                <div className="space-y-6">
                  {reviews.map(review => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
              </div>
            )}

            {/* Review Form */}
            <ReviewForm listingId={listing.id} listingName={listing.name} />
          </div>

          {/* Sidebar — flat tonal blocks, generous whitespace, no nested boxes */}
          <div className="space-y-10">
            {/* Contact */}
            {(listing.website || listing.email || listing.phone) && (
              <div className="space-y-3">
                <p className="font-sans text-label-sm uppercase text-on-surface-variant mb-1">
                  Get In Touch
                </p>

                {listing.website && (
                  <a
                    href={listing.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 w-full px-5 py-4 bg-primary text-primary-on font-sans text-sm font-bold tracking-wide uppercase transition-opacity duration-400 hover:opacity-90"
                  >
                    <Globe size={14} />
                    Visit Website
                  </a>
                )}

                {listing.email && (
                  <a
                    href={`mailto:${listing.email}`}
                    className="flex items-center gap-3 w-full px-5 py-4 bg-surface-input text-on-surface font-sans text-sm font-bold tracking-wide uppercase hover:bg-surface-bright transition-colors duration-300"
                  >
                    <Mail size={14} />
                    Send Email
                  </a>
                )}

                {listing.phone && (
                  <a
                    href={`tel:${listing.phone}`}
                    className="flex items-center gap-3 w-full px-5 py-4 bg-surface-low text-on-surface-variant font-sans text-sm font-bold tracking-wide uppercase hover:bg-surface-input hover:text-on-surface transition-colors duration-300"
                  >
                    <Phone size={14} />
                    {listing.phone}
                  </a>
                )}
              </div>
            )}

            {/* Details */}
            {(listing.address || location || listing.price_range) && (
              <div className="space-y-5">
                <p className="font-sans text-label-sm uppercase text-on-surface-variant">
                  Details
                </p>

                {listing.address && (
                  <div>
                    <p className="font-sans text-label-sm uppercase text-outline-variant mb-1">Address</p>
                    <p className="font-sans text-sm text-on-surface">{listing.address}</p>
                  </div>
                )}

                {location && (
                  <div>
                    <p className="font-sans text-label-sm uppercase text-outline-variant mb-1">Location</p>
                    <p className="font-sans text-sm text-on-surface">{location}</p>
                  </div>
                )}

                {listing.price_range && (
                  <div>
                    <p className="font-sans text-label-sm uppercase text-outline-variant mb-1">Price Range</p>
                    <p className="font-sans text-sm text-on-surface">{listing.price_range}</p>
                  </div>
                )}
              </div>
            )}

            {/* Claim — only when the listing is unowned */}
            {!listing.owner_id && (
              <div className="bg-surface-low p-6 space-y-3">
                <p className="font-sans text-sm font-bold uppercase tracking-wide text-on-surface">
                  Is this your listing?
                </p>
                <p className="font-sans text-xs text-on-surface-variant leading-relaxed">
                  Claim it to manage details, add photos, and get verified in the network.
                </p>
                <Link
                  href={`/claim/${listing.slug}`}
                  className="inline-flex items-center justify-center w-full px-5 py-3 font-sans text-xs font-bold uppercase tracking-wide text-on-surface bg-transparent hover:bg-surface-input transition-colors duration-300"
                  style={{ boxShadow: "inset 0 0 0 1px rgba(72,72,71,0.3)" }}
                >
                  Claim this listing
                </Link>
              </div>
            )}

            {/* Social */}
            {(listing.social_instagram || listing.social_facebook || listing.social_youtube || listing.social_tiktok) && (
              <div className="space-y-4">
                <p className="font-sans text-label-sm uppercase text-on-surface-variant">
                  Follow Along
                </p>
                <div className="flex gap-2">
                  {listing.social_instagram && (
                    <a
                      href={listing.social_instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-11 h-11 bg-surface-input text-on-surface-variant hover:text-primary hover:bg-surface-bright transition-colors duration-300"
                    >
                      <Instagram size={16} />
                    </a>
                  )}
                  {listing.social_facebook && (
                    <a
                      href={listing.social_facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-11 h-11 bg-surface-input text-on-surface-variant hover:text-primary hover:bg-surface-bright transition-colors duration-300"
                    >
                      <Facebook size={16} />
                    </a>
                  )}
                  {listing.social_youtube && (
                    <a
                      href={listing.social_youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-11 h-11 bg-surface-input text-on-surface-variant hover:text-primary hover:bg-surface-bright transition-colors duration-300"
                    >
                      <Youtube size={16} />
                    </a>
                  )}
                  {listing.social_tiktok && (
                    <a
                      href={listing.social_tiktok}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="TikTok"
                      className="flex items-center justify-center w-11 h-11 bg-surface-input text-on-surface-variant hover:text-primary hover:bg-surface-bright transition-colors duration-300"
                    >
                      <TikTokIcon size={16} />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Back link — canonical hub URL + keyword-rich anchor text */}
            <Link
              href={meta.hubUrl}
              className="flex items-center justify-center gap-2 w-full py-4 font-sans text-label-sm uppercase text-on-surface-variant hover:text-on-surface bg-surface-low hover:bg-surface-input transition-colors duration-300"
            >
              <ArrowLeft size={14} />
              {meta.hubLabel}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="bg-surface-low p-5">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <p className="font-sans text-sm font-bold text-on-surface">
            {review.user_name}
          </p>
          <p className="font-sans text-xs text-on-surface-variant">
            {new Date(review.created_at).toLocaleDateString("en-US", {
              year: "numeric", month: "long", day: "numeric",
            })}
          </p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              size={12}
              className={i < review.rating
                ? "text-primary fill-primary"
                : "text-outline-variant"
              }
            />
          ))}
        </div>
      </div>
      <p className="font-sans text-sm text-on-surface-variant leading-relaxed">
        {review.body}
      </p>
    </div>
  );
}

// TikTok glyph — lucide-react carries no TikTok icon, so this is a minimal
// inline SVG matching lucide's 16px sizing and stroke-free brand style.
function TikTokIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}
