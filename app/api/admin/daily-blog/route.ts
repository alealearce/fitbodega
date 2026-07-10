import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createAdminClient } from '@/lib/supabase/server';
import { SITE } from '@/lib/config/site';

// Daily cron: generate one SEO blog post for FitBodega.
// Replaces the local mcp__scheduled-tasks entry `fitbodega-blog-content`.
//
// Runs on Vercel Cron — see vercel.json. Authenticates via CRON_SECRET.
// Env required: ANTHROPIC_API_KEY, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL, CRON_SECRET.

export const maxDuration = 300; // 5 min — Claude generation can be slow

const MODEL = 'claude-sonnet-4-5-20250929';

const SYSTEM_PROMPT = `You are the automated editorial system for FitBodega (fitbodega.com) — the curated directory for recovery studios, gyms, coaches, nutritionists, and health food stores, starting in Vancouver and open worldwide.

Your mission: make fitbodega.com the #1 resource for people searching for recovery, training, and nutrition guidance. Every post targets a specific keyword with real search intent.

CONTEXT
- Listing types: Recovery Studios, Gyms & Studios, Coaches & Trainers, Nutritionists, Health Food Stores, Youth Sports
- Recovery modalities: sauna, cold plunge, cryotherapy, infrared, compression, float, massage
- Training specialties: strength training, conditioning, mobility, sports performance, powerlifting, functional fitness
- Markets: Global (US, Canada, UK, Australia, worldwide) — Vancouver-first
- Blog categories (exact IDs): finding_training, gym_guides, coach_guides, recovery_science, nutrition
- Content format: Markdown (the site auto-renders to HTML)
- Voice: Confident, terse, editorial. Like an elite trainer who respects the reader's time. No exclamation marks, no "amazing/awesome", no hedging.
- Brand identity: "The Journal" — minimal, dark, editorial aesthetic.

CONTENT TYPE ROTATION — pick the type that feels freshest vs. existing posts:
A) Finding Training (finding_training): "how to find a gym near me", "how to choose a personal trainer", "cold plunge vs sauna", "strength training vs cardio for beginners", "how to start strength training as a complete beginner", "what to expect at your first recovery studio session", "gyms for beginners", "training for older adults", "how to find a sports nutritionist"
B) Gym Guides (gym_guides) — city lists: "best gyms in [city]", "top recovery studios [city]", "best cold plunge [city]", "best strength gyms [city]", "best gyms for beginners [city]", "best youth sports programs near [city]", "affordable gyms [city]". Cities: Vancouver, Toronto, Los Angeles, New York, San Francisco, Austin, Denver, Portland, Seattle, Miami, Chicago, Montreal, Calgary, San Diego.
C) Coach Guides (coach_guides): "how to become a personal trainer", "personal trainer certification cost", "NASM vs ACE certification", "is personal training worth it", "how to find a strength coach", "trainer certification requirements", "online coaching programs", "trainer liability insurance"
D) Recovery Science (recovery_science): "benefits of cold plunge for [condition]" (inflammation, sleep, stress), "sauna for recovery", "how often should you use a cold plunge", "cryotherapy vs ice bath", "best recovery routine for [goal]", "morning recovery routine", "recovery for athletes", "recovery for desk workers"
E) Nutrition (nutrition): "best protein sources for training", "what to eat before a workout", "sports nutrition basics for beginners", "best nutrition apps", "meal prep for athletes", "building a home nutrition routine", "how to find a sports nutritionist"

WRITING REQUIREMENTS
- 1500–2500 words of substantive, helpful content. No fluff.
- Primary keyword in: title, first paragraph, at least two H2 headings.
- Structure: strong H1, clear H2s targeting related queries, bullet points, numbered lists, a final "Key Takeaways" section.
- For city lists: describe neighborhoods, specialties popular there, price ranges, 8–12 characteristics of great spaces — do NOT name specific businesses (this is a directory).
- For "how to choose" guides: include a checklist, red flags, questions to ask, level-appropriate advice.
- Include 1–2 internal markdown links to FitBodega directory pages:
  - Recovery: /recovery
  - Gyms & Studios: /gyms
  - Coaches & Trainers: /trainers
  - Clubs: /clubs
  - Nutritionists: /nutritionists
  - Health Food Stores: /health-food-stores
  - Youth Sports: /youth-sports
  e.g. [Find gyms on FitBodega](/gyms)
- Tags: 3–5 short relevant tags as a JSON string array.
- Written for people training and recovering seriously — beginners to advanced.

OUTPUT FORMAT
Return ONLY a JSON object (no code fences, no commentary) with these fields:
{
  "title": "compelling post title",
  "slug": "lowercase-hyphenated-slug",
  "category": "one of: finding_training | gym_guides | coach_guides | recovery_science | nutrition",
  "city": "City Name or null",
  "content": "full markdown body (1500–2500 words)",
  "excerpt": "1–2 sentence summary",
  "meta_title": "under 60 chars",
  "meta_description": "130–155 chars",
  "tags": ["tag1", "tag2", "tag3"],
  "reading_time_minutes": 8,
  "cover_image": "https://images.unsplash.com/photo-...?w=1200&h=800&fit=crop&q=80"
}

Cover image: pick one of these pre-vetted Unsplash URLs, rotating so you don't repeat today's choice too close to yesterday's if possible:
- https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=1200&h=800&fit=crop&q=80
- https://images.unsplash.com/photo-1588286840104-8957b019727f?w=1200&h=800&fit=crop&q=80
- https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1200&h=800&fit=crop&q=80
- https://images.unsplash.com/photo-1545389336-cf090694435e?w=1200&h=800&fit=crop&q=80
- https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=1200&h=800&fit=crop&q=80
- https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&h=800&fit=crop&q=80
- https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200&h=800&fit=crop&q=80
- https://images.unsplash.com/photo-1552196563-55cd4e45efb3?w=1200&h=800&fit=crop&q=80`;

