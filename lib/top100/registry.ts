// Server-side only — imports every list JSON; never import from client components.
import type { ListingType } from "@/lib/supabase/types";
import gyms from "@/data/top-100/gyms.json";
import recovery from "@/data/top-100/recovery.json";
import retreats from "@/data/top-100/retreats.json";
import stores from "@/data/top-100/stores.json";
import runclubs from "@/data/top-100/runclubs.json";
import coaches from "@/data/top-100/coaches.json";
import nutritionists from "@/data/top-100/nutritionists.json";
import hyrox from "@/data/top-100/hyrox.json";
import influencers from "@/data/top-100/fitness-influencers.json";
import van50 from "@/data/top-100/van50.json";

// The nine claimable lists of the FitBodega 100. Retreats map to
// 'recovery' — the closest directory home for wellness resorts. The two
// person lists (hyrox athletes, fitness influencers) map to 'trainer' by
// decision 2026-08-05: they teach people how to train online.

export type Top100Entry = {
  rank: number;
  name: string;
  segment: string;
  city?: string;
  country?: string;
  score: number;
  who: string;
  why: string;
  website?: string | null;
  handles?: Record<string, string>;
};

type ListData = {
  meta: { title: string; updated: string };
  entries: Top100Entry[];
  bubblingUnder?: { name: string }[];
};

export type ClaimableListId =
  | "gyms"
  | "recovery"
  | "retreats"
  | "stores"
  | "runclubs"
  | "coaches"
  | "nutritionists"
  | "hyrox"
  | "influencers"
  | "van50";

export const CLAIMABLE_LISTS: Record<
  ClaimableListId,
  {
    title: string;       // full list title for pages and emails
    badgeLabel: string;  // short uppercase line on the badge SVG
    page: string;        // list page path
    listingType: ListingType;
    data: ListData;
  }
> = {
  gyms: {
    title: "Top 100 Gyms in the World 2026",
    badgeLabel: "TOP 100 GYMS",
    page: "/top-100-gyms",
    listingType: "gym",
    data: gyms as unknown as ListData,
  },
  recovery: {
    title: "Top 100 Recovery Spaces 2026",
    badgeLabel: "TOP 100 RECOVERY SPACES",
    page: "/top-100-recovery-spaces",
    listingType: "recovery",
    data: recovery as unknown as ListData,
  },
  retreats: {
    title: "Top 100 Fitness Retreats & Wellness Resorts 2026",
    badgeLabel: "TOP 100 FITNESS RETREATS",
    page: "/top-100-fitness-retreats",
    listingType: "recovery",
    data: retreats as unknown as ListData,
  },
  stores: {
    title: "Top 100 Health Food Stores 2026",
    badgeLabel: "TOP 100 HEALTH FOOD STORES",
    page: "/top-100-health-food-stores",
    listingType: "store",
    data: stores as unknown as ListData,
  },
  runclubs: {
    title: "Top 100 Run Clubs & Fitness Crews 2026",
    badgeLabel: "TOP 100 RUN CLUBS",
    page: "/top-100-run-clubs",
    listingType: "club",
    data: runclubs as unknown as ListData,
  },
  coaches: {
    title: "Top 100 Online Fitness Coaches 2026",
    badgeLabel: "TOP 100 ONLINE COACHES",
    page: "/top-100-online-fitness-coaches",
    listingType: "trainer",
    data: coaches as unknown as ListData,
  },
  nutritionists: {
    title: "Top 100 Nutritionists 2026",
    badgeLabel: "TOP 100 NUTRITIONISTS",
    page: "/top-100-nutritionists",
    listingType: "nutritionist",
    data: nutritionists as unknown as ListData,
  },
  hyrox: {
    title: "Top 100 Hyrox Athletes to Follow 2026",
    badgeLabel: "TOP 100 HYROX ATHLETES",
    page: "/top-100-hyrox-athletes",
    listingType: "trainer",
    data: hyrox as unknown as ListData,
  },
  influencers: {
    title: "Top 100 Fitness Influencers 2026",
    badgeLabel: "TOP 100 FITNESS INFLUENCERS",
    page: "/top-100-fitness-influencers",
    listingType: "trainer",
    data: influencers as unknown as ListData,
  },
  // City edition — ledger page at /top-50-fitness-influencers-vancouver
  // (static route shadows the old journal-post slug; same URL, same claims).
  van50: {
    title: "Top 50 Fitness Influencers in Vancouver 2026",
    badgeLabel: "TOP 50 VANCOUVER INFLUENCERS",
    page: "/top-50-fitness-influencers-vancouver",
    listingType: "trainer",
    data: van50 as unknown as ListData,
  },
};

export function isClaimableList(list: string): list is ClaimableListId {
  return list in CLAIMABLE_LISTS;
}

export function getEntry(list: ClaimableListId, rank: number): Top100Entry | null {
  return CLAIMABLE_LISTS[list].data.entries.find((e) => e.rank === rank) ?? null;
}

export function getEntryByName(list: ClaimableListId, name: string): Top100Entry | null {
  const target = name.trim().toLowerCase();
  return (
    CLAIMABLE_LISTS[list].data.entries.find(
      (e) => e.name.trim().toLowerCase() === target
    ) ?? null
  );
}
