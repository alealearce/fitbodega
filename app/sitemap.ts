import type { MetadataRoute } from "next";
import { SITE, LISTING_TYPES } from "@/lib/config/site";
import { createAdminClient } from "@/lib/supabase/server";
import { getListingUrl } from "@/lib/utils/listingUrl";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE.url;

  // Hub routes are derived from LISTING_TYPES so a new listing type never
  // silently falls out of the sitemap.
  const hubRoutes: MetadataRoute.Sitemap = LISTING_TYPES.map((t) => ({
    url: `${base}/${t.slug}`,
    changeFrequency: "daily",
    priority: 0.9,
  }));

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base,                                        changeFrequency: "weekly",  priority: 1.0 },
    ...hubRoutes,
    { url: `${base}/community`,                         changeFrequency: "daily",   priority: 0.8 },
    { url: `${base}/submit`,                            changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/about`,                             changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/privacy`,                           changeFrequency: "yearly",  priority: 0.3 },
    { url: `${base}/terms`,                             changeFrequency: "yearly",  priority: 0.3 },
  ];

  const supabase = createAdminClient();

  const [listingsRes, postsRes] = await Promise.all([
    supabase
      .from("listings")
      .select("slug, type, updated_at")
      .eq("status", "approved"),
    supabase
      .from("blog_posts")
      .select("slug, updated_at")
      .eq("is_published", true),
  ]);

  const listingRoutes: MetadataRoute.Sitemap = (listingsRes.data ?? []).map((l) => ({
    url: `${base}${getListingUrl(l.type, l.slug)}`,
    lastModified: new Date(l.updated_at),
    changeFrequency: "monthly",
    // Lower than the category/About hubs (0.9) so Google treats those as the
    // primary entry points; individual listings remain indexable but secondary.
    priority: 0.5,
  }));

  const blogRoutes: MetadataRoute.Sitemap = (postsRes.data ?? []).map((p) => ({
    url: `${base}/${p.slug}`,
    lastModified: new Date(p.updated_at),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...listingRoutes, ...blogRoutes];
}
