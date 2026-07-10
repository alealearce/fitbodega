/**
 * scripts/seed-production.ts — one-time production seed
 * Creates the listing-images storage bucket, seeds the 15 real Vancouver
 * listings and all 57 migrated Journal posts into the linked Supabase
 * project. Idempotent: upserts by slug.
 *
 * Usage: npx tsx scripts/seed-production.ts
 * Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import path from "node:path";
import { DEMO_LISTINGS } from "../lib/demo/listings";
import { DEMO_BLOG_POSTS } from "../lib/demo/blog";

// Minimal .env.local loader (no dotenv dependency)
for (const line of readFileSync(path.join(process.cwd(), ".env.local"), "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Missing Supabase env vars");
if (!url.includes("ckjtzptxlokflojiwtbq")) throw new Error(`Refusing: unexpected project url ${url}`);

const supabase = createClient(url, key, { auth: { persistSession: false } });

async function main() {
  // 1. Storage bucket (public) — ignore "already exists"
  const { error: bucketErr } = await supabase.storage.createBucket("listing-images", { public: true });
  if (bucketErr && !/already exists/i.test(bucketErr.message)) throw bucketErr;
  console.log("bucket listing-images: ok");

  // 2. Listings — strip demo ids so the DB generates real UUIDs
  const listings = DEMO_LISTINGS.map(({ id: _id, created_at: _c, updated_at: _u, ...rest }) => rest);
  const { error: listErr } = await supabase
    .from("listings")
    .upsert(listings, { onConflict: "slug", ignoreDuplicates: false });
  if (listErr) throw new Error(`listings: ${listErr.message}`);
  console.log(`listings: ${listings.length} upserted`);

  // 3. Blog posts — DEMO_BLOG_POSTS already carries the hero-extraction
  //    normalization (one cover per post, localized image paths)
  const posts = DEMO_BLOG_POSTS.map(({ id: _id, created_at: _c, updated_at: _u, ...rest }) => rest);
  const { error: postErr } = await supabase
    .from("blog_posts")
    .upsert(posts, { onConflict: "slug", ignoreDuplicates: false });
  if (postErr) throw new Error(`blog_posts: ${postErr.message}`);
  console.log(`blog_posts: ${posts.length} upserted`);

  // 4. Verify
  const [{ count: lc }, { count: pc }] = await Promise.all([
    supabase.from("listings").select("*", { count: "exact", head: true }),
    supabase.from("blog_posts").select("*", { count: "exact", head: true }),
  ]);
  console.log(`verify: ${lc} listings, ${pc} blog posts in production`);
}

main().catch((e) => { console.error(e); process.exit(1); });
