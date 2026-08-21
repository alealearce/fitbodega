# FitBodega — Content Strategy

Goal: connect with the two sides of the network. Every piece either helps a
creator get paid or helps a brand buy creator content well. Set 2026-08-20.

## The week

| Day | Channel | What |
|-----|---------|------|
| Mon | Social (4 platforms) | Top-100 spotlight: one person, then see-the-full-list |
| Tue | Journal + social | Post **for creators** publishes, share carousel goes out |
| Wed | Social | Top-100 spotlight |
| Thu | Journal + social | Post **for brands** publishes, share carousel goes out |

Blog posts land ONLY Tuesday and Thursday. The daily AI blog cron is
retired (removed from vercel.json 2026-08-20; the route stays for manual
use). Two posts a week, written properly, beats seven written by nobody.

## How a weekly post happens (fully automated — owner decision 2026-08-20)

The `/api/social/weekly` cron (Tue/Thu, 9am PT — 16:00 UTC, so winter runs
land 8am PST) does everything:

1. **Flip** any due scheduled post live (session-written pieces preempt the
   writer just by being scheduled with `published_at`).
2. **Write** — if nothing is scheduled and nothing fresh, it writes the next
   `auto: true` topic from `lib/content/backlog.ts` (Tue = for_creators,
   Thu = for_brands), publishes it with a branded cover.
3. **Share** — posts the carousel: title slide, 3-point TL;DR, link slide.
   Idempotent via `social_posts`; old posts are never re-shared.

The writer runs under hard honesty rules (`lib/content/generate.ts`): no
named people or brands, no invented statistics or citations, illustrative
numbers only, no first-person claims. Topics that cannot be written under
those rules are `auto: false` — the cron skips them; they get written in
working sessions and scheduled into the same slots.

## Mon/Wed Top-100 spotlights

`/api/social/weekly` (Mon/Wed, 9am PT) rotates through all nine lists —
influencers, gyms, coaches, retreats, Hyrox, recovery, nutritionists, run
clubs, stores — round-robin down the ranks. Slides: the entry (ghost rank numeral, no photos —
we hold no image rights), why they rank, see-the-full-list CTA. Captions
carry at most five hashtags (owner rule). Every claim
comes from the list JSON; the post can only say what the ranking page says.
Idempotency key: `social_posts` kind `top100`, ref_slug `<list>#<rank>`.

## Hard rules (from the owner, standing)

- **Honesty over impressiveness.** Never invent people, campaigns, rates,
  or results. List pieces name real people only after real research.
- **First-person pieces carry the owner's actual experience** ("what 15
  years of buying ads taught me") — drafted from his notes, never invented.
- Rate/number pieces cite sources (public rate surveys, named studies,
  creator interviews we actually did).
- Anonymized case studies ("anatomy of a creator deal") only from real
  deals, with the participant's OK.
- No emojis anywhere. Journal voice: confident, terse, editorial.

## Backlog — For Creators (Tuesdays)

Recurring themes: how to pitch, how to price, how to use AI without
sounding like it, what a real deal looks like.

1. How to pitch a brand (and the spec-work question: should you make the
   content first and pitch with it?)
2. How AI can automate the unpaid half of creator work
3. Anatomy of a creator deal: brief, rate, rights, results from one real
   campaign (anonymized, with permission)
4. Why a 40K-follower creator often out-earns a 400K one — the engagement math
5. What fitness creators actually charge in 2026: rates by follower tier
   (public rate surveys + interviews — sourced, not invented)
6. How to read your own media kit like a media buyer reads it
7. Usage rights 101: the contract clause worth more than the post
8. Whitelisting explained: why the ad runs from your handle, not theirs
9. UGC vs. influencer posts: two products, two prices, one confusion
10. The mid-tier arbitrage: why 10K–100K is the most underpriced inventory
    in fitness marketing

## Backlog — For Brands (Thursdays)

Recurring themes: how to buy creator content like a media buyer, what the
metrics mean, where the underpriced attention is.

1. How to work with creators (the operating guide)
2. Follower count is the worst metric you're buying — the 4 numbers that
   predict conversion
3. The one-post problem: why single creator posts almost never pay back
4. How to read a creator's media kit like a media buyer — red flags and
   what to ask for instead
5. Dead audience detection: 5 ways to spot bought followers
6. Gifting vs. paying: when free product works and when it insults everyone
7. Spark Ads vs. organic posts: what TikTok's own data says
8. CAC math for supplement brands: what a creator post must produce to beat
   your Meta ads
9. Why gym owners waste money on local influencers — and the cheaper play
10. What 15 years of buying Google and Meta ads taught me about buying
    creator content (owner's voice)
11. Why fitness retreats and recovery studios are sitting on the best
    creator content opportunity in the industry
12. Example campaigns that worked — only once we have real ones to cite

## Backlog — List pieces (anchor content, either day)

These are the proven click-earners (ranked lists + named entities). Each
needs a real research pass before writing — no invented names.

1. 25 Canadian fitness creators brands should be paying attention to (anchor)
2. 15 Vancouver fitness creators under 50K punching above their weight
3. The 10 best run-club accounts in Canada — why brands should care about crews
4. 12 recovery and longevity creators who aren't selling snake oil
5. 10 fitness creators over 40 building the most trusting audiences
6. 8 Latin/Spanish-language fitness creators reaching an audience most
   brands ignore
7. The 10 most brand-ready micro-creators in Canadian fitness — and what
   "brand-ready" means
8. 12 coaches who turned a gym floor into a media brand

List pieces double as outreach: every named creator is a warm contact for
the network ("you're on our list — claim your profile").

## Journal search

Live at /community — searches title, excerpt, and body. Categories
`for_creators` / `for_brands` are filter chips so each audience can read
its own track end to end.
