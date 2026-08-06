// Claimed-state lookups for the FitBodega 100 — server-side only.
import { createAdminClient } from "@/lib/supabase/server";
import { getListingUrl } from "@/lib/utils/listingUrl";
import type { ClaimedMap } from "@/components/top100/Ledger";
import type { ClaimableListId } from "./registry";

// Map of entry name → claimed profile info for one list. Only approved
// claims on approved listings light up in the ledger.
export async function getClaimedMap(list: ClaimableListId): Promise<ClaimedMap> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("top100_claims")
    .select("entry_name, listings!inner(slug, type, status, logo_url, images)")
    .eq("list_id", list)
    .eq("status", "approved")
    .eq("listings.status", "approved");

  if (error) {
    console.error("[top100/claims] claimed map query failed:", error.message);
    return {};
  }

  const map: ClaimedMap = {};
  for (const row of data ?? []) {
    const listing = row.listings as unknown as {
      slug: string;
      type: string;
      logo_url: string | null;
      images: string[] | null;
    };
    map[row.entry_name] = {
      url: getListingUrl(listing.type, listing.slug),
      image: listing.logo_url ?? listing.images?.[0] ?? null,
    };
  }
  return map;
}
