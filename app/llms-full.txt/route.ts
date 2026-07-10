import { SITE, LISTING_TYPES } from '@/lib/config/site';
import { createAdminClient } from '@/lib/supabase/server';
import { getListingUrl } from '@/lib/utils/listingUrl';

const BASE = SITE.url;
const MAX_PER_TYPE = 200;
const MAX_DESC_CHARS = 240;

const TYPE_PREFIXES: Record<string, string> = {
  recovery:     '/recovery',
  gym:          '/gyms',
  trainer:      '/trainers',
  club:         '/clubs',
  nutritionist: '/nutritionists',
  store:        '/health-food-stores',
  youth:        '/youth-sports',
};

type Row = {
  name: string;
  slug: string;
  type: string;
  city: string | null;
  country: string | null;
  description: string | null;
  website: string | null;
  specialties: string[] | null;
  is_featured: boolean | null;
  is_verified: boolean | null;
};

export const revalidate = 3600;

function trim(d: string | null): string {
  if (!d) return '';
  const s = d.replace(/\s+/g, ' ').trim();
  return s.length <= MAX_DESC_CHARS ? s : s.slice(0, MAX_DESC_CHARS - 1).trimEnd() + '…';
}

export async function GET() {
  let totalCount = 0;
  const byType: Record<string, Row[]> = {};

  try {
    const supabase = createAdminClient();
    const { data, count } = await supabase
      .from('listings')
      .select(
        'name, slug, type, city, country, description, website, specialties, is_featured, is_verified',
        { count: 'exact' },
      )
      .eq('status', 'approved')
      .order('is_featured', { ascending: false })
      .order('is_verified', { ascending: false })
      .order('name', { ascending: true })
      .limit(MAX_PER_TYPE * LISTING_TYPES.length);

    totalCount = count ?? 0;

    for (const row of (data ?? []) as Row[]) {
      (byType[row.type] ??= []).push(row);
    }
  } catch {
    // If Supabase is unreachable, return header-only document.
  }

  const lines: string[] = [];
  lines.push(`# ${SITE.name} — Full Index`);
  lines.push('');
  lines.push(`> ${SITE.description}`);
  lines.push('');
  lines.push(
    `Machine-readable index of all approved listings on ${SITE.name}. Canonical pages: ${BASE}. Sitemap: ${BASE}/sitemap.xml. Updated hourly.`,
  );
  lines.push('');

  for (const t of LISTING_TYPES) {
    const rows = (byType[t.id] ?? []).slice(0, MAX_PER_TYPE);
    const prefix = TYPE_PREFIXES[t.id];
    lines.push(`## ${t.label}`);
    lines.push('');
    lines.push(`Category index: ${BASE}${prefix}.`);
    lines.push('');

    if (rows.length === 0) {
      lines.push('_No active listings yet._');
      lines.push('');
      continue;
    }

    for (const r of rows) {
      const url = `${BASE}${getListingUrl(r.type, r.slug)}`;
      const loc = [r.city, r.country].filter(Boolean).join(', ');
      const badges = [
        r.is_featured ? 'Featured' : null,
        r.is_verified ? 'Verified' : null,
      ].filter(Boolean).join(' · ');
      const specialties = r.specialties?.length ? r.specialties.slice(0, 6).join(', ') : '';
      const meta = [loc, badges, specialties && `Specialties: ${specialties}`].filter(Boolean).join(' — ');
      const desc = trim(r.description);
      const website = r.website ? ` (website: ${r.website})` : '';
      lines.push(`- **[${r.name}](${url})**${meta ? ` — ${meta}` : ''}${desc ? ` — ${desc}` : ''}${website}`);
    }

    const remaining = (byType[t.id]?.length ?? 0) - rows.length;
    if (remaining > 0) {
      lines.push('');
      lines.push(`_${remaining} more in this category — see ${BASE}${prefix} for the full list._`);
    }
    lines.push('');
  }

  lines.push('## Notes');
  lines.push('');
  lines.push(`- Total approved listings indexed: ${totalCount}.`);
  lines.push(`- Per-type cap in this document: ${MAX_PER_TYPE}. For the complete list, see ${BASE}/sitemap.xml.`);
  lines.push(`- Contact: ${SITE.supportEmail}`);
  lines.push('');

  return new Response(lines.join('\n'), {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=3600',
    },
  });
}
