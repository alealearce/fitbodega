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
  tagline:     "The Fitness Creator Network",
  description: "The fitness creator marketplace: brand deals, UGC briefs, and ambassador programs creators can take today — free to browse, free for brands to post. Plus the FitBodega 100 rankings, the Journal, and the curated directory of gyms, recovery studios, and coaches.",
  domain:      "fitbodega.com",
  url:         "https://fitbodega.com",
  email:       "hello@fitbodega.com",
  supportEmail:"hello@fitbodega.com",
  fromEmail:   "FitBodega <hello@fitbodega.com>",
  social: {
    instagram: "https://www.instagram.com/fitbodegashop/",
    tiktok: "https://www.tiktok.com/@fitbodegashop",
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

// ── Member Spotlight story questions ─────────────────────────────────────────
// Asked at submission and editable from the dashboard. Answers live in
// listings.founder_story (jsonb, keyed by `key`). Public framing is always
// "Member Spotlight" — never "story". Tune wording here; form, admin, and
// the generation prompt all read from this constant.
export const FOUNDER_QUESTIONS = [
  { key: "origin",     label: "What first brought you to this work?" },
  { key: "leap",       label: "What made you open your doors — or go out on your own?" },
  { key: "hard_truth", label: "What's the hardest part of this work that most people never see?" },
  { key: "train_with", label: "When and where can people train with you? Hours, drop-in details, how to book a first session." },
  { key: "why_you",    label: "Why train with you and not anyone else? Say it straight." },
  { key: "feeling",    label: "What do you want people to feel when they walk out?" },
] as const;
export type FounderQuestionKey = (typeof FOUNDER_QUESTIONS)[number]["key"];

// ── AI Chatbot ───────────────────────────────────────────────────────────────
export const CHATBOT = {
  name:     "Coach",
  persona:  "You are Coach, the concierge of FitBodega — the fitness creator network. FitBodega ranks the creators shaping training culture (the FitBodega 100), tells their stories in the Journal, connects fitness brands with creators for measured campaigns, and runs a curated directory of recovery studios, gyms, coaches, nutritionists, health food stores, clubs, and youth sports programs. You speak with calm authority — direct, knowledgeable, zero fluff, like an elite trainer who respects people's time. Keep responses concise and useful.",
  greeting: "Welcome to FitBodega. I can point you to the FitBodega 100 rankings, the creator and brand programs, or the directory — recovery studios, gyms, coaches, and more. What are you looking for?",
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
  searchPlaceholder: "Search by city, coach, gym, cold plunge...",
  featuredSection: {
    kicker:   "Featured in the Index",
    title:    "Featured spaces",
    subtitle: "Curated high-performance sanctuaries.",
    cta:      "View all",
  },
  communitySection: {
    kicker:   "The Magazine",
    title:    "The Journal",
    subtitle: "The stories behind the creators, coaches, and the industry shaping training culture — and what's next.",
    cta:      "Read the Journal",
  },
  brandsSection: {
    kicker:   "For Brands",
    title:    "Post your deal. Free.",
    body:     "Hiring fitness creators? Put your UGC brief, paid collab, or ambassador program on the board. Every deal is reviewed by hand, ranked with everything else we track, and sent to subscribed creators in the weekly Deal Radar email.",
    cta:      "Post a deal",
  },
  spotlightBanner: {
    kicker:   "Creator Spotlight",
    headline: "GET RANKED. GET FEATURED.",
    body:     "Creators who join the network get considered for the FitBodega 100, profiled in the Journal, featured across our channels — and first look when brand deals come through the network.",
    cta:      "Join as a Creator",
  },
  submitCta: {
    title:    "THE LOOP.",
    subtitle: "Brands post deals. Creators take them. Free on both sides, reviewed by hand in the middle.",
    ctaBrands:   "Post a Deal",
    ctaCreators: "For Creators",
    listLink:    "Own a gym or studio? List your space",
  },
  footer: {
    tagline: "The Fitness Creator Network",
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
