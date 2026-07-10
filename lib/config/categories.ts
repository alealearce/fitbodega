/**
 * lib/config/categories.ts — FitBodega
 * Training & recovery modality categories used for filtering listings.
 */

export interface Category {
  id:          string;
  slug:        string;
  label:       string;
  icon:        string;
  description: string;
  styles:      string[];  // sub-modalities / tags
}

export const CATEGORIES: Category[] = [
  {
    id:    "sauna",
    slug:  "sauna",
    label: "Sauna & Heat",
    icon:  "SA",
    description: "Traditional, infrared, and banya-style heat therapy.",
    styles: ["Infrared Sauna", "Traditional Sauna", "Banya", "Aufguss", "Steam Room"],
  },
  {
    id:    "coldplunge",
    slug:  "cold-plunge",
    label: "Cold Plunge & Contrast",
    icon:  "CP",
    description: "Ice baths, cold plunges, and contrast therapy circuits.",
    styles: ["Cold Plunge", "Ice Bath", "Contrast Therapy", "Cryotherapy"],
  },
  {
    id:    "recoverytech",
    slug:  "recovery-tech",
    label: "Recovery Tech",
    icon:  "RT",
    description: "Red light, hyperbaric, compression, and performance diagnostics.",
    styles: ["Red Light Therapy", "Hyperbaric Oxygen", "Compression Therapy", "Float Tank", "DEXA / VO2 Max", "IV Therapy"],
  },
  {
    id:    "strength",
    slug:  "strength",
    label: "Strength",
    icon:  "ST",
    description: "Barbell clubs, powerlifting, and hypertrophy-focused training floors.",
    styles: ["Powerlifting", "Olympic Weightlifting", "Bodybuilding", "Functional Strength"],
  },
  {
    id:    "conditioning",
    slug:  "conditioning",
    label: "HIIT & Conditioning",
    icon:  "HC",
    description: "High-intensity intervals, circuits, and metabolic conditioning.",
    styles: ["HIIT", "CrossFit", "Bootcamp", "Circuit Training", "Rowing"],
  },
  {
    id:    "combat",
    slug:  "combat",
    label: "Boxing & Combat",
    icon:  "BX",
    description: "Boxing, kickboxing, MMA, and martial arts gyms.",
    styles: ["Boxing", "Kickboxing", "Muay Thai", "MMA", "BJJ", "Judo"],
  },
  {
    id:    "mindbody",
    slug:  "mind-body",
    label: "Pilates & Mind-Body",
    icon:  "MB",
    description: "Pilates, yoga, mobility, and breathwork studios.",
    styles: ["Pilates", "Reformer Pilates", "Yoga", "Mobility", "Breathwork", "Stretching"],
  },
  {
    id:    "endurance",
    slug:  "endurance",
    label: "Endurance",
    icon:  "EN",
    description: "Run clubs, cycling studios, and endurance coaching.",
    styles: ["Running", "Cycling", "Spin", "Triathlon", "Swimming"],
  },
  {
    id:    "clubs",
    slug:  "clubs",
    label: "Clubs & Crews",
    icon:  "CC",
    description: "Community movement — run crews, ride groups, swim clubs, and social fitness collectives.",
    styles: [
      "Run Club", "Cycling Club", "Swim Club", "Masters Swim", "Triathlon Club",
      "Hiking & Trail", "Climbing Community", "Rowing & Paddling", "Dragon Boat",
      "Tennis & Pickleball", "Rec Sports League", "Social Wellness Club",
    ],
  },
  {
    id:    "bodywork",
    slug:  "bodywork",
    label: "Physio & Bodywork",
    icon:  "PB",
    description: "Physiotherapy, RMT, chiropractic, and athletic therapy.",
    styles: ["Physiotherapy", "RMT / Massage", "Chiropractic", "Athletic Therapy", "Acupuncture"],
  },
  {
    id:    "nutrition",
    slug:  "nutrition",
    label: "Nutrition",
    icon:  "NU",
    description: "Sports nutritionists, dietitians, and meal-prep services.",
    styles: ["Sports Nutrition", "Registered Dietitian", "Meal Prep", "Supplements", "Holistic Nutrition"],
  },
  {
    id:    "youthsports",
    slug:  "youth-sports",
    label: "Youth Sports",
    icon:  "YS",
    description: "Soccer clubs, academies, camps, and youth athletic development.",
    styles: ["Soccer Clubs", "Soccer Academies", "Camps", "Multi-Sport", "Athletic Development", "Private Coaching"],
  },
  {
    id:    "other",
    slug:  "other",
    label: "Other",
    icon:  "+",
    description: "Climbing, dance, aquatics, and everything else in the network.",
    styles: ["Climbing", "Dance", "Aquatics", "Golf Performance", "Skating"],
  },
];

// ── Back-compat aliases (legacy imports being migrated) ─────────────────────
export type YogaCategory = Category;
export const YOGA_CATEGORIES = CATEGORIES;

// ── Helpers ──────────────────────────────────────────────────────────────────
export function getCategoryById(id: string): Category | undefined {
  return CATEGORIES.find(c => c.id === id);
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return CATEGORIES.find(c => c.slug === slug);
}

// ── Listing-type specific filters ────────────────────────────────────────────
export const EXPERIENCE_LEVELS      = ["Beginner", "Intermediate", "Advanced", "All Levels"] as const;
export const LISTING_LANGUAGES      = [
  "English", "Spanish", "French", "German", "Portuguese", "Italian", "Dutch",
  "Russian", "Mandarin", "Cantonese", "Japanese", "Korean", "Hindi",
  "Tagalog", "Punjabi", "Farsi", "Arabic", "Hebrew", "Turkish", "Greek",
  "Polish", "Swedish", "Norwegian", "Danish", "Finnish", "Thai", "Vietnamese",
  "Indonesian", "Ukrainian", "Czech", "Hungarian", "Romanian",
] as const;
export const RETREAT_DURATIONS      = ["Drop-in", "Class Pack", "Monthly", "Annual"] as const;
export const PRODUCT_TYPES          = ["Supplements", "Equipment", "Apparel", "Recovery Gear", "Nutrition", "Accessories"] as const;
export const SCHOOL_CERTIFICATIONS  = ["Certified Coach", "Kinesiologist", "CSCS", "NSCA", "CanFitPro", "NCCP"] as const;
export const PRODUCT_CATEGORIES     = ["Supplements", "Training Equipment", "Recovery Gear", "Apparel", "Health Foods", "Books & Media", "Accessories"] as const;
