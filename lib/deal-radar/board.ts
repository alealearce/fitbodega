import type { DrOpportunity } from '@/lib/deal-radar/types';

// The board splits three ways, and the split is the point.
//
//   posted — deals brands submitted to FitBodega (source 'brand_direct')
//   found  — open listings we found on public boards and brand program pages
//   radar  — spend intelligence: brands buying creator content elsewhere
//
// posted + found are Section A: things a creator can act on today, each card
// naming where the application actually happens. radar is Section B and is
// never dressed as a posting.

export interface BoardSplit {
  posted: DrOpportunity[];
  found: DrOpportunity[];
  radar: DrOpportunity[];
}

export function splitBoard(opportunities: DrOpportunity[]): BoardSplit {
  const byScore = (a: DrOpportunity, b: DrOpportunity) => b.score - a.score;
  return {
    posted: opportunities.filter((o) => o.source === 'brand_direct').sort(byScore),
    radar: opportunities.filter((o) => o.source_type === 'spend_signal').sort(byScore),
    found: opportunities
      .filter((o) => o.source_type === 'listed_deal' && o.source !== 'brand_direct')
      .sort(byScore),
  };
}

// Where the creator actually applies. Never implies FitBodega hosts an
// application it does not host.
export function originLabel(o: DrOpportunity): string {
  switch (o.source) {
    case 'brand_direct':
      return 'Posted to FitBodega';
    case 'pitchlo':
      return 'Listed on Pitchlo';
    case 'casting_boards':
      return 'Listed on a casting board';
    case 'research':
      return "Brand's own program page";
    default:
      return 'Listed elsewhere';
  }
}

export function applyHost(o: DrOpportunity): string | null {
  if (!o.source_url) return null;
  try {
    return new URL(o.source_url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}
