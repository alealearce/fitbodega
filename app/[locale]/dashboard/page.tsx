import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Listing } from "@/lib/supabase/types";
import Badge from "@/components/ui/Badge";
import { getListingUrl } from "@/lib/utils/listingUrl";
import { SITE } from "@/lib/config/site";
import FMark from "@/components/ui/FMark";

export const metadata = {
  title: `My Dashboard — ${SITE.name}`,
  robots: { index: false },
};

function statusVariant(status: Listing["status"]) {
  if (status === "approved") return "approved";
  if (status === "rejected") return "rejected";
  return "pending";
}

function statusLabel(status: Listing["status"]) {
  if (status === "approved") return "Live";
  if (status === "rejected") return "Rejected";
  return "Pending Review";
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/dashboard");

  const { data: listings } = await supabase
    .from("listings")
    .select("id, name, slug, type, status, view_count, rating_avg, rating_count, is_featured, is_verified, plan")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  const items = (listings ?? []) as Pick<
    Listing,
    "id" | "name" | "slug" | "type" | "status" | "view_count" | "rating_avg" | "rating_count" | "is_featured" | "is_verified" | "plan"
  >[];

  return (
    <div className="min-h-screen bg-bg px-6 py-16">
      <div className="max-w-4xl mx-auto">

        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
          <div>
            <h1 className="font-serif text-display-sm uppercase text-on-surface">
              My Listings
            </h1>
            <p className="font-sans text-sm text-on-surface-variant mt-1">
              Manage your spaces and profiles
            </p>
          </div>
          <Link
            href="/submit"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-on font-sans text-sm font-bold uppercase tracking-wide transition-opacity duration-300 hover:opacity-90 whitespace-nowrap"
          >
            + Submit New Listing
          </Link>
        </div>

        {/* Empty state */}
        {items.length === 0 && (
          <div className="bg-surface-card p-12 text-center">
            <FMark className="inline-block h-9 w-8 text-primary mb-5" />
            <h2 className="font-serif text-xl uppercase font-extrabold text-on-surface mb-3">
              You haven&apos;t listed a space yet
            </h2>
            <p className="font-sans text-sm text-on-surface-variant mb-8 max-w-sm mx-auto">
              Share your recovery studio, gym, coaching practice, or nutrition
              service with the network.
            </p>
            <Link
              href="/submit"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-primary text-primary-on font-sans text-sm font-bold uppercase tracking-wide transition-opacity duration-300 hover:opacity-90"
            >
              Submit Your Listing
            </Link>
          </div>
        )}

        {/* Listings */}
        {items.length > 0 && (
          <div className="space-y-4">
            {items.map((listing) => (
              <div
                key={listing.id}
                className="bg-surface-card rounded-2xl shadow-card p-6 flex flex-col sm:flex-row sm:items-center gap-4"
              >
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h2 className="font-serif text-lg text-on-surface truncate">
                      {listing.name}
                    </h2>
                    <Badge variant={statusVariant(listing.status)}>
                      {statusLabel(listing.status)}
                    </Badge>
                    {listing.is_verified && (
                      <Badge variant="verified">Verified</Badge>
                    )}
                    {listing.is_featured && (
                      <Badge variant="featured">Featured</Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-4 mt-2">
                    <span className="font-sans text-xs text-on-surface-variant capitalize">
                      {listing.type}
                    </span>
                    <span className="font-sans text-xs text-on-surface-variant">
                      {listing.view_count ?? 0} views
                    </span>
                    {listing.rating_count > 0 && (
                      <span className="font-sans text-xs text-on-surface-variant">
                        {listing.rating_avg.toFixed(1)} ★ ({listing.rating_count})
                      </span>
                    )}
                    <span className="font-sans text-xs text-on-surface-variant capitalize">
                      Plan: {listing.plan}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  {listing.status === "approved" && (
                    <Link
                      href={getListingUrl(listing.type, listing.slug)}
                      className="font-sans text-sm font-semibold text-primary hover:underline"
                    >
                      View
                    </Link>
                  )}
                  <Link
                    href={`/dashboard/story/${listing.slug}`}
                    className="inline-flex items-center justify-center px-5 py-2 rounded-full font-sans text-sm font-semibold bg-secondary-container text-primary hover:bg-secondary-container/80 transition-all duration-300"
                  >
                    Spotlight
                  </Link>
                  <Link
                    href={`/dashboard/edit/${listing.slug}`}
                    className="inline-flex items-center justify-center px-5 py-2 rounded-full font-sans text-sm font-semibold bg-secondary-container text-primary hover:bg-secondary-container/80 transition-all duration-300"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Account footer */}
        <div className="mt-12 pt-8 border-t border-outline-variant/20 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
          <p className="font-sans text-sm text-on-surface-variant">
            Signed in as{" "}
            <span className="text-on-surface font-semibold">{user.email}</span>
          </p>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="font-sans text-sm text-on-surface-variant hover:text-on-surface transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
