// Build a FitBodega 100 data file from segment research files.
//
//   node scripts/build-top100.mjs <segDir> <outFile> [listId]
//
// listId picks a config from LISTS (default "influencers"). Reads that list's
// segment files in <segDir> (arrays of researched entries with raw 0-100
// factor scores), recomputes the reach factor from researched follower
// counts, calibrates the judgment factors across research segments, dedupes
// by name, ranks, and writes the final data file consumed by the matching
// app/[locale]/top-100-* page. Entries past the top 100 land in
// "bubblingUnder" so nothing researched is thrown away.

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const LISTS = {
  influencers: {
    segPattern: /^seg-.*\.json$/,
    weights: {
      reach: 0.25,
      engagement: 0.15,
      credibility: 0.2,
      impact: 0.15,
      commerce: 0.1,
      consistency: 0.15,
    },
    // Amplifiers (fitness is not their core output) carry a relevance
    // discount so raw celebrity reach cannot outrank full-time voices.
    discountTier: "amplifier",
    discount: 0.9,
    // Log reach curve: base count maps to base score, +20 pts per decade.
    reachBase: { count: 150e3, score: 40 },
    meta: {
      title: "Top 100 Fitness Influencers 2026",
      subtitle:
        "The world's most influential people in fitness — ranked. Athletes, coaches, educators, and the megastars who move training culture.",
      scoreModel: {
        name: "Fitness Influence Score",
        gate: "Two tiers. Core — fitness is their main output. Amplifiers — fitness is not their core topic, but their reach moves the whole culture when they train, transform, or talk protocols; amplifier scores carry a 0.9 relevance discount.",
        notes:
          "Reach is log-scaled and platform-weighted (Instagram, YouTube, TikTok full weight; X half) and recomputed from researched follower counts. The five judgment factors are calibrated across research segments so no category is scored on an easier curve. Follower counts marked verified were browser-checked at the listed date; the rest are approximate.",
      },
      disclaimer:
        "Follower counts are approximate (2026) and the ranking is reviewed monthly. Educational and editorial — inclusion is not an endorsement, and scores measure influence, not advice quality.",
    },
  },
  gyms: {
    segPattern: /^gym-seg-.*\.json$/,
    weights: {
      legacy: 0.2,
      talent: 0.2,
      facility: 0.15,
      community: 0.15,
      reach: 0.15,
      destination: 0.15,
    },
    discountTier: null,
    discount: 1,
    reachBase: { count: 30e3, score: 40 },
    meta: {
      title: "Top 100 Gyms in the World 2026",
      subtitle:
        "The most influential training grounds on earth — ranked. Iron meccas, champion factories, luxury clubs, and the outdoor pits people cross oceans to train in.",
      scoreModel: {
        name: "Gym Influence Score",
        gate: "Specific, visitable gyms only. Chains enter through individual locations judged as places — never as a brand in the abstract. Independent gyms and chain flagships are scored on the same scale.",
        notes:
          "Reach is log-scaled and recomputed from each gym's researched follower counts. The five judgment factors — legacy, talent, facility, community, destination — are calibrated across research segments so no category is scored on an easier curve. Counts marked verified were browser-checked at the listed date; the rest are approximate.",
      },
      disclaimer:
        "Details are editorial estimates (2026) and the ranking is reviewed monthly. Inclusion is not an endorsement; gyms open, move, and close — check before you travel.",
    },
  },
};

LISTS.retreats = {
  segPattern: /^ret-seg-.*\.json$/,
  weights: {
    program: 0.2,
    prestige: 0.2,
    facility: 0.15,
    setting: 0.15,
    reach: 0.15,
    results: 0.15,
  },
  discountTier: null,
  discount: 1,
  reachBase: { count: 15e3, score: 40 },
  meta: {
    title: "Top 100 Fitness Retreats & Wellness Resorts 2026",
    subtitle:
      "The world's best places to book a stay and train — ranked. Transformation camps, longevity clinics, sport meccas, and the resorts where fitness is the point of the trip.",
    scoreModel: {
      name: "Retreat Influence Score",
      gate: "Bookable stays with a genuine fitness or movement program only — no pure spas or beauty clinics. Training camps and wellness resorts are scored on the same scale.",
      notes:
        "Reach is log-scaled and recomputed from each property's researched follower counts. The five judgment factors — program, prestige, facility, setting, results — are calibrated across research segments so no category is scored on an easier curve. Counts marked verified were browser-checked at the listed date; the rest are approximate.",
    },
    disclaimer:
      "Details are editorial estimates (2026) and the ranking is reviewed monthly. Inclusion is not an endorsement; programs, prices, and properties change — check before you book.",
  },
};

