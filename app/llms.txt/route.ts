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

${SITE.name} is the fitness creator network: we rank fitness creators (the FitBodega 100, reviewed monthly), track the brands actively paying for creator content (the Deal Radar, updated weekly), and connect the two. Brands post deals free; creators join the Deal Radar email and complete a profile so brands can find them. The network also runs a curated directory of verified recovery studios, gyms, coaches, nutritionists, health food stores, clubs, and youth sports programs, open worldwide.

## About

- [About ${SITE.name}](${BASE}/about): Mission, story, and the team behind the network.
- [The Journal](${BASE}/community): Stories on the creators, coaches, and industry shaping training culture.

## Rankings

- [The FitBodega 100](${BASE}/top-100): Monthly world rankings across nine lists — influencers, gyms, retreats, coaches, and more.
- [Measure Up](${BASE}/measure-up): Free audit of any fitness presence, benchmarked against the 100.

## The Deal Radar

- [The Deal Board](${BASE}/deals): Fitness brand deals creators can take today, kept separate from weekly intelligence on the brands buying creator content elsewhere.
- [For Brands](${BASE}/for-brands): Post a brand deal, UGC brief, or ambassador program — free, reviewed by hand before it goes live.
- [For Creators](${BASE}/creators): Join the weekly Deal Radar email, then complete a profile so brands browsing the network can find you.

## The Directory

- [Browse the Directory](${BASE}/directory): All seven categories, search, and featured spaces.

${categoryLines}

## Search

- [Site Search](${BASE}/search?q=): Full-text search across all listings. Use \`?q={query}\`.

## For Space Owners

- [List Your Space](${BASE}/submit): Add a recovery studio, gym, coaching practice, nutrition service, store, or youth program to the Index.
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