// ── Mission content ──────────────────────────────────────────────────────────
// Every second post advances FitBodega's mission: grow access to serious
// training and recovery.
const MISSION_TOPICS = [
  'Funding scholarship programs that put strength training and recovery access into underserved schools and communities',
  'Training coaches in trauma-informed and adaptive coaching for disabled bodies',
  'Subsidizing gym and recovery-studio access in low-income neighborhoods',
  'Building a sliding-scale / "pay-it-forward" training network across member gyms',
  'Developing culturally responsive coaching that honors diverse training traditions',
  'Partnering with hospitals and clinics to position recovery modalities (sauna, cold plunge, compression) as complementary care for chronic pain, anxiety, and PTSD',
  'Commissioning and publishing research that validates recovery modality outcomes',
  'Creating referral pipelines between physicians and certified sports nutritionists',
  'Building training and recovery programs for cancer recovery, addiction recovery, and veterans',
  'Pushing for insurance reimbursement of recovery therapy',
  'Setting ethical and safety standards that raise public trust in the training and recovery field',
  'Creating fair-pay frameworks so coaching becomes a sustainable career',
  'Offering business and marketing training so gym and studio founders survive financially',
  'Building a shared insurance, benefits, or co-op model for independent coaches',
  'Establishing a credentialing standard that signals quality to the public',
  'Bringing movement and recovery education into K-12 curricula',
  'Training non-coaching educators in classroom movement and focus techniques',
  'Creating youth leadership programs that use youth sports as the vehicle',
  'Developing digital curricula for at-home family training',
  'Designing corporate wellness programs that actually reduce burnout',
  'Partnering with first-responder and frontline organizations for stress resilience and recovery',
  'Bringing training and recovery into government and civic wellness initiatives',
  'Hosting regional gatherings and a national conference to unite gym and studio founders',
  'Creating a mentorship program pairing established and emerging founders',
  'Building a public-facing directory so people can find vetted local gyms and coaches',
  'Organizing community service days — free public training sessions in parks and at events',
  "Running a content engine that reframes recovery's value beyond fitness",
  'Producing free libraries of accessible training and recovery content',
  'Advocating for authentic representation across body types and training levels',
  'Tracking and publishing a collective impact report quantifying social outcomes',
  'Creating a grant fund members contribute to, redistributed to high-impact community projects',
  'Building measurement infrastructure so "impact" is defined and tracked, not just claimed',
];