LISTS.hyrox = {
  segPattern: /^hyrox-seg-.*\.json$/,
  weights: {
    results: 0.25,
    reach: 0.15,
    content: 0.15,
    momentum: 0.15,
    crossover: 0.15,
    longevity: 0.15,
  },
  discountTier: null,
  discount: 1,
  reachBase: { count: 10e3, score: 40 },
  meta: {
    title: "Top 100 Hyrox Athletes to Follow 2026",
    subtitle:
      "The racers and voices defining fitness racing — ranked. World champions, Elite 15 regulars, doubles stars, and the creators teaching the sport.",
    scoreModel: {
      name: "Hyrox Follow Score",
      gate: "Two tiers on one scale. Elite — races elite heats and podiums at majors, scored results-first. Creators — coaches and media voices who may race sub-elite but shape how the sport is trained and watched.",
      notes:
        "Reach is log-scaled and recomputed from researched follower counts. The five judgment factors — results, content, momentum, crossover, longevity — are calibrated across research segments so no category is scored on an easier curve. Counts marked verified were browser-checked at the listed date; the rest are approximate.",
    },
    disclaimer:
      "Rosters and results move fast in Hyrox; the ranking is reviewed monthly against the current season. Educational and editorial — inclusion is not an endorsement.",
  },
};

LISTS.coaches = {
  segPattern: /^coach-seg-.*\.json$/,
  weights: {
    coaching: 0.25,
    content: 0.2,
    reach: 0.15,
    credibility: 0.15,
    business: 0.15,
    engagement: 0.1,
  },
  discountTier: null,
  discount: 1,
  reachBase: { count: 150e3, score: 40 },
  meta: {
    title: "Top 100 Online Fitness Coaches 2026",
    subtitle:
      "The best coaches you can actually hire on the internet — ranked. Evidence-based physique coaches, transformation PTs, endurance coaches, and the podcasts and creators with real coaching arms.",
    scoreModel: {
      name: "Coaching Influence Score",
      gate: "One hard gate: everyone on this list sells real coaching — 1:1 online coaching, coached programs with feedback, or a coaching app they author. Podcasters and content creators qualify only through a genuine coaching arm.",
      notes:
        "Reach is log-scaled and platform-weighted, recomputed from researched follower counts. The five judgment factors — coaching, content, credibility, business, engagement — are calibrated across research segments so no category is scored on an easier curve. Counts marked verified were browser-checked at the listed date; the rest are approximate.",
    },
    disclaimer:
      "Details are editorial estimates (2026) and the ranking is reviewed monthly. Inclusion is not an endorsement and scores measure influence and coaching footprint, not results guarantees — vet any coach before you pay.",
  },
};

LISTS.recovery = {
  segPattern: /^rec-seg-.*\.json$/,
  weights: {
    legacy: 0.2,
    experience: 0.2,
    facility: 0.15,
    community: 0.15,
    reach: 0.15,
    destination: 0.15,
  },
  discountTier: null,
  discount: 1,
  reachBase: { count: 15e3, score: 40 },
  meta: {
    title: "Top 100 Recovery Spaces 2026",
    subtitle:
      "The world's best places to recover — ranked. Historic bathhouses, sauna temples, geothermal lagoons, jjimjilbang, and the new wave of social recovery clubs.",
    scoreModel: {
      name: "Recovery Space Score",
      gate: "Specific, currently-operating venues the public can book or walk into. Heritage bathhouses and modern recovery studios are scored on the same scale; beauty salons and medical-aesthetic clinics do not qualify.",
      notes:
        "Reach is log-scaled and recomputed from each venue's researched follower counts. The five judgment factors — legacy, experience, facility, community, destination — are calibrated across research segments so no category is scored on an easier curve. Counts marked verified were browser-checked at the listed date; the rest are approximate.",
    },
    disclaimer:
      "Details are editorial estimates (2026) and the ranking is reviewed monthly. Inclusion is not an endorsement; venues renovate, change access rules, and close — check before you travel.",
  },
};

