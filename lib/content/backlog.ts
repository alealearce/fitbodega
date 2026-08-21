// The Tue/Thu editorial backlog (CONTENT-STRATEGY.md is the readable copy).
// The weekly cron works through this list IN ORDER per track, skipping any
// slug that already exists in blog_posts.
//
// `auto: false` marks pieces the machine must never write on its own:
// anything that names real people (list pieces need a research pass),
// anything claiming first-person experience (the owner's voice), anything
// citing specific figures or datasets (a model would invent them), and any
// case study (needs a real deal and the participant's OK). Those get written
// in working sessions and slot into the same schedule.

export interface BacklogTopic {
  slug: string;
  track: 'for_creators' | 'for_brands';
  title: string;      // working title — the model may sharpen it
  angle: string;      // the argument the piece must actually make
  auto: boolean;
}

export const BACKLOG: BacklogTopic[] = [
  // ── For Creators (Tuesdays) ────────────────────────────────────────────────
  {
    slug: 'how-to-pitch-a-brand-as-a-fitness-creator',
    track: 'for_creators',
    title: 'How to pitch a brand as a fitness creator',
    angle:
      'The pitch is a business proposal, not a compliment. Covers: researching what the brand already buys, leading with an idea not a rate card, and the spec-work question — making the content first and pitching with it, when that wins and when it undersells you.',
    auto: true,
  },
  {
    slug: 'how-ai-automates-the-unpaid-half-of-creator-work',
    track: 'for_creators',
    title: 'How AI can automate the unpaid half of creator work',
    angle:
      'The paid work is the content; the unpaid work is research, outreach, briefs, invoices, repurposing. Where AI genuinely saves hours (drafts, transcripts, repackaging), where it fails (voice, judgment, relationships), and a workflow to steal.',
    auto: true,
  },
  {
    slug: 'engagement-math-small-creators-out-earn-big-ones',
    track: 'for_creators',
    title: 'Why a 40K-follower creator often out-earns a 400K one',
    angle:
      'The engagement math brands are slowly learning: rate scales with followers, results scale with trust. Explain the mechanism (reach decay, audience dilution, niche density) without invented statistics — first-principles arithmetic with illustrative, clearly hypothetical numbers.',
    auto: true,
  },
  {
    slug: 'usage-rights-101-for-creators',
    track: 'for_creators',
    title: 'Usage rights 101: the contract clause worth more than the post',
    angle:
      'What usage rights are, why paid usage in ads is a separate product from the post, duration and whitelisting and exclusivity, and the questions to ask before signing. General contract literacy — explicitly not legal advice.',
    auto: true,
  },
  {
    slug: 'whitelisting-explained-for-creators',
    track: 'for_creators',
    title: 'Whitelisting explained: why the ad runs from your handle',
    angle:
      "What whitelisting/allowlisting is, why brands pay extra for it (the ad wears the creator's credibility), what it costs the creator (comment section, audience fatigue), and how to price it.",
    auto: true,
  },
  {
    slug: 'ugc-vs-influencer-posts-two-different-products',
    track: 'for_creators',
    title: 'UGC vs. influencer posts: two products, two prices, one confusion',
    angle:
      'UGC sells production (content the brand runs on its own channels); influencer posts sell distribution (your audience). Different deliverables, different pricing logic, and why conflating them costs creators money.',
    auto: true,
  },
  {
    slug: 'mid-tier-creator-arbitrage-fitness',
    track: 'for_creators',
    title: 'The mid-tier arbitrage: why 10K-100K is underpriced',
    angle:
      'Why the 10K-100K tier is the most underpriced inventory in fitness marketing right now — priced like beginners, converting like professionals — and how creators in that band should negotiate while the window lasts.',
    auto: true,
  },
  {
    slug: 'read-your-own-media-kit-like-a-buyer',
    track: 'for_creators',
    title: 'Read your own media kit the way a media buyer reads it',
    angle:
      'What a buyer scans for in the first thirty seconds, the vanity metrics they ignore, the numbers they actually price against, and how to rebuild the kit around proof instead of totals.',
    auto: true,
  },
  // Session-only creator pieces — never auto-written.
  {
    slug: 'anatomy-of-a-creator-deal',
    track: 'for_creators',
    title: 'Anatomy of a creator deal: brief, rate, rights, results',
    angle: 'A real anonymized campaign, with permission. Needs an actual deal from the board.',
    auto: false,
  },
  {
    slug: 'what-fitness-creators-charge-2026',
    track: 'for_creators',
    title: 'What fitness creators actually charge in 2026',
    angle: 'Rates by follower tier. Needs sourced public rate surveys and interviews — figures must never be invented.',
    auto: false,
  },

  // ── For Brands (Thursdays) ─────────────────────────────────────────────────
  {
    slug: 'how-to-work-with-fitness-creators',
    track: 'for_brands',
    title: 'How to work with fitness creators: the operating guide',
    angle:
      'The end-to-end operating model: pick by audience fit not follower count, brief outcomes not scripts, pay stated rates, measure beyond likes, build rosters not one-offs. The piece a brand reads before posting its first deal.',
    auto: true,
  },
  {
    slug: 'four-numbers-that-predict-creator-conversion',
    track: 'for_brands',
    title: 'Follower count is the worst metric you are buying',
    angle:
      'The four signals that predict whether a creator converts: engagement depth (comments over likes), audience overlap with your buyer, content consistency, and proof of prior conversion. Mechanism over invented benchmarks.',
    auto: true,
  },
  {
    slug: 'the-one-post-problem',
    track: 'for_brands',
    title: 'The one-post problem: why single creator posts rarely pay back',
    angle:
      'Frequency builds familiarity; one post is a cold impression with a celebrity markup. What a real test looks like: multiple touches, one creator cohort, a measurement window, and a kill criterion.',
    auto: true,
  },
  {
    slug: 'how-to-read-a-creator-media-kit',
    track: 'for_brands',
    title: 'How to read a creator media kit like a media buyer',
    angle:
      'Red flags (round numbers, screenshots without dates, reach without engagement), vanity metrics to ignore, and the specific things to ask for instead — recent post analytics, audience geography, prior brand work.',
    auto: true,
  },
  {
    slug: 'dead-audience-detection',
    track: 'for_brands',
    title: 'Dead audience detection: spotting bought followers before you spend',
    angle:
      'Five checks anyone can run without tools: engagement shape, comment quality, follower-growth pattern, audience-to-view ratio, and the geography sniff test. Frame as diligence, not accusation.',
    auto: true,
  },
  {
    slug: 'gifting-vs-paying-creators',
    track: 'for_brands',
    title: 'Gifting vs. paying: when free product works and when it insults',
    angle:
      'Gifting works as discovery at the small end and fails as compensation everywhere else. Where the line sits, why "exposure" offers poison the well, and what a hybrid (product + fee + commission) looks like.',
    auto: true,
  },
  {
    slug: 'cac-math-for-supplement-brands',
    track: 'for_brands',
    title: 'CAC math for supplement brands buying creator content',
    angle:
      'How to compute what a creator post must produce to beat your paid-social baseline — the formula and the mechanism with clearly hypothetical worked examples, never presented as industry benchmarks.',
    auto: true,
  },
  {
    slug: 'gym-owners-and-local-influencers',
    track: 'for_brands',
    title: 'Why gym owners waste money on local influencers',
    angle:
      'The mismatch: local businesses buying reach that is mostly out of area. The cheaper play — member content, coach-led content, and micro-local creators whose audience actually lives within driving distance.',
    auto: true,
  },
  {
    slug: 'retreats-recovery-studios-creator-content-opportunity',
    track: 'for_brands',
    title: 'Retreats and recovery studios are sitting on the best content opportunity in fitness',
    angle:
      'Physical spaces photograph and film better than products; every guest is a potential creator session. Why experiential fitness businesses under-use creator content and how a content-for-stay structure works honestly.',
    auto: true,
  },
  // Session-only brand pieces — never auto-written.
  {
    slug: 'spark-ads-vs-organic-tiktok',
    track: 'for_brands',
    title: 'Spark Ads vs. organic posts on TikTok',
    angle: 'Premise cites platform data — needs the actual sources pulled first.',
    auto: false,
  },
  {
    slug: 'fifteen-years-of-ad-buying-vs-creator-content',
    track: 'for_brands',
    title: 'What 15 years of buying ads taught me about buying creator content',
    angle: "The owner's voice and the owner's experience. Drafted from his notes only.",
    auto: false,
  },
];

/** Next unwritten auto topic for a track, in backlog order. */
export function nextAutoTopic(
  track: BacklogTopic['track'],
  existingSlugs: Set<string>
): BacklogTopic | null {
  return (
    BACKLOG.find((t) => t.track === track && t.auto && !existingSlugs.has(t.slug)) ?? null
  );
}
