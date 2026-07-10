# FitBodega — Design Spec (BINDING)

Design system: **"The Brutalist Sanctuary"** — dark, editorial, Equinox-grade.
Source of truth for tokens: `tailwind.config.ts` + `lib/config/site.ts` (COLORS).
Full creative rationale: `/Users/alejandroarce/Claude Code/FITBODEGA.COM/IMAGES/Website style/DESIGN.md`

## Non-negotiables

1. **0px corners everywhere.** The Tailwind radius scale is already zeroed —
   never add inline `border-radius`, never use `style={{borderRadius}}`.
   Roundness is the enemy of this system.
2. **No 1px borders or divider lines.** Sectioning = background shifts between
   surface levels. If an input NEEDS a boundary for accessibility, use
   `style={{ boxShadow: "inset 0 0 0 1px rgba(72,72,71,0.3)" }}` (ghost border),
   never `border border-outline-variant`.
3. **No drop shadows, no hover:-translate-y lifts.** Hover = background tonal
   shift (`hover:bg-surface-input`, `hover:bg-surface-bright`) or text →
   `hover:text-primary`. `shadow-card` is mapped to none; do not add shadows.
4. **No emojis. Ever.** UI, emails, OG images, placeholders. Use lucide-react
   icons sparingly, or bold typography (first letter monograms). Typography first.
5. **No FAQ sections, no generic SaaS layouts.** Editorial magazine structure:
   aggressive whitespace, asymmetry, full-bleed imagery, typographic lists.

## Surfaces (tonal layering — "depth is felt, not seen")

- Level 0 page void: `bg-bg` (#0e0e0e)
- Level 1 section shift: `bg-surface-low` (#131313)
- Level 2 cards/interaction: `bg-surface-card` (#1a1a1a)
- Inputs / lifted: `bg-surface-input` (#262626), emphasis `bg-surface-bright` (#2c2c2c)
- Never `bg-white`, `bg-[#ffffff]`, or light backgrounds.

## Accent

- Electric lime `bg-primary` (#d1fc00) with `text-primary-on` (#161900) text.
- Pale partner `primary-container` (#f4ffc6); gradient CTA: `bg-lime-gradient`.
- Accent text (ratings, kickers, links-on-hover): `text-primary`.
- Errors: `text-error` (#ff7351).

## Typography

- Display headings: `font-serif` (= Manrope) + `font-extrabold` + `uppercase` +
  `tracking-tight`. Scale up aggressively: `text-display-xl/lg/md/sm`.
- Body/UI: `font-sans` (= Inter).
- Labels/kickers: `text-label-md` or `text-label-sm` + `uppercase` (pre-tracked).
- Kicker pattern used everywhere:
  ```tsx
  <div className="flex items-center gap-3 mb-4">
    <span className="w-7 h-[3px] bg-primary" aria-hidden />
    <p className="font-sans text-label-md uppercase text-primary">Kicker text</p>
  </div>
  ```

## Components

- **Primary button:** `px-8 py-4 bg-primary text-primary-on font-sans text-sm font-bold tracking-wide uppercase hover:opacity-90` (or `bg-lime-gradient` for hero CTAs).
- **Secondary button:** transparent bg + ghost border via inset box-shadow + `uppercase`.
- **Chips/filters:** rectangular. Unselected `bg-surface-input text-on-surface`, selected `bg-primary text-primary-on`, both `text-label-sm uppercase px-4 py-2.5`.
- **Cards:** photography-first with `bg-card-scrim` overlay for text legibility; text overlaid at image base. See `components/directory/ListingCard.tsx` for the canonical example.
- **Lists:** separate with 24–32px whitespace, never `divide-y`, never `border-b`. Big typographic index rows (see "The Index" on the homepage `app/[locale]/page.tsx`).
- **Inputs:** `bg-surface-input` block, no border; focus state = ghost-border inset shadow in lime at 40%: `focus:shadow-[inset_0_0_0_1px_rgba(209,252,0,0.4)]`.
- **Nav/overlays:** `bg-bg/70 backdrop-blur-glass`.

## Brand & voice

- Site: FitBodega — "The Fitness & Recovery Network". Vancouver-first, network open worldwide.
- Six listing types (ids are code contracts): `recovery`, `gym`, `trainer`, `nutritionist`, `store`, `youth`.
- Hub routes: `/recovery`, `/gyms`, `/trainers`, `/nutritionists`, `/health-food-stores`, `/youth-sports`.
- Blog = "The Journal" (index at `/community`, posts at ROOT `/:slug` — never `/community/:slug` or `/blog/:slug`).
- Chatbot: "Coach" — calm authority, elite-trainer tone, concise.
- Copy voice: confident, terse, editorial. "Curated spaces." "The sanctuary of
  performance." No exclamation marks, no "amazing/awesome", no hedging.
- Old yoga routes are dead: any `/yogastudio|/studios|/yogateacher|/teachers|/yogaschool|/schools|/retreatcenter|/retreats|/yogaproducts|/products|/yogaworkshops|/workshops|/resources|/services/*` link must be remapped to the six hubs above.
