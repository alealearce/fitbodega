// Shared helpers for fetchers: polite HTTP fetch + LLM extraction of listings
// from page text. Public pages only; identified user agent; sequential
// requests with a 1s gap.

import Anthropic from '@anthropic-ai/sdk';
import type { DrOfferType, DrSourceId, DrSourceType, RawOpportunity } from '../types';

const USER_AGENT = 'FitBodegaDealRadar/1.0 (+https://fitbodega.com/deals; hello@fitbodega.com)';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function politeFetch(url: string): Promise<string | null> {
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'text/html' },
    redirect: 'follow',
  });
  if (!res.ok) return null;
  return res.text();
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// Strip tags and collapse whitespace so we hand the model text, not HTML.
// Never put large HTML inside JSON strings — it breaks parsing downstream.
export function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<a\s+[^>]*href="([^"]+)"[^>]*>/gi, ' [href:$1] ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#x?\w+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

interface ExtractedItem {
  brandName: string;
  brandUrl: string | null;
  sourceUrl: string | null;
  offerType: DrOfferType;
  compensationText: string | null;
  deliverables: string | null;
  platforms: string[];
  postedAt: string | null;
  expired: boolean;
  fitnessNiche: boolean;
}

// Turn page text into structured listings. The model only ever sees plain
// text and returns a small JSON array; anything malformed drops the batch.
export async function extractListings(opts: {
  source: DrSourceId;
  sourceType: DrSourceType;
  pageUrl: string;
  pageText: string;
  todayIso: string;
}): Promise<RawOpportunity[]> {
  // 12K output headroom: a busy board page holds 30+ listings and the
  // structured-output JSON was getting truncated mid-string at 4K
  // (pitchlo run failure, 2026-08-17).
  const response = await anthropic.messages.create({
    model: 'claude-opus-5',
    max_tokens: 12000,
    output_config: {
      format: {
        type: 'json_schema',
        schema: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  brandName: { type: 'string' },
                  brandUrl: { type: ['string', 'null'] },
                  sourceUrl: { type: ['string', 'null'] },
                  offerType: { type: 'string', enum: ['paid', 'gifted', 'commission', 'unknown'] },
                  compensationText: { type: ['string', 'null'] },
                  deliverables: { type: ['string', 'null'] },
                  platforms: { type: 'array', items: { type: 'string' } },
                  postedAt: { type: ['string', 'null'] },
                  expired: { type: 'boolean' },
                  fitnessNiche: { type: 'boolean' },
                },
                required: [
                  'brandName', 'brandUrl', 'sourceUrl', 'offerType', 'compensationText',
                  'deliverables', 'platforms', 'postedAt', 'expired', 'fitnessNiche',
                ],
                additionalProperties: false,
              },
            },
          },
          required: ['items'],
          additionalProperties: false,
        },
      },
    },
    messages: [
      {
        role: 'user',
        content: `Today is ${opts.todayIso}. Below is the plain-text content of a public creator-marketplace page (${opts.pageUrl}). Extract every brand deal / UGC / collab listing you can identify.

Rules:
- At most 25 listings; prefer the most recent when there are more.
- Only data present in the text. Never invent brands, pay figures, or URLs.
- sourceUrl: resolve [href:...] markers against ${opts.pageUrl} when relative.
- postedAt: convert relative dates ("3 days ago") to ISO YYYY-MM-DD using today's date. Null if absent.
- expired: true when a stated deadline is in the past or the listing is marked closed.
- fitnessNiche: true only for fitness, wellness, supplements, activewear, recovery, wearables, sports nutrition, or health food.

PAGE TEXT:
${opts.pageText.slice(0, 60000)}`,
      },
    ],
  });

  const block = response.content.find((b) => b.type === 'text');
  if (!block || block.type !== 'text') return [];
  const parsed = JSON.parse(block.text) as { items: ExtractedItem[] };

  return parsed.items
    .filter((i) => !i.expired && i.fitnessNiche && i.brandName)
    .map((i) => ({
      source: opts.source,
      sourceType: opts.sourceType,
      brandName: i.brandName,
      brandUrl: i.brandUrl,
      sourceUrl: i.sourceUrl ?? opts.pageUrl,
      offerType: i.offerType,
      compensationText: i.compensationText,
      deliverables: i.deliverables,
      platforms: i.platforms.map((p) => p.toLowerCase()),
      activeAdCount: null,
      postedAt: i.postedAt,
      meta: {},
    }));
}

export { anthropic };
