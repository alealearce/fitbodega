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
  description: "FitBodega ranks fitness creators and tracks the brands paying for creator content — then connects the two. Weekly deal board, the FitBodega 100, free for both sides.",
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
    kicker:      "The Fitness Creator Network",
    headline:    "Where brands meet training culture.",
    subheadline: "FitBodega ranks fitness creators and tracks the brands actively paying for creator content — then connects the two.",
    cta:         "Join the Deal Radar",
    ctaSecondary:"Post a deal",
  },
  searchPlaceholder: "Search by city, coach, gym, cold plunge...",
  loopSection: {
    // The title rides the kicker line — no separate display heading here.
    title:   "How the Deal Radar works",
    body:    "Brands post deals on our network. Once our team approves a deal by hand, we email the creators who have joined the Deal Radar, and they take it. Free on both sides.",
    intel:   "We also track where brands are already spending, so creators know who's buying even before a deal is posted here.",
    cta:     "See the full board",
  },
  communitySection: {
    kicker:   "The Magazine",
    title:    "The Journal",
    subtitle: "The stories behind the creators, coaches, and the industry shaping training culture — and what's next.",
    cta:      "Read the Journal",
  },
  spotlightBanner: {
    kicker:   "Creator Spotlight",
    headline: "GET RANKED. GET FEATURED.",
    body:     "Complete a profile and brands browsing the network can find you. Profiles are the shortlist for the FitBodega 100, for Journal features, and for our social channels.",
    cta:      "Complete your profile",
  },
  getFeaturedSection: {
    kicker:   "For gyms, studios & coaches",
    title:    "Get featured in the network",
    body:     "Gyms, studios, coaches, and recovery spaces that join the network get a reviewed listing. Stand-out spaces are showcased in the Journal and across FitBodega's social channels.",
    cta:      "List your space",
  },
  footer: {
    tagline: "The Fitness Creator Network",
  },
} as const;

// ── Proof bar ────────────────────────────────────────────────────────────────
// Homepage numbers. Ships OFF and stays off until every figure below is a real
// number worth showing — no placeholders, no rounding up, nothing rendered
// while `enabled` is false. Turn it on by setting enabled to true and filling
// each stat's `value` from the live data.
export const PROOF_BAR = {
  enabled: false,
  stats: [
    { key: "creators", label: "Creators on the Radar", value: "" },
    { key: "brands",   label: "Brands tracked",        value: "" },
    { key: "deals",    label: "Deals sent",            value: "" },
    { key: "weeks",    label: "Weeks published",       value: "" },
  ],
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
