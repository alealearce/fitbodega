// Fetcher runner. One failing source never kills the run — it logs to
// dr_runs and the loop continues.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { DealRadarConfig } from '../config';
import type { Fetcher, RawOpportunity } from '../types';
import { adLibraryFetcher } from './adLibrary';
import { castingBoardsFetcher } from './castingBoards';
import { pitchloFetcher } from './pitchlo';
import { spendSignalsFetcher } from './spendSignals';

const ALL_FETCHERS: Fetcher[] = [
  pitchloFetcher,
  castingBoardsFetcher,
  spendSignalsFetcher,
  adLibraryFetcher,
];

export async function runFetchers(
  supabase: SupabaseClient,
  config: DealRadarConfig,
  opts: { useFixtures: boolean }
): Promise<RawOpportunity[]> {
  const collected: RawOpportunity[] = [];

  for (const fetcher of ALL_FETCHERS) {
    if (!config.sources[fetcher.id]) continue;

    const startedAt = new Date().toISOString();
    const t0 = Date.now();
    let items: RawOpportunity[] = [];
    let error: string | null = null;

    try {
      items = await fetcher.fetch({ keywords: config.keywords, useFixtures: opts.useFixtures });
      collected.push(...items);
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    }

    await supabase.from('dr_runs').insert({
      started_at: startedAt,
      finished_at: new Date().toISOString(),
      source: fetcher.id,
      items_found: items.length,
      errors: error ? [error] : [],
      duration_ms: Date.now() - t0,
      ok: error === null,
    });
  }

  return collected;
}
