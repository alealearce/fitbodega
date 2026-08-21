import type { MetadataRoute } from "next";
import { SITE, LISTING_TYPES } from "@/lib/config/site";
import { isNetworkOpen } from "@/lib/creators/network";
import { createAdminClient } from "@/lib/supabase/server";
import { getListingUrl } from "@/lib/utils/listingUrl";

// The sitemap reads live data (published deal editions, whether the creator
// browse is open), so it must not be frozen at build time.
export const revalidate = 3600;

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
    { url: `${base}/for-brands`,                        changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/directory`,                         changeFrequency: "weekly",  priority: 0.9 },
    { url: `${base}/creators`,                          changeFrequency: "monthly", priority: 0.9 },
    ...hubRoutes,
    { url: `${base}/community`,                         changeFrequency: "daily",   priority: 0.8 },
    { url: `${base}/deals`,                             changeFrequency: "weekly",  priority: 0.9 },
    { url: `${base}/top-100`,                           changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/measure-up`,                        changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/top-100-fitness-influencers`,       changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/top-100-gyms`,                      changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/top-100-fitness-retreats`,          changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/top-100-hyrox-athletes`,            changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/top-100-online-fitness-coaches`,    changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/top-100-recovery-spaces`,           changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/top-100-run-clubs`,                 changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/top-100-health-food-stores`,        changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/top-100-nutritionists`,             changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/submit`,                            changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/about`,                             changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/privacy`,                           changeFrequency: "yearly",  priority: 0.3 },
    { url: `${base}/terms`,                             changeFrequency: "yearly",  priority: 0.3 },
  ];

  // The creator browse enters the sitemap only once it holds real profiles.
  if (await isNetworkOpen()) {
    staticRoutes.push({
      url: `${base}/creators/network`,
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  const supabase = createAdminClient();

  const [listingsRes, postsRes, digestsRes] = await Promise.all([
    supabase
      .from("listings")
      .select("slug, type, updated_at")
      .eq("status", "approved"),
    supabase
      .from("blog_posts")
      .select("slug, updated_at")
      .eq("is_published", true),
    supabase
      .from("dr_weekly_digests")
      .select("week_slug, published_at")
      .eq("status", "published"),
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

  const dealRoutes: MetadataRoute.Sitemap = (digestsRes.data ?? []).map((d) => ({
    url: `${base}/deals/${d.week_slug}`,
    lastModified: d.published_at ? new Date(d.published_at) : undefined,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...listingRoutes, ...blogRoutes, ...dealRoutes];
}