LISTS.runclubs = {
  segPattern: /^club-seg-.*\.json$/,
  weights: {
    legacy: 0.2,
    community: 0.2,
    reach: 0.15,
    events: 0.15,
    crossover: 0.15,
    destination: 0.15,
  },
  discountTier: null,
  discount: 1,
  reachBase: { count: 10e3, score: 40 },
  meta: {
    title: "Top 100 Run Clubs & Fitness Crews 2026",
    subtitle:
      "The communities people actually show up for — ranked. Run crews, cycling clubs, open-water swimmers, and the free workout movements redefining social fitness.",
    scoreModel: {
      name: "Crew Score",
      gate: "Real, currently-active clubs with regular sessions the public can join. Global organizations enter as themselves or through their flagship chapter — whichever is how people know them. Independent crews and brand-backed clubs are scored on the same scale.",
      notes:
        "Reach is log-scaled and recomputed from each crew's researched follower counts. The five judgment factors — legacy, community, events, crossover, destination — are calibrated across research segments so no category is scored on an easier curve. Counts marked verified were browser-checked at the listed date; the rest are approximate.",
    },
    disclaimer:
      "Details are editorial estimates (2026) and the ranking is reviewed monthly. Inclusion is not an endorsement; crews move, pause, and reform — check their socials for this week's session.",
  },
};

LISTS.stores = {
  segPattern: /^store-seg-.*\.json$/,
  weights: {
    legacy: 0.2,
    selection: 0.2,
    experience: 0.15,
    community: 0.15,
    reach: 0.15,
    destination: 0.15,
  },
  discountTier: null,
  discount: 1,
  reachBase: { count: 15e3, score: 40 },
  meta: {
    title: "Top 100 Health Food Stores 2026",
    subtitle:
      "The stores that define healthy-food retail — ranked. Celebrity grocers, working co-ops, organic pioneers, farm shops, and the zero-waste new wave.",
    scoreModel: {
      name: "Store Score",
      gate: "Specific, currently-operating physical stores where health-food retail is the core business. Chains enter through individual locations judged as places — never as a brand in the abstract. Restaurants and online-only sellers do not qualify.",
      notes:
        "Reach is log-scaled and recomputed from each store's researched follower counts. The five judgment factors — legacy, selection, experience, community, destination — are calibrated across research segments so no category is scored on an easier curve. Counts marked verified were browser-checked at the listed date; the rest are approximate.",
    },
    disclaimer:
      "Details are editorial estimates (2026) and the ranking is reviewed monthly. Inclusion is not an endorsement; stores move, renovate, and close — check before you travel.",
  },
};

LISTS.nutritionists = {
  segPattern: /^nut-seg-.*\.json$/,
  weights: {
    credibility: 0.25,
    practice: 0.2,
    content: 0.15,
    reach: 0.15,
    impact: 0.15,
    consistency: 0.1,
  },
  discountTier: null,
  discount: 1,
  reachBase: { count: 50e3, score: 40 },
  meta: {
    title: "Top 100 Nutritionists 2026",
    subtitle:
      "The world's leading credentialed nutritionists and dietitians — ranked. Sports RDs, researcher-practitioners, clinical leaders, and the registered dietitians winning the internet.",
    scoreModel: {
      name: "Nutrition Authority Score",
      gate: "One hard gate: recognized credentials — registered dietitian status or graduate-level nutrition science — plus real practice with clients, athletes, teams, or clinics. Famous but uncredentialed voices do not qualify.",
      notes:
        "Reach is log-scaled and recomputed from researched follower counts. The five judgment factors — credibility, practice, content, impact, consistency — are calibrated across research segments so no category is scored on an easier curve. Counts marked verified were browser-checked at the listed date; the rest are approximate.",
    },
    disclaimer:
      "Details are editorial estimates (2026) and the ranking is reviewed monthly. Educational and editorial — inclusion is not an endorsement, rankings measure influence and authority, and nothing here is dietary advice.",
  },
};

const [segDir, outFile, listId = "influencers"] = process.argv.slice(2);
const LIST = LISTS[listId];
if (!segDir || !outFile || !LIST) {
  console.error(
    `usage: node scripts/build-top100.mjs <segDir> <outFile> [${Object.keys(LISTS).join("|")}]`
  );
  process.exit(1);
}
const WEIGHTS = LIST.weights;

