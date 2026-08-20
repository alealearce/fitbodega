// Deal Radar — config loading. Runtime values live in dr_source_configs so
// tuning needs no deploy; these constants are the fallback when a row is
// missing. The multi-source boost applies when the same brand shows up in
// more than one source.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { DrScoringWeights, DrSourceToggles } from './types';

export const DEFAULT_KEYWORDS = [
  'pre-workout', 'protein', 'activewear', 'fitness app', 'supplement',
  'creatine', 'gym wear', 'recovery', 'wearable',
];

export const DEFAULT_WEIGHTS: DrScoringWeights = {
  active_ad_count: { max_points: 35, per_ad: 5 },
  recency: { max_points: 25, full_points_days: 7, zero_points_days: 30 },
  compensation_listed: { points: 20 },
  niche_match: { max_points: 20, per_keyword: 10 },
};

export const DEFAULT_SOURCES: DrSourceToggles = {
  pitchlo: true,
  casting_boards: true,
  spend_signals: true,
  ad_library: false,
  research: false, // ingest-only, never a fetcher
  brand_direct: false, // marketplace submissions, never a fetcher
};

export const MULTI_SOURCE_BOOST = 10;

export interface DealRadarConfig {
  keywords: string[];
  weights: DrScoringWeights;
  sources: DrSourceToggles;
}

export async function loadConfig(supabase: SupabaseClient): Promise<DealRadarConfig> {
  const { data } = await supabase.from('dr_source_configs').select('key, value');
  const rows = new Map((data ?? []).map((r: { key: string; value: unknown }) => [r.key, r.value]));
  return {
    keywords: (rows.get('keywords') as string[]) ?? DEFAULT_KEYWORDS,
    weights: { ...DEFAULT_WEIGHTS, ...((rows.get('scoring_weights') as Partial<DrScoringWeights>) ?? {}) },
    sources: { ...DEFAULT_SOURCES, ...((rows.get('sources') as Partial<DrSourceToggles>) ?? {}) },
  };
}