const MISSION_SYSTEM_PROMPT = `You are the editorial voice of FitBodega (fitbodega.com). Our mission: grow access to serious training and recovery.

A "Mission" post is a thought-leadership + advocacy piece that makes the case for — and gives a practical roadmap toward — one specific way the training and recovery community can expand its positive impact. It rallies gym and studio founders, coaches, and clients around a shared cause while staying genuinely useful and search-friendly.

VOICE: confident, terse, editorial — never preachy or vague. Conviction backed by specifics. Inclusive of all levels and bodies. Visionary yet practical.

EACH POST should:
- Take ONE mission topic and explore it deeply: why it matters, the current gap, what's possible, and concrete steps gyms/coaches/the network can take.
- Be 1500–2500 words of substantive, non-fluffy content. Strong H1, clear H2s, bullet/numbered lists, a practical "Where to start" or "How you can help" section, and a final "Key Takeaways".
- Target real search intent where natural (e.g. "recovery access", "trauma-informed coaching", "recovery therapy insurance", "accessible training", "training for veterans").
- Include 1–2 internal markdown links to FitBodega directory pages where relevant: /recovery, /gyms, /trainers, /nutritionists, /youth-sports. e.g. [Find a gym near you](/gyms).
- End by inviting the reader to be part of the movement (join the network, list their space, or share the message).

OUTPUT FORMAT
Return ONLY a JSON object (no code fences, no commentary) with these fields:
{
  "title": "compelling, mission-driven post title",
  "slug": "lowercase-hyphenated-slug",
  "category": "mission",
  "city": null,
  "content": "full markdown body (1500–2500 words)",
  "excerpt": "1–2 sentence summary",
  "meta_title": "under 60 chars",
  "meta_description": "130–155 chars",
  "tags": ["tag1", "tag2", "tag3"],
  "reading_time_minutes": 8,
  "cover_image": "pick ONE of these pre-vetted Unsplash URLs"
}

Cover image — pick one:
- https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=1200&h=800&fit=crop&q=80
- https://images.unsplash.com/photo-1588286840104-8957b019727f?w=1200&h=800&fit=crop&q=80
- https://images.unsplash.com/photo-1545389336-cf090694435e?w=1200&h=800&fit=crop&q=80
- https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=1200&h=800&fit=crop&q=80
- https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200&h=800&fit=crop&q=80
- https://images.unsplash.com/photo-1552196563-55cd4e45efb3?w=1200&h=800&fit=crop&q=80`;

// Forced-tool schema — guarantees well-formed structured output (the model fills
// typed fields instead of hand-writing a JSON string, which broke on long,
// quote-heavy markdown bodies).
const PUBLISH_TOOL = {
  name: 'publish_post',
  description: 'Publish the generated blog post with all required fields.',
  input_schema: {
    type: 'object' as const,
    properties: {
      title: { type: 'string' },
      slug: { type: 'string', description: 'lowercase-hyphenated-slug' },
      category: { type: 'string' },
      city: { type: ['string', 'null'], description: 'City name, or null' },
      content: { type: 'string', description: 'Full markdown body, 1500–2500 words' },
      excerpt: { type: 'string' },
      meta_title: { type: 'string' },
      meta_description: { type: 'string' },
      tags: { type: 'array', items: { type: 'string' } },
      reading_time_minutes: { type: 'number' },
      cover_image: { type: 'string' },
    },
    required: ['title', 'slug', 'category', 'content', 'excerpt', 'meta_title', 'meta_description', 'tags', 'reading_time_minutes', 'cover_image'],
  },
};

