// Spend signals — Claude with server-side web search finds fitness brands
// actively buying creator-style ads (ad-library trackers, sponsored-post
// trackers, trade press, hiring signals). Each claim carries an evidence
// label: observed / reported / inferred.

import fixtures from '../fixtures/spend_signals.json';
import type { DrOfferType, Fetcher, RawOpportunity } from '../types';
import { anthropic } from './extract';

interface SignalItem {
  brandName: string;
  brandUrl: string | null;
  sourceUrl: string;
  platforms: string[];
  activeAdCount: number | null;
  evidence: 'observed' | 'reported' | 'inferred';
  evidenceNote: string;
  pitchAngle: string;
}

export const spendSignalsFetcher: Fetcher = {
  id: 'spend_signals',
  async fetch({ keywords, useFixtures }): Promise<RawOpportunity[]> {
    if (useFixtures) return fixtures as RawOpportunity[];

    const todayIso = new Date().toISOString().slice(0, 10);
    const response = await anthropic.messages.create({
      model: 'claude-opus-5',
      max_tokens: 8192,
      tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: 12 }],
      messages: [
        {
          role: 'user',
          content: `Today is ${todayIso}. Find 6-10 fitness/wellness brands that are ACTIVELY spending on creator-style ads right now (product niches: ${keywords.join(', ')}).

Search third-party Meta ad-library trackers (Motion, GoMarble), sponsored-post trackers (Modash), 2026 marketing trade press, and current UGC-creator hiring signals. Rules:
- Every brand needs a working source URL you saw in search results.
- Label each: "observed" (tracker data), "reported" (press), "inferred" (hiring signal).
- Evidence from 2025-2026 only. Never invent spend figures; activeAdCount only when a tracker states it.
- pitchAngle: one sentence on how a fitness creator should pitch this brand.

After researching, reply with ONLY a JSON object, no other text:
{"items": [{"brandName": "...", "brandUrl": "... or null", "sourceUrl": "...", "platforms": ["..."], "activeAdCount": 123 or null, "evidence": "observed|reported|inferred", "evidenceNote": "one sentence", "pitchAngle": "one sentence"}]}`,
        },
      ],
    });

    // Take the LAST text block — earlier blocks interleave with search results.
    const textBlocks = response.content.filter((b) => b.type === 'text');
    const last = textBlocks[textBlocks.length - 1];
    if (!last || last.type !== 'text') return [];
    const jsonMatch = last.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return [];
    const parsed = JSON.parse(jsonMatch[0]) as { items: SignalItem[] };

    return parsed.items
      .filter((i) => i.brandName && i.sourceUrl)
      .map((i) => ({
        source: 'spend_signals' as const,
        sourceType: 'spend_signal' as const,
        brandName: i.brandName,
        brandUrl: i.brandUrl,
        sourceUrl: i.sourceUrl,
        offerType: 'unknown' as DrOfferType,
        compensationText: null,
        deliverables: null,
        platforms: (i.platforms ?? []).map((p) => p.toLowerCase()),
        activeAdCount: i.activeAdCount ?? null,
        postedAt: todayIso,
        meta: {
          evidence: i.evidence,
          evidenceNote: i.evidenceNote,
          pitchAngle: i.pitchAngle,
        },
      }));
  },
};
