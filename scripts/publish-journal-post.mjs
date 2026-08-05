// Publish the Top 50 Vancouver Fitness Influencers journal post to FitBodega.
// Uses the Supabase REST API directly (no deps).
//   node publish-top50-post.mjs <bodyFile.md> <metaFile.json> [--draft]
import { readFileSync } from "node:fs";

const ENV_PATH = "/Users/alejandroarce/Claude Code/fitbodega/.env.local";
const env = Object.fromEntries(
  readFileSync(ENV_PATH, "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);

const URL_BASE = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const HEADERS = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  "Content-Type": "application/json",
};

const [bodyFile, metaFile] = process.argv.slice(2);
const draft = process.argv.includes("--draft");
const content = readFileSync(bodyFile, "utf8");
const meta = JSON.parse(readFileSync(metaFile, "utf8"));

const q = (p) => fetch(`${URL_BASE}/rest/v1/${p}`, { headers: HEADERS });

const existingRes = await q(`blog_posts?slug=eq.${meta.slug}&select=id`);
const existing = await existingRes.json();

const cover = `https://fitbodega.com/api/social/image?type=cover&slug=${encodeURIComponent(meta.slug)}&title=${encodeURIComponent(meta.title)}&category=${encodeURIComponent(meta.category)}`;

const row = {
  title: meta.title,
  slug: meta.slug,
  content,
  excerpt: meta.excerpt,
  author: "FitBodega",
  tags: meta.tags,
  category: meta.category,
  city: meta.city,
  is_published: !draft,
  published_at: new Date().toISOString(),
  reading_time_minutes: meta.reading_time_minutes,
  meta_title: meta.meta_title,
  meta_description: meta.meta_description,
  cover_image: cover,
  generated_by: "claude",
};

let res;
if (existing.length > 0) {
  console.log(`slug exists (${existing[0].id}) — updating in place`);
  res = await fetch(`${URL_BASE}/rest/v1/blog_posts?id=eq.${existing[0].id}`, {
    method: "PATCH",
    headers: { ...HEADERS, Prefer: "return=representation" },
    body: JSON.stringify({ ...row, published_at: undefined }),
  });
} else {
  res = await fetch(`${URL_BASE}/rest/v1/blog_posts`, {
    method: "POST",
    headers: { ...HEADERS, Prefer: "return=representation" },
    body: JSON.stringify(row),
  });
}

const out = await res.json();
if (!res.ok) {
  console.error("FAILED", res.status, JSON.stringify(out));
  process.exit(1);
}
console.log(`ok: ${out[0].slug} (${out[0].id}) published=${out[0].is_published}`);
