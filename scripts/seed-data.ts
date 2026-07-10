/**
 * LEGACY (yoga template) — needs rework before use
 * scripts/seed-data.ts
 * Seed the Yoga Founders Network database with real Vancouver/BC listings and blog posts.
 *
 * Usage: npx tsx scripts/seed-data.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

import { studios } from "./data/studios";
import { teachers } from "./data/teachers";
import { schools } from "./data/schools";
import { retreats } from "./data/retreats";
import { products } from "./data/products";
import { workshops } from "./data/workshops";
import { blogPosts } from "./data/blog-posts";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function seedListings() {
  const allListings = [
    ...studios,
    ...teachers,
    ...schools,
    ...retreats,
    ...products,
    ...workshops,
  ];

  console.log(`\nSeeding ${allListings.length} listings...`);

  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for (const listing of allListings) {
    // Check if slug already exists
    const { data: existing } = await supabase
      .from("listings")
      .select("id")
      .eq("slug", listing.slug)
      .single();

    if (existing) {
      skipped++;
      continue;
    }

    const { error } = await supabase.from("listings").insert(listing);

    if (error) {
      console.error(`  Error inserting "${listing.name}": ${error.message}`);
      errors++;
    } else {
      inserted++;
    }
  }

  console.log(`  Inserted: ${inserted}, Skipped: ${skipped}, Errors: ${errors}`);
}

async function seedBlogPosts() {
  console.log(`\nSeeding ${blogPosts.length} blog posts...`);

  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for (const post of blogPosts) {
    const { data: existing } = await supabase
      .from("blog_posts")
      .select("id")
      .eq("slug", post.slug)
      .single();

    if (existing) {
      skipped++;
      continue;
    }

    const { error } = await supabase.from("blog_posts").insert(post);

    if (error) {
      console.error(`  Error inserting "${post.title}": ${error.message}`);
      errors++;
    } else {
      inserted++;
    }
  }

  console.log(`  Inserted: ${inserted}, Skipped: ${skipped}, Errors: ${errors}`);
}

async function main() {
  console.log("=== Yoga Founders Network — Seed Script ===");
  console.log(`Supabase URL: ${SUPABASE_URL}`);

  await seedListings();
  await seedBlogPosts();

  console.log("\nDone!");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
