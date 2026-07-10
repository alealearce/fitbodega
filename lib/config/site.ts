/**
 * lib/config/site.ts — FitBodega
 * Single source of truth for all brand, copy, and configuration.
 * Design system: "The Brutalist Sanctuary" — see tailwind.config.ts
 */

// ── Colors (must stay in sync with tailwind.config.ts) ──────────────────────
export const COLORS = {
  bg:               "#0e0e0e",
  surfaceLow:       "#131313",
  surfaceCard:      "#1a1a1a",
  primary:          "#d1fc00",
  primaryContainer: "#f4ffc6",
  onPrimary:        "#161900",
  secondaryContainer: "#262626",
  onSurface:        "#ffffff",
  onSurfaceVariant: "#9a9a9a",
  outlineVariant:   "#484847",
} as const;

// ── Site Identity ────────────────────────────────────────────────────────────
export const SITE = {
  name:        "FitBodega",
  shortName:   "FitBodega",
  tagline:     "The Fitness & Recovery Network",
  description: "The curated directory for recovery studios, gyms, coaches, nutritionists, and health food stores — starting in Vancouver. Sauna, cold plunge, strength, and everything your training demands.",
  domain:      "fitbodega.com",
  url:         "https://fitbodega.com",
  email:       "hello@fitbodega.com",
  supportEmail:"hello@fitbodega.com",
  fromEmail:   "FitBodega <hello@fitbodega.com>",
  social: {
    instagram: "https://www.instagram.com/fitbodegashop/",
    instagramSports: "https://www.instagram.com/fitbodegavancouverfc/",
  },
  logo:    "/images/logo.svg",
  favicon: "/images/favicon.png",
} as const;

// ── Default social share image ───────────────────────────────────────────────
// Served by app/[locale]/opengraph-image.tsx (Brutalist Sanctuary brand card).
export const DEFAULT_OG_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: `${SITE.name} — ${SITE.tagline}`,
} as const;

// ── Categories / Listing Types ───────────────────────────────────────────────
// id matches the ListingType in supabase/types.ts (singular)
export const LISTING_TYPES = [
  { id: "recovery",     label: "Recovery",          slug: "recovery",           icon: "R" },
  { id: "gym",          label: "Gyms & Studios",    slug: "gyms",               icon: "G" },
  { id: "trainer",      label: "Coaches & Trainers",slug: "trainers",           icon: "C" },
  { id: "club",         label: "Clubs",             slug: "clubs",              icon: "CL" },
  { id: "nutritionist", label: "Nutritionists",     slug: "nutritionists",      icon: "N" },
  { id: "store",        label: "Health Food Stores",slug: "health-food-stores", icon: "S" },
  { id: "youth",        label: "Youth Sports",      slug: "youth-sports",       icon: "Y" },
] as const;

export type ListingTypeId = typeof LISTING_TYPES[number]["id"];

// ── AI Chatbot ───────────────────────────────────────────────────────────────
export const CHATBOT = {
  name:     "Coach",
  persona:  "You are Coach, the concierge of FitBodega — the curated fitness and recovery network. You help visitors find recovery studios (sauna, cold plunge, cryo, float), gyms, coaches, nutritionists, health food stores, and youth sports programs. You speak with calm authority — direct, knowledgeable, zero fluff, like an elite trainer who respects people's time. Keep responses concise and useful.",
  greeting: "Welcome to FitBodega. I can point you to recovery studios, gyms, coaches, nutritionists, or youth sports programs in the network. What are you training for?",
  avatar:   "C",
} as const;

// ── Homepage Copy ────────────────────────────────────────────────────────────
export const COPY = {
  hero: {
    kicker:      "Explore the network",
    headline:    "CURATED\nSPACES.",
    subheadline: "Recovery studios, gyms, coaches, and nutrition — hand-picked for those who demand absolute excellence from their training and recovery.",
    cta:         "Explore Spaces",
    ctaSecondary:"Join the Network",
  },
  searchPlaceholder: "Search saunas, cold plunge, gyms, coaches...",
  featuredSection: {
    kicker:   "Partners",
    title:    "Featured spaces",
    subtitle: "High-performance sanctuaries, curated for the network.",
    cta:      "View all",
  },
  communitySection: {
    kicker:   "The Magazine",
    title:    "The Journal",
    subtitle: "The stories behind the city's spaces — how they started, how they train, where they're going.",
    cta:      "Read the Journal",
  },
  submitCta: {
    title:    "READY TO BE FOUND?",
    subtitle: "Own a recovery studio, gym, or practice? Join the curated network — claim your space in the directory.",
    cta:      "Submit Your Space",
  },
  footer: {
    tagline: "The Fitness & Recovery Network",
  },
} as const;

// ── Newsletter ───────────────────────────────────────────────────────────────
export const NEWSLETTER = {
  title:       "The Dispatch",
  description: "Recovery science, training intel, and new spaces in the network — weekly, no filler.",
  placeholder: "Your email address",
  cta:         "Subscribe",
} as const;

// ── Admin ────────────────────────────────────────────────────────────────────
export const ADMIN = {
  secret: process.env.ADMIN_SECRET ?? "",
  emails: ["hi@arce.ca"] as readonly string[],
} as const;

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN.emails.includes(email.toLowerCase());
}
