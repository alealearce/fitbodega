/**
 * creatorSpotlight.ts — Creator Spotlight pipeline. Twin of lib/social/story.ts
 * for creator_profiles instead of listings.
 *
 * On the admin's Spotlight button for a creator with qualifying material
 * (>=3 answered CREATOR_QUESTIONS + >=1 photo, not opted out), this:
 *   1. Generates a "Creator Spotlight" Journal post with Claude.
 *   2. Inserts it into blog_posts (idempotent via creator_profiles.spotlight_post_id).
 *   3. Publishes the 4-slide story carousel via Blotato.
 *
 * Never a cron. Creators have no page of their own, so the post links to
 * their primary platform and to the network browse.
 */

import Anthropic from '@anthropic-ai/sdk';
import { createAdminClient } from '@/lib/supabase/server';
import { SITE, CREATOR_QUESTIONS, type CreatorQuestionKey } from '@/lib/config/site';
import { primaryLink, type CreatorProfile } from '@/lib/creators/profile';
import { configuredPlatforms, SINGLE_IMAGE_ONLY, uploadAll, publish, clampCaption, type Platform } from '@/lib/social/blotato';
import { creatorIneligibleReason } from '@/lib/social/eligibility';
import { slugify } from '@/lib/utils/slug';

const MODEL = 'claude-sonnet-4-5-20250929';
const IMG_BASE = process.env.SOCIAL_PUBLIC_BASE_URL || SITE.url;
const NETWORK_URL = `${SITE.url}/creators/network`;

type GeneratedSpotlight = {
  title: string;
  excerpt: string;
  meta_title: string;
  meta_description: string;
  content: string;
  pull_quote: string;
};

const SYSTEM_PROMPT = `You are the automated editorial system for FitBodega (fitbodega.com) — the fitness creator network. FitBodega ranks the creators shaping training culture, tells their stories in The Journal, and connects fitness brands with creators for measured campaigns.

You are writing a "Creator Spotlight" post introducing a creator who just joined the network. Brands read these. This is NOT a "story" — never use the word "story" anywhere in the title or copy.

VOICE: confident, terse, editorial — calm authority, like an elite trainer who respects people's time. No exclamation marks, no "amazing" or "awesome", no hedging, no emojis anywhere.

STRICT RULES
- Open by welcoming the creator to the network, then spotlight them from there.
- The title MUST follow a "Creator Spotlight: {Name}" or "Welcome to the Network: {Name}" pattern. Never use the word "story".
- Weave the creator's own answers into the piece as direct quotes, inside quotation marks. Quote them VERBATIM — never paraphrase text that sits inside quote marks.
- If a question was not answered, skip that beat ENTIRELY. Never invent biographical facts, follower counts, brand names, or quotes that weren't given to you.
- If they answered the brands question, close with a clearly-labeled "Work with them" beat for brands. Whatever the closing beat, end it with a markdown link to the creator's main platform using the exact URL given in the user message, and a second link to the network browse URL given in the user message.
- 500–700 words of markdown. Clean structure: a short welcome intro, then the woven Q&A, then the closing.
- Where the user message gives you image URLs to embed, place each as its own markdown image line (\`![alt](url)\`) roughly evenly spaced between sections — never inside a paragraph of running text.

OUTPUT
Call the publish_spotlight tool with the finished post. pull_quote must be one full sentence lifted VERBATIM (word-for-word, no edits) from one of the creator's answers — it will be set as a pull-quote on a social graphic, so pick the most vivid, human line available.`;

const SPOTLIGHT_TOOL = {
  name: 'publish_spotlight',
  description: 'Publish the generated Creator Spotlight post with all required fields.',
  input_schema: {
    type: 'object' as const,
    properties: {
      title: { type: 'string', description: 'Follows a "Creator Spotlight: {Name}" or "Welcome to the Network: {Name}" pattern. Never the word "story".' },
      excerpt: { type: 'string', description: '1–2 sentence summary' },
      meta_title: { type: 'string', description: 'under 60 chars' },
      meta_description: { type: 'string', description: '130–155 chars' },
      content: { type: 'string', description: 'Full markdown body, 500–700 words' },
      pull_quote: { type: 'string', description: "One full sentence lifted VERBATIM from one of the creator's answers" },
    },
    required: ['title', 'excerpt', 'meta_title', 'meta_description', 'content', 'pull_quote'],
  },
};

