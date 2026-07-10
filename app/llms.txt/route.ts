import { SITE, LISTING_TYPES } from '@/lib/config/site';

const BASE = SITE.url;

const TYPE_PREFIXES: Record<string, string> = {
  recovery:     '/recovery',
  gym:          '/gyms',
  trainer:      '/trainers',
  club:         '/clubs',
  nutritionist: '/nutritionists',
  store:        '/health-food-stores',
  youth:        '/youth-sports',
};

export const revalidate = 86400;

export async function GET() {
  const categoryLines = LISTING_TYPES.map(
    (t) => `- [${t.label}](${BASE}${TYPE_PREFIXES[t.id]}): Verified ${t.label.toLowerCase()} listed on ${SITE.name}.`,
  ).join('\n');

  const body = `# ${SITE.name}

> ${SITE.description}

${SITE.name} is a curated directory connecting people with verified recovery studios, gyms, coaches, nutritionists, health food stores, and youth sports programs — starting in Vancouver, open worldwide. Every listing includes contact details, location, specialties, and (where supplied) imagery and reviews.

## About

- [About ${SITE.name}](${BASE}/about): Mission, story, and how listings are verified.
- [The Journal](${BASE}/community): Training, recovery, and nutrition articles.

## Browse the Network

${categoryLines}

## Search

- [Site Search](${BASE}/search?q=): Full-text search across all listings. Use \`?q={query}\`.

## For Space Owners

- [List Your Space](${BASE}/submit): Add a recovery studio, gym, coaching practice, nutrition service, store, or youth program.
- [Sign in](${BASE}/login): Manage your listings.

## API / Agent Access

A machine-readable index of all approved listings is available at [${BASE}/llms-full.txt](${BASE}/llms-full.txt). XML sitemap: [${BASE}/sitemap.xml](${BASE}/sitemap.xml).

For automated access requests or data partnerships, contact ${SITE.supportEmail}.

## Contact

- Email: ${SITE.supportEmail}
- Web: ${BASE}
`;

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=86400, stale-while-revalidate=86400',
    },
  });
}