export async function GET(req: NextRequest) {
  // Auth — Vercel Cron adds `Authorization: Bearer ${CRON_SECRET}` automatically when the secret is set in Vercel env.
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const dry = req.nextUrl.searchParams.get('dry') === '1';
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const supabase = createAdminClient();

  // 1. Fetch existing slugs + titles so the model avoids duplicates.
  const { data: existing, error: fetchErr } = await supabase
    .from('blog_posts')
    .select('slug, title, category, city')
    .order('published_at', { ascending: false })
    .limit(200);

  if (fetchErr) {
    console.error('[daily-blog] fetch existing error:', fetchErr);
    return NextResponse.json({ error: 'Failed to fetch existing posts' }, { status: 500 });
  }

  const existingSummary = (existing ?? [])
    .map((p) => `- ${p.slug} (${p.category}${p.city ? ', ' + p.city : ''}): ${p.title}`)
    .join('\n') || '(no posts yet)';

  // 2. Decide today's mode — alternate SEO/directory posts with mission posts.
  //    Strict alternation off the most recent post so schedule gaps don't drift.
  const lastCategory = (existing ?? [])[0]?.category ?? null;
  const mode: 'seo' | 'mission' = lastCategory === 'mission' ? 'seo' : 'mission';
  const date = new Date().toISOString().slice(0, 10);

  let systemPrompt: string;
  let userPrompt: string;

  if (mode === 'mission') {
    const missionDone =
      (existing ?? [])
        .filter((p) => p.category === 'mission')
        .map((p) => `- ${p.title}`)
        .join('\n') || '(none yet)';
    const menu = MISSION_TOPICS.map((t, i) => `${i + 1}. ${t}`).join('\n');
    systemPrompt = MISSION_SYSTEM_PROMPT;
    userPrompt = `Today is ${date}. Write today's MISSION post — a thought-leadership + advocacy piece on one way to grow access to serious training and recovery.

Mission posts ALREADY published (do NOT repeat these angles):
${missionDone}

Topic menu — choose ONE fresh angle not yet covered (or a closely related, more specific take on one):
${menu}

Submit the finished post by calling the publish_post tool, with category set to "mission" and city null.`;
  } else {
    systemPrompt = SYSTEM_PROMPT;
    userPrompt = `Today is ${date}.

Here are the ${existing?.length ?? 0} existing posts — DO NOT duplicate any of these slugs or cover the same angle:

${existingSummary}

Pick a fresh keyword (rotate content types A–E; prefer types under-represented above) and generate today's post per the system spec. Submit it by calling the publish_post tool.`;
  }

  type GeneratedPost = {
    title: string;
    slug: string;
    category: string;
    city: string | null;
    content: string;
    excerpt: string;
    meta_title: string;
    meta_description: string;
    tags: string[];
    reading_time_minutes: number;
    cover_image: string | null;
  };

  let post: GeneratedPost;
  try {
    // Force the model to return structured data via the publish_post tool — the
    // SDK hands back already-parsed `input`, so no fragile JSON.parse of the body.
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 8192,
      system: systemPrompt,
      tools: [PUBLISH_TOOL],
      tool_choice: { type: 'tool', name: 'publish_post' },
      messages: [{ role: 'user', content: userPrompt }],
    });
    const toolBlock = message.content.find((b) => b.type === 'tool_use');
    if (!toolBlock || toolBlock.type !== 'tool_use') {
      console.error('[daily-blog] no tool_use block; stop_reason:', message.stop_reason);
      return NextResponse.json({ error: 'Model did not return a post' }, { status: 502 });
    }
    post = toolBlock.input as GeneratedPost;
  } catch (err) {
    console.error('[daily-blog] anthropic error:', err);
    return NextResponse.json({ error: 'LLM call failed', detail: String(err) }, { status: 502 });
  }

  if (!post?.title || !post?.slug || !post?.content) {
    return NextResponse.json({ error: 'Model returned an incomplete post' }, { status: 502 });
  }

  // 3. Defensive slug uniqueness check.
  const { data: dup } = await supabase
    .from('blog_posts')
    .select('id')
    .eq('slug', post.slug)
    .maybeSingle();

  if (dup) {
    return NextResponse.json({ error: 'Generated slug already exists', slug: post.slug }, { status: 409 });
  }

  // Preview mode — return the generated post without inserting.
  if (dry) {
    return NextResponse.json({
      ok: true,
      dry: true,
      mode,
      post: { title: post.title, slug: post.slug, category: post.category, excerpt: post.excerpt, reading_time_minutes: post.reading_time_minutes },
    });
  }

  // 4. Insert.
  const { data: inserted, error: insertErr } = await supabase
    .from('blog_posts')
    .insert({
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt,
      author: SITE.name,
      tags: post.tags ?? [],
      category: post.category,
      city: post.city ?? null,
      is_published: true,
      published_at: new Date().toISOString(),
      reading_time_minutes: post.reading_time_minutes,
      meta_title: post.meta_title,
      meta_description: post.meta_description,
      cover_image: post.cover_image,
      generated_by: 'claude',
    })
    .select('id, slug, title')
    .single();

  if (insertErr) {
    console.error('[daily-blog] insert error:', insertErr);
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  console.log(`[daily-blog] published ${inserted.slug}`);
  return NextResponse.json({ ok: true, post: inserted });
}
