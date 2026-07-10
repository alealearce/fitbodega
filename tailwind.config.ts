/**
 * tailwind.config.ts — FitBodega
 * Design System: "The Brutalist Sanctuary"
 * Dark-mode default. Depth via tonal layering, never borders or shadows.
 * Every radius is 0 — sharpness is the system's signature.
 * Colors must stay in sync with COLORS in lib/config/site.ts
 */
import type { Config } from "tailwindcss";

// ── Surfaces (Level 0 → Level 2, per DESIGN.md tonal layering) ───────────────
const BG                    = "#0e0e0e"  // Level 0 — the void
const SURFACE_LOW           = "#131313"  // Level 1 — section shift
const SURFACE_CARD          = "#1a1a1a"  // Level 2 — cards / interaction
const SURFACE_BRIGHT        = "#2c2c2c"  // Level 2 alt — emphasized blocks
const SURFACE_HIGHEST       = "#262626"  // lifted elements, inputs

// ── Accent: electric lime ────────────────────────────────────────────────────
const PRIMARY               = "#d1fc00"  // electric lime — CTAs, accents
const PRIMARY_CONTAINER     = "#f4ffc6"  // pale lime — gradient partner
const ON_PRIMARY            = "#161900"  // near-black olive on lime

// ── Text & lines ─────────────────────────────────────────────────────────────
const ON_SURFACE            = "#ffffff"
const ON_SURFACE_VARIANT    = "#9a9a9a"
const OUTLINE_VARIANT       = "#484847"  // ghost borders — always used at low opacity
const SECONDARY_CONTAINER   = "#262626"
const ERROR                 = "#ff7351"

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    // Sharpness is non-negotiable: the entire radius scale collapses to 0
    // so no component can round a corner, even with rounded-full.
    borderRadius: {
      none: "0px",
      sm:   "0px",
      DEFAULT: "0px",
      md:   "0px",
      lg:   "0px",
      xl:   "0px",
      "2xl": "0px",
      "3xl": "0px",
      full: "0px",
    },
    extend: {
      colors: {
        bg:               BG,
        "surface-low":    SURFACE_LOW,
        "surface-card":   SURFACE_CARD,
        "surface-bright": SURFACE_BRIGHT,
        "surface-input":  SURFACE_HIGHEST,
        primary: {
          DEFAULT:   PRIMARY,
          container: PRIMARY_CONTAINER,
          on:        ON_PRIMARY,
        },
        "secondary-container": SECONDARY_CONTAINER,
        "on-surface":         ON_SURFACE,
        "on-surface-variant": ON_SURFACE_VARIANT,
        "outline-variant":    OUTLINE_VARIANT,
        error:                ERROR,
      },
      fontFamily: {
        // font-serif carries the display role app-wide (Manrope, per DESIGN.md)
        serif: ["var(--font-serif)", "Manrope", "system-ui", "sans-serif"],
        sans:  ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        "display-xl": ["clamp(3.5rem, 8vw, 6rem)", { lineHeight: "0.95", letterSpacing: "-0.03em", fontWeight: "800" }],
        "display-lg": ["3.5rem",  { lineHeight: "1.0",  letterSpacing: "-0.02em",  fontWeight: "800" }],
        "display-md": ["2.75rem", { lineHeight: "1.05", letterSpacing: "-0.02em",  fontWeight: "800" }],
        "display-sm": ["2rem",    { lineHeight: "1.1",  letterSpacing: "-0.01em",  fontWeight: "800" }],
        "label-md":   ["0.75rem", { lineHeight: "1.2",  letterSpacing: "0.1em",    fontWeight: "700" }],
        "label-sm":   ["0.6875rem", { lineHeight: "1.2", letterSpacing: "0.12em",  fontWeight: "700" }],
      },
      boxShadow: {
        // No drop shadows in this system — ambient tint glow only (4%)
        float: "0 0 60px 0 rgba(209, 252, 0, 0.04)",
        card:  "none",
        glow:  "0 0 60px 0 rgba(209, 252, 0, 0.04)",
      },
      backdropBlur: {
        glass: "20px",
      },
      backgroundImage: {
        // Signature texture for primary CTAs / hero accents
        "lime-gradient": `linear-gradient(135deg, ${PRIMARY_CONTAINER} 0%, ${PRIMARY} 100%)`,
        // Legibility scrim for photography-backed cards
        "card-scrim": "linear-gradient(180deg, rgba(14,14,14,0) 30%, rgba(14,14,14,0.92) 100%)",
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};

export default config;
