/**
 * LEGACY (yoga template) — needs rework before use
 * scripts/seed-international.ts
 * Seed the directory with real international yoga listings (idempotent by slug).
 *
 * Usage: npx tsx scripts/seed-international.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
import { international } from "./data/international";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  console.log("=== Seeding international listings ===");
  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for (const listing of international) {
    const { data: existing } = await supabase
      .from("listings")
      .select("id")
      .eq("slug", listing.slug)
      .maybeSingle();

    if (existing) {
      console.log(`  • Skipped (exists): ${listing.name}`);
      skipped++;
      continue;
    }

    const { error } = await supabase.from("listings").insert(listing);
    if (error) {
      console.error(`  ✗ Error inserting "${listing.name}": ${error.message}`);
      errors++;
    } else {
      console.log(`  ✓ Inserted: ${listing.name} — ${listing.city}, ${listing.country}`);
      inserted++;
    }
  }

  console.log(`\nDone. Inserted: ${inserted}, Skipped: ${skipped}, Errors: ${errors}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
