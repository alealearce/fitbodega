// Canonical listing URLs are type-prefixed (e.g. /recovery/zenith-lab) —
// each hub has a [slug] route re-exporting the shared page in
// app/[locale]/listing/[slug], which remains as a fallback for unknown types.
const TYPE_PREFIXES: Record<string, string> = {
  recovery:     "/recovery",
  gym:          "/gyms",
  trainer:      "/trainers",
  club:         "/clubs",
  nutritionist: "/nutritionists",
  store:        "/health-food-stores",
  youth:        "/youth-sports",
};

export function getListingUrl(type: string, slug: string): string {
  return `${TYPE_PREFIXES[type] ?? "/listing"}/${slug}`;
}
