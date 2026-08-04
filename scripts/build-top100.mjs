// Build a FitBodega 100 data file from segment research files.
//
//   node scripts/build-top100.mjs <segDir> <outFile>
//
// Reads every seg-*.json in <segDir> (arrays of researched entries with raw
// 0-100 factor scores), computes the weighted Fitness Influence Score (FIS),
// dedupes by name, ranks, and writes the final data file consumed by
// app/[locale]/top-100-fitness-influencers. Entries past the top 100 land in
// "bubblingUnder" so nothing researched is thrown away.

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const WEIGHTS = {
  reach: 0.25,
  engagement: 0.15,
  credibility: 0.2,
  impact: 0.15,
  commerce: 0.1,
  consistency: 0.15,
};

// Amplifiers (fitness is not their core output) carry a relevance discount so
// raw celebrity reach cannot outrank full-time fitness voices on its own.
const AMPLIFIER_DISCOUNT = 0.9;

const [segDir, outFile] = process.argv.slice(2);
if (!segDir || !outFile) {
  console.error("usage: node scripts/build-top100.mjs <segDir> <outFile>");
  process.exit(1);
}

const entries = [];
for (const f of readdirSync(segDir).filter((f) => /^seg-.*\.json$/.test(f))) {
  const arr = JSON.parse(readFileSync(join(segDir, f), "utf8"));
  if (!Array.isArray(arr)) throw new Error(`${f}: not an array`);
  for (const e of arr) entries.push({ ...e, _src: f });
}

// Recompute the reach factor from the researched follower counts so every
// segment sits on the same scale (agents drift). Parses strings like
// "IG 3.9M · YT 8.6M (verified 2026-08)"; X/Twitter counts at half weight.
// Log-scaled anchors: 150K=40 · 500K=50 · 1.5M=60 · 5M=70 · 15M=80 · 50M=90 · 150M=100.
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
  // 150K -> 150M spans 3 log units over 60 pts: 20 pts per decade.
  const exact = 40 + 20 * Math.log10(total / 150e3);
  return Math.max(25, Math.min(100, Math.round(exact)));
}

function fis(e) {
  let s = 0;
  for (const [k, w] of Object.entries(WEIGHTS)) {
    const v = e.factors?.[k];
    if (typeof v !== "number" || v < 0 || v > 100) {
      throw new Error(`${e.name}: bad factor ${k}=${v}`);
    }
    s += v * w;
  }
  if (e.tier === "amplifier") s *= AMPLIFIER_DISCOUNT;
  return Math.round(s);
}

// Partial pooling on the subjective (non-reach) factors: each research segment
// was scored by a different researcher, and they drift. Shrink every segment's
// non-reach factors toward the global mean by half its drift — tempers scorer
// bias without erasing real differences between segments.
const SUBJECTIVE = ["engagement", "credibility", "impact", "commerce", "consistency"];
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
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/[^a-z0-9]/g, "");
  const computedReach = reachFromString(e.reach);
  const calibrated =
    computedReach == null ? e : { ...e, factors: { ...e.factors, reach: computedReach } };
  const scored = { ...calibrated, score: fis(calibrated) };
  const prev = byName.get(key);
  if (!prev || scored.score > prev.score) byName.set(key, scored);
}

const ranked = [...byName.values()].sort((a, b) => b.score - a.score);
const main = ranked.slice(0, 100);
const bubbling = ranked.slice(100);

const out = {
  meta: {
    title: "Top 100 Fitness Influencers 2026",
    subtitle:
      "The world's most influential people in fitness — ranked. Athletes, coaches, educators, and the megastars who move training culture.",
    series: "The FitBodega 100",
    updated: new Date().toISOString().slice(0, 10),
    reviewCadence: "monthly",
    scoreModel: {
      name: "Fitness Influence Score",
      gate: "Two tiers. Core — fitness is their main output. Amplifiers — fitness is not their core topic, but their reach moves the whole culture when they train, transform, or talk protocols; amplifier scores carry a 0.9 relevance discount.",
      weights: WEIGHTS,
      notes:
        "Reach is log-scaled and platform-weighted (Instagram, YouTube, TikTok full weight; X half) and recomputed from researched follower counts. The five judgment factors are calibrated across research segments so no category is scored on an easier curve. Follower counts marked verified were browser-checked at the listed date; the rest are approximate.",
    },
    disclaimer:
      "Follower counts are approximate (2026) and the ranking is reviewed monthly. Educational and editorial — inclusion is not an endorsement, and scores measure influence, not advice quality.",
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