const entries = [];
for (const f of readdirSync(segDir).filter((f) => LIST.segPattern.test(f))) {
  const arr = JSON.parse(readFileSync(join(segDir, f), "utf8"));
  if (!Array.isArray(arr)) throw new Error(`${f}: not an array`);
  for (const e of arr) entries.push({ ...e, _src: f });
}
if (entries.length === 0) throw new Error(`no segment files matched in ${segDir}`);

// Recompute the reach factor from the researched follower counts so every
// segment sits on the same scale (agents drift). Parses strings like
// "IG 3.9M · YT 8.6M (verified 2026-08)"; X/Twitter counts at half weight.
function reachFromString(s) {
  if (!s) return null;
  const HALF = new Set(["X", "TW", "TWITTER"]);
  let total = 0;
  for (const m of s.matchAll(/([A-Za-z]+)\s*([\d.]+)\s*([KMB])/g)) {
    const mult = { K: 1e3, M: 1e6, B: 1e9 }[m[3].toUpperCase()];
    const n = parseFloat(m[2]) * mult;
    total += HALF.has(m[1].toUpperCase()) ? n / 2 : n;
  }
  if (total <= 0) return null;
  const { count, score } = LIST.reachBase;
  const exact = score + 20 * Math.log10(total / count);
  return Math.max(25, Math.min(100, Math.round(exact)));
}

function influenceScore(e) {
  let s = 0;
  for (const [k, w] of Object.entries(WEIGHTS)) {
    const v = e.factors?.[k];
    if (typeof v !== "number" || v < 0 || v > 100) {
      throw new Error(`${e.name}: bad factor ${k}=${v}`);
    }
    s += v * w;
  }
  if (LIST.discountTier && e.tier === LIST.discountTier) s *= LIST.discount;
  return Math.round(s);
}

// Partial pooling on the subjective (non-reach) factors: each research segment
// was scored by a different researcher, and they drift. Shrink every segment's
// non-reach factors toward the global mean by half its drift — tempers scorer
// bias without erasing real differences between segments.
const SUBJECTIVE = Object.keys(WEIGHTS).filter((k) => k !== "reach");
const subjMean = (e) =>
  SUBJECTIVE.reduce((s, k) => s + e.factors[k], 0) / SUBJECTIVE.length;
const segMeans = new Map();
for (const e of entries) {
  const m = segMeans.get(e.segment) ?? { sum: 0, n: 0 };
  m.sum += subjMean(e);
  m.n += 1;
  segMeans.set(e.segment, m);
}
const globalMean =
  entries.reduce((s, e) => s + subjMean(e), 0) / entries.length;
for (const e of entries) {
  const m = segMeans.get(e.segment);
  const drift = m.sum / m.n - globalMean;
  const adj = -0.5 * drift;
  for (const k of SUBJECTIVE) {
    e.factors[k] = Math.max(0, Math.min(100, Math.round(e.factors[k] + adj)));
  }
}

// Dedupe by normalized name (parentheticals stripped, so "Cassey Ho" and
// "Cassey Ho (Blogilates)" collapse); keep the copy with the higher score.
const byName = new Map();
for (const e of entries) {
  const key = e.name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/[^a-z0-9]/g, "");
  const computedReach = reachFromString(e.reach);
  const calibrated =
    computedReach == null ? e : { ...e, factors: { ...e.factors, reach: computedReach } };
  const scored = { ...calibrated, score: influenceScore(calibrated) };
  const prev = byName.get(key);
  if (!prev || scored.score > prev.score) byName.set(key, scored);
}

const ranked = [...byName.values()].sort((a, b) => b.score - a.score);
const main = ranked.slice(0, 100);
const bubbling = ranked.slice(100);

const out = {
  meta: {
    ...LIST.meta,
    series: "The FitBodega 100",
    updated: new Date().toISOString().slice(0, 10),
    reviewCadence: "monthly",
    scoreModel: { ...LIST.meta.scoreModel, weights: WEIGHTS },
  },
  entries: main.map((e, i) => ({ rank: i + 1, ...strip(e) })),
  bubblingUnder: bubbling.map((e) => strip(e)),
};

function strip(e) {
  const { _src, ...rest } = e;
  return rest;
}

writeFileSync(outFile, JSON.stringify(out, null, 2) + "\n");
console.log(
  `wrote ${outFile}: ${main.length} ranked + ${bubbling.length} bubbling under (${entries.length} researched, ${entries.length - ranked.length} duplicates merged)`
);
console.log("top 10:", main.slice(0, 10).map((e) => `${e.name} ${e.score}`).join(" · "));