function buildUserPrompt(p: CreatorProfile): string {
  const qas = CREATOR_QUESTIONS
    .map((q) => {
      const answer = p.spotlight_story?.[q.key as CreatorQuestionKey];
      return answer && answer.trim() ? `Q: ${q.label}\nA: "${answer.trim()}"` : null;
    })
    .filter(Boolean)
    .join('\n\n');

  const link = primaryLink(p);
  const embedImages = (p.spotlight_images ?? []).slice(1, 3); // [0] is the cover, shown above the post
  const imageInstruction = embedImages.length
    ? `Embed these image URL(s) as markdown images on their own line, spaced between sections of the piece:\n${embedImages.map((u) => `- ${u}`).join('\n')}`
    : 'No additional images to embed.';

  return `New creator: ${p.name}
Niche: ${p.niche}
Audience: ${p.audience_size} on ${p.primary_platform}
Location: ${p.location || 'not given'}
Their main platform (link to this in the closing): ${link ? `${link.label} — ${link.url}` : 'none given'}
The network browse (link to this in the closing too): ${NETWORK_URL}
In their words (from their profile): ${p.note || '(no note provided)'}

Their answers to our spotlight questions (ONLY these are answered — do not address any question not listed here):

${qas || '(no answers provided)'}

${imageInstruction}

Write the Creator Spotlight post per the system rules and call the publish_spotlight tool.`;
}

async function generatePost(p: CreatorProfile): Promise<GeneratedSpotlight> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    tools: [SPOTLIGHT_TOOL],
    tool_choice: { type: 'tool', name: 'publish_spotlight' },
    messages: [{ role: 'user', content: buildUserPrompt(p) }],
  });
  const toolBlock = message.content.find((b) => b.type === 'tool_use');
  if (!toolBlock || toolBlock.type !== 'tool_use') {
    throw new Error(`Model did not return a spotlight post (stop_reason: ${message.stop_reason})`);
  }
  const post = toolBlock.input as GeneratedSpotlight;
  if (!post?.title || !post?.content || !post?.pull_quote) {
    throw new Error('Model returned an incomplete spotlight post');
  }
  return post;
}

function ensureImagesEmbedded(content: string, images: string[], name: string): string {
  const extras = images.slice(1, 3);
  if (extras.length === 0) return content;
  const paragraphs = content.split(/\n\n+/);
  extras.forEach((url, i) => {
    if (content.includes(url)) return;
    const md = `![${name}](${url})`;
    const insertAt = Math.max(1, Math.floor((paragraphs.length * (i + 1)) / (extras.length + 2)));
    paragraphs.splice(insertAt, 0, md);
  });
  return paragraphs.join('\n\n');
}

function ensureLinked(content: string, p: CreatorProfile): string {
  const link = primaryLink(p);
  let out = content.trimEnd();
  if (link && !out.includes(link.url)) out += `\n\nFind ${p.name} on [${link.label}](${link.url}).`;
  if (!out.includes(NETWORK_URL)) out += `\n\nBrands: ${p.name} is in [the ${SITE.name} creator network](${NETWORK_URL}).`;
  return out;
}

