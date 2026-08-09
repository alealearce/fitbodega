// Draft intro copy for the weekly digest. This is a PREWRITE — the user
// edits and approves every word in /admin/deal-radar before anything sends.

import { anthropic } from './fetchers/extract';
import type { DrOpportunity } from './types';

export async function generateIntroCopy(
  weekSlug: string,
  opportunities: DrOpportunity[]
): Promise<string> {
  const listed = opportunities.filter((o) => o.source_type === 'listed_deal');
  const signals = opportunities.filter((o) => o.source_type === 'spend_signal');

  const summary = [
    `${listed.length} open collab listings (top pay: ${listed.map((o) => o.compensation_text).filter(Boolean).slice(0, 3).join('; ') || 'n/a'})`,
    `${signals.length} brands actively spending on creator ads (top: ${signals.slice(0, 3).map((o) => o.brand_name).join(', ') || 'n/a'})`,
  ].join('. ');

  const response = await anthropic.messages.create({
    model: 'claude-opus-5',
    max_tokens: 400,
    messages: [
      {
        role: 'user',
        content: `Write a 2-3 sentence intro for FitBodega's "Deal Radar" weekly digest (week of ${weekSlug}) for fitness creators. This week's data: ${summary}.

Voice: confident, terse, editorial — like an elite trainer who respects the reader's time. No exclamation marks, no "amazing/awesome", no hedging, no emojis. Reference something concrete from this week's data. Reply with the intro text only.`,
      },
    ],
  });

  const block = response.content.find((b) => b.type === 'text');
  return block && block.type === 'text' ? block.text.trim() : '';
}
