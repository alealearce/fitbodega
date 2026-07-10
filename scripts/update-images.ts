/**
 * LEGACY (yoga template) — needs rework before use
 * scripts/update-images.ts
 * Update images for all listings with working URLs.
 * Run: npx tsx scripts/update-images.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const imageUpdates: { slug: string; images: string[] }[] = [
  // ── STUDIOS ──────────────────────────────────────────────────────────────────
  {
    slug: "yyoga-downtown-flow-vancouver",
    images: [
      "https://images.unsplash.com/photo-1588286840104-8957b019727f?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&auto=format&fit=crop",
    ],
  },
  {
    slug: "modo-yoga-east-vancouver",
    images: [
      "https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1593811167562-9cef47bfc4d7?w=800&auto=format&fit=crop",
    ],
  },
  {
    slug: "oxygen-yoga-fitness-west-end-vancouver",
    images: [
      "https://images.unsplash.com/photo-1573384666979-2b1e35e7fe02?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?w=800&auto=format&fit=crop",
    ],
  },
  {
    slug: "stretch-yoga-studio-vancouver",
    images: [
      "https://images.unsplash.com/photo-1545389336-cf090694435e?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&auto=format&fit=crop",
    ],
  },
  {
    slug: "karma-teachers-yoga-vancouver",
    images: [
      "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800&auto=format&fit=crop",
    ],
  },
  {
    slug: "havyn-hot-studio-vancouver",
    images: [
      "https://images.unsplash.com/photo-1599447421416-3414500d18a5?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&auto=format&fit=crop",
    ],
  },
  {
    slug: "the-yoga-bar-vancouver",
    images: [
      "https://images.unsplash.com/photo-1588286840104-8957b019727f?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&auto=format&fit=crop",
    ],
  },
  {
    slug: "jaybird-yoga-studio-vancouver",
    images: [
      "https://images.unsplash.com/photo-1573384666979-2b1e35e7fe02?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1593811167562-9cef47bfc4d7?w=800&auto=format&fit=crop",
    ],
  },
  {
    slug: "open-door-yoga-east-vancouver",
    images: [
      "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1545389336-cf090694435e?w=800&auto=format&fit=crop",
    ],
  },
  {
    slug: "ashtanga-yoga-vancouver",
    images: [
      "https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?w=800&auto=format&fit=crop",
    ],
  },

  // ── TEACHERS ─────────────────────────────────────────────────────────────────
  {
    slug: "christie-baumgartner-yoga-vancouver",
    images: [
      "https://images.squarespace-cdn.com/content/v1/54c2e652e4b08c8849fc4718/1518970035395-WKDY2MOEWXQ0DQL03J3A/13-oxygen-DSC03225.jpg",
      "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&auto=format&fit=crop",
    ],
  },
  {
    slug: "annette-bailey-yoga-vancouver",
    images: [
      "https://annettebailey.ca/wp-content/uploads/2025/12/IMG_1991-scaled.jpg",
      "https://annettebailey.ca/wp-content/uploads/2025/12/IMG_1996-881x1024.jpg",
    ],
  },
  {
    slug: "ryan-leier-yoga-vancouver",
    images: [
      "https://images.squarespace-cdn.com/content/v1/684e2f1ee0d97f3dabd0699c/e59130ae-3b5a-4021-919f-828122fa2087/181206_Ryan_Leier_142.jpg",
      "https://images.squarespace-cdn.com/content/v1/684e2f1ee0d97f3dabd0699c/3c84ab31-81ec-43c7-a748-ec97a5ba37df/IMG_0766.JPG",
    ],
  },
  {
    slug: "fiona-stang-ashtanga-yoga-vancouver",
    images: [
      "https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=800&auto=format&fit=crop",
    ],
  },
  {
    slug: "natasha-samson-yoga-vancouver",
    images: [
      "https://natashasamsonyoga.com/wp-content/uploads/2023/05/NATASHA-232.jpg",
      "https://images.unsplash.com/photo-1545389336-cf090694435e?w=800&auto=format&fit=crop",
    ],
  },
  {
    slug: "dani-hebert-yoga-vancouver",
    images: [
      "https://images.squarespace-cdn.com/content/v1/66b2305f12f8ab112e42a8c3/5ad5e171-9a92-45a2-9bf4-c48fc9b6bcfc/IMG_0553.jpg",
      "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&auto=format&fit=crop",
    ],
  },
  {
    slug: "rachel-scott-yoga-vancouver",
    images: [
      "https://rachelyoga.com/wp-content/uploads/2026/03/RachelScott234-e1774378718805.jpg",
      "https://rachelyoga.com/wp-content/uploads/2025/10/about-1.webp",
    ],
  },
  {
    slug: "ana-yoga-vancouver",
    images: [
      "https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800&auto=format&fit=crop",
    ],
  },
  {
    slug: "susan-horning-unity-yoga-vancouver",
    images: [
      "https://images.squarespace-cdn.com/content/v1/62550646b2383d5105ab5d71/15025ef6-d818-4903-83a0-2848c15ecce4/DSC_5335.jpg",
      "https://images.unsplash.com/photo-1545389336-cf090694435e?w=800&auto=format&fit=crop",
    ],
  },
  {
    slug: "jessica-wampler-yoga-vancouver",
    images: [
      "https://jessicawampler.com/wp-content/uploads/2019/05/cropped-Jessica_EditPrayerFINAL_041819.jpg",
      "https://images.unsplash.com/photo-1573384666979-2b1e35e7fe02?w=800&auto=format&fit=crop",
    ],
  },
];

async function updateImages() {
  console.log("=== Update Images ===");
  console.log(`Updating ${imageUpdates.length} listings...\n`);

  let updated = 0;
  let errors = 0;

  for (const { slug, images } of imageUpdates) {
    const { error } = await supabase
      .from("listings")
      .update({ images })
      .eq("slug", slug);

    if (error) {
      console.error(`  ✗ ${slug}: ${error.message}`);
      errors++;
    } else {
      console.log(`  ✓ ${slug}`);
      updated++;
    }
  }

  console.log(`\nDone! Updated: ${updated}, Errors: ${errors}`);
}

updateImages().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