function estimateReadingMinutes(markdown: string): number {
  const words = markdown.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function truncate(text: string, max: number): string {
  const t = (text || '').trim();
  return t.length > max ? t.slice(0, max - 1).trimEnd() + '…' : t;
}

async function insertPostWithUniqueSlug(
  supabase: ReturnType<typeof createAdminClient>,
  baseSlug: string,
  row: Record<string, unknown>
): Promise<{ id: string; slug: string } | { error: string }> {
  for (let attempt = 0; attempt < 6; attempt++) {
    const slug = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;
    const { data, error } = await supabase
      .from('blog_posts')
      .insert({ ...row, slug })
      .select('id, slug')
      .single();
    if (!error && data) return data as { id: string; slug: string };
    if (error && error.code !== '23505') return { error: error.message };
  }
  return { error: 'Could not find a unique slug after multiple attempts' };
}

function slideUrl(params: Record<string, string | undefined>): string {
  const q = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join('&');
  return `${IMG_BASE}/api/social/image?${q}`;
}

// Deterministic caption — Coach voice, no model call. No emojis.
function buildCaption(p: CreatorProfile, spotlightUrl: string, pullQuote: string): string {
  const firstName = p.name.split(/\s+/)[0];
  const handle = p.instagram ? `@${p.instagram}` : '';
  return [
    `Please welcome ${p.name} to the network.`,
    '',
    `${p.niche}. ${p.audience_size} on ${p.primary_platform}.${p.note ? ` ${p.note.trim()}` : ''}`,
    '',
    `"${pullQuote.trim()}"`,
    '',
    `Read ${firstName}'s full spotlight in The Journal — ${spotlightUrl}`,
    handle ? `In collaboration with ${handle}` : '',
    '',
    '#fitnesscreator #creatoreconomy #fitness #trainingculture #fitbodega',
  ]
    .filter((l) => l !== '')
    .join('\n');
}

async function publishCarousel(
  supabase: ReturnType<typeof createAdminClient>,
  p: CreatorProfile,
  post: { id: string; slug: string },
  generated: GeneratedSpotlight,
  spotlightUrl: string
): Promise<{ platforms: string[]; error?: string }> {
  const platforms = configuredPlatforms();
  if (platforms.length === 0) return { platforms: [] };

  const hero = p.spotlight_images?.[0] || '';
  const blurb = truncate(p.spotlight_story?.why_you?.trim() || p.spotlight_story?.content?.trim() || generated.excerpt, 180);
  const quote = truncate(generated.pull_quote, 220);

  const slideUrls = [
    slideUrl({ type: 'story', slide: '0', img: hero, name: p.name, kind: 'Creator', city: p.location ?? '' }),
    slideUrl({ type: 'story', slide: '1', quote }),
    slideUrl({ type: 'story', slide: '2', blurb }),
    slideUrl({ type: 'story', slide: '3', name: p.name, url: `${SITE.domain}/${post.slug}` }),
  ];
  const caption = buildCaption(p, spotlightUrl, generated.pull_quote);

  const uploaded = await uploadAll(slideUrls);
  if (!uploaded.ok) {
    for (const plat of platforms) {
      await supabase.from('social_posts').insert({
        kind: 'story', ref_id: p.id, ref_slug: post.slug, platform: plat,
        caption, image_urls: slideUrls, status: 'failed', error_message: `media upload: ${uploaded.error}`,
      });
    }
    return { platforms: [], error: `media upload: ${uploaded.error}` };
  }

  const multi = uploaded.urls.length > 1;
  const published: string[] = [];
  let lastError: string | undefined;
  for (const plat of platforms) {
    const firstOnly = multi && SINGLE_IMAGE_ONLY.includes(plat);
    const media = firstOnly ? [uploaded.urls[0]] : uploaded.urls;
    const cap = clampCaption(caption, plat as Platform, spotlightUrl);
    const outcome = await publish(plat, media, cap);
    if (outcome.ok) published.push(plat);
    else lastError = outcome.error;
    await supabase.from('social_posts').insert({
      kind: 'story', ref_id: p.id, ref_slug: post.slug, platform: plat,
      external_id: outcome.ok ? outcome.id : null, caption: cap, image_urls: media,
      status: outcome.ok ? 'published' : 'failed', error_message: outcome.ok ? null : outcome.error,
    });
  }
  return { platforms: published, error: published.length === 0 ? lastError : undefined };
}

export async function runCreatorSpotlight(
  profileId: string,
  opts: { dry?: boolean } = {}
): Promise<{
  ok: boolean;
  skipped?: string;
  postSlug?: string;
  spotlightUrl?: string;
  platforms?: string[];
  error?: string;
  generated?: GeneratedSpotlight;
}> {
  const dry = opts.dry ?? false;
  const supabase = createAdminClient();

  const { data, error: fetchErr } = await supabase
    .from('creator_profiles')
    .select('*')
    .eq('id', profileId)
    .maybeSingle();
  if (fetchErr) return { ok: false, error: `Failed to load creator: ${fetchErr.message}` };
  const p = data as CreatorProfile | null;
  if (!p) return { ok: false, error: 'Creator not found' };
  if (!dry && p.status !== 'live') return { ok: true, skipped: 'creator profile is hidden' };

  const reason = creatorIneligibleReason(p);
  if (reason) return { ok: true, skipped: reason };

  let generated: GeneratedSpotlight;
  try {
    generated = await generatePost(p);
  } catch (err) {
    console.error('[creatorSpotlight] generation failed:', err);
    return { ok: false, error: `Spotlight generation failed: ${err instanceof Error ? err.message : String(err)}` };
  }

  const content = ensureLinked(ensureImagesEmbedded(generated.content, p.spotlight_images ?? [], p.name), p);
  const baseSlug = `creator-${slugify(p.name)}`;

  if (dry) {
    return { ok: true, postSlug: baseSlug, spotlightUrl: `${SITE.url}/${baseSlug}`, platforms: [], generated: { ...generated, content } };
  }

  const inserted = await insertPostWithUniqueSlug(supabase, baseSlug, {
    title: generated.title,
    excerpt: generated.excerpt,
    content,
    author: SITE.name,
    author_avatar: null,
    cover_image: p.spotlight_images?.[0] ?? null,
    tags: ['creator', p.primary_platform.toLowerCase()],
    is_published: true,
    reading_time_minutes: estimateReadingMinutes(content),
    category: 'member_spotlight',
    city: p.location ?? null,
    meta_title: generated.meta_title,
    meta_description: generated.meta_description,
    published_at: new Date().toISOString(),
    generated_by: 'claude-creator-spotlight',
  });
  if ('error' in inserted) return { ok: false, error: `Failed to save spotlight post: ${inserted.error}` };

  const { error: linkErr } = await supabase
    .from('creator_profiles')
    .update({ spotlight_post_id: inserted.id })
    .eq('id', p.id);
  if (linkErr) console.error('[creatorSpotlight] failed to set spotlight_post_id:', linkErr);

  const spotlightUrl = `${SITE.url}/${inserted.slug}`;

  let platforms: string[] = [];
  let publishError: string | undefined;
  try {
    const outcome = await publishCarousel(supabase, p, inserted, generated, spotlightUrl);
    platforms = outcome.platforms;
    publishError = outcome.error;
  } catch (err) {
    publishError = err instanceof Error ? err.message : String(err);
  }

  return { ok: true, postSlug: inserted.slug, spotlightUrl, platforms, ...(publishError ? { error: publishError } : {}) };
}
