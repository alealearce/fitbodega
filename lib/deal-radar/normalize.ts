// Normalizer: RawOpportunity -> dr_opportunities rows. Dedupe on
// brand_domain (or slugged name) + offer fingerprint; a brand seen by
// several sources keeps one row and gets a score boost.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { DealRadarConfig } from './config';
import { MULTI_SOURCE_BOOST } from './config';
import type { DrScoringWeights, RawOpportunity } from './types';

export function normalizeDomain(url: string | null): string | null {
  if (!url) return null;
  try {
    const host = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
    return host.toLowerCase().replace(/^www\./, '');
  } catch {
    return null;
  }
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function fingerprintOf(raw: RawOpportunity): string {
  const brandKey = normalizeDomain(raw.brandUrl) ?? slug(raw.brandName);
  // Offer fingerprint: type + first words of deliverables keeps re-posts of
  // the same offer deduped while distinct offers from one brand stay apart.
  const offerKey = [
    raw.sourceType,
    raw.offerType,
    slug((raw.deliverables ?? '').slice(0, 40)),
  ].join(':');
  return `${brandKey}|${offerKey}`;
}

export function scoreOpportunity(
  raw: RawOpportunity,
  weights: DrScoringWeights,
  keywords: string[]
): { score: number; breakdown: Record<string, number> } {
  const breakdown: Record<string, number> = {};

  const w = weights;
  breakdown.active_ad_count = raw.activeAdCount
    ? Math.min(w.active_ad_count.max_points, Math.floor(raw.activeAdCount * w.active_ad_count.per_ad))
    : 0;

  if (raw.postedAt) {
    const days = Math.max(0, (Date.now() - new Date(raw.postedAt).getTime()) / 86_400_000);
    const { max_points, full_points_days, zero_points_days } = w.recency;
    breakdown.recency = days <= full_points_days
      ? max_points
      : days >= zero_points_days
        ? 0
        : Math.round(max_points * (zero_points_days - days) / (zero_points_days - full_points_days));
  } else {
    breakdown.recency = 0;
  }

  breakdown.compensation_listed = raw.compensationText ? w.compensation_listed.points : 0;

  const haystack = [raw.brandName, raw.deliverables, raw.compensationText, JSON.stringify(raw.meta)]
    .join(' ')
    .toLowerCase();
  const matches = keywords.filter((k) => haystack.includes(k.toLowerCase())).length;
  breakdown.niche_match = Math.min(w.niche_match.max_points, matches * w.niche_match.per_keyword);

  const score = Math.min(100, Object.values(breakdown).reduce((a, b) => a + b, 0));
  return { score, breakdown };
}

// Upsert raw opportunities into dr_opportunities for a given week. Returns
// counts for the run report.
export async function normalizeAndStore(
  supabase: SupabaseClient,
  raws: RawOpportunity[],
  config: DealRadarConfig,
  weekId: string
): Promise<{ inserted: number; updated: number; boosted: number }> {
  let inserted = 0;
  let updated = 0;
  let boosted = 0;
  const now = new Date().toISOString();

  for (const raw of raws) {
    const fingerprint = fingerprintOf(raw);
    const { score, breakdown } = scoreOpportunity(raw, config.weights, config.keywords);

    const { data: existing } = await supabase
      .from('dr_opportunities')
      .select('id, source, score, score_breakdown, meta')
      .eq('fingerprint', fingerprint)
      .maybeSingle();

    if (existing) {
      // Same offer seen again. A different source means independent
      // confirmation: boost instead of duplicating.
      const crossSource = existing.source !== raw.source;
      const newBreakdown = { ...breakdown } as Record<string, number>;
      let newScore = score;
      if (crossSource) {
        newBreakdown.multi_source = MULTI_SOURCE_BOOST;
        newScore = Math.min(100, score + MULTI_SOURCE_BOOST);
        boosted++;
      }
      await supabase
        .from('dr_opportunities')
        .update({
          last_seen_at: now,
          week_id: weekId,
          score: Math.max(existing.score as number, newScore),
          score_breakdown: newBreakdown,
          active_ad_count: raw.activeAdCount,
          meta: { ...(existing.meta as Record<string, unknown>), ...raw.meta },
        })
        .eq('id', existing.id);
      updated++;
    } else {
      await supabase.from('dr_opportunities').insert({
        brand_name: raw.brandName,
        brand_domain: normalizeDomain(raw.brandUrl),
        source_type: raw.sourceType,
        source: raw.source,
        source_url: raw.sourceUrl,
        offer_type: raw.offerType,
        compensation_text: raw.compensationText,
        deliverables: raw.deliverables,
        platforms: raw.platforms,
        active_ad_count: raw.activeAdCount,
        meta: raw.meta,
        fingerprint,
        score,
        score_breakdown: breakdown,
        first_seen_at: now,
        last_seen_at: now,
        status: 'new',
        week_id: weekId,
      });
      inserted++;
    }
  }

  return { inserted, updated, boosted };
}
