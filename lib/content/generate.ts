import Anthropic from '@anthropic-ai/sdk';
import { SITE } from '@/lib/config/site';
import type { BacklogTopic } from '@/lib/content/backlog';

// The Tue/Thu editorial writer. Auto-writes ONLY topics flagged auto:true in
// the backlog — evergreen mechanism pieces that need no named people, no
// datasets, and nobody's first-person experience. The honesty rules below are
// the contract; a piece that needs to break them belongs in a working
// session, not in this file.

const MODEL = 'claude-sonnet-4-5-20250929';

const TRACK_AUDIENCE: Record<BacklogTopic['track'], string> = {
  for_creators:
    'fitness creators — from 5K-follower part-timers to full-time athletes. They want to get paid fairly for brand work without losing their audience\'s trust.',
  for_brands:
    'people who buy marketing for fitness and wellness brands — founders, marketing leads, media buyers. They think in CAC and payback, and they are tired of influencer marketing that cannot show its math.',
};

function systemPrompt(track: BacklogTopic['track']): string {
  return `You write The Journal for FitBodega (fitbodega.com) — the fitness creator network: the FitBodega 100 rankings, the Deal Radar (a weekly board of fitness brand deals plus intelligence on which brands are buying creator content), and a creator network brands can browse.

AUDIENCE for this piece: ${TRACK_AUDIENCE[track]}

VOICE
Confident, terse, editorial — an operator who respects the reader's time. Short sentences. Concrete verbs. No exclamation marks, no "amazing/awesome", no hedging, no throat-clearing intros, no emojis. Never use a metaphor you are used to seeing in print.

HARD HONESTY RULES — these outrank everything else:
1. NEVER name a real person, creator, or specific brand as an example. Use clearly hypothetical framing ("a 40K-follower strength creator", "a supplement brand").
2. NEVER cite a statistic, study, survey, percentage, or platform-published figure. You do not have sources. Explain mechanisms from first principles instead.
3. Worked examples with numbers must be introduced as illustrative ("say the post costs $500...") — never presented as market data or benchmarks.
4. Claim no first-person experience. FitBodega is the byline, not a person.
5. If the assigned angle cannot be written under these rules, write the part that can and narrow the scope. Do not compensate by inventing.

STRUCTURE
- 1200–1800 words of markdown. Strong opening paragraph that states the argument in two sentences.
- Clear H2 sections. Bullet lists where they genuinely compress. A final "The short version" section with 3-5 takeaways.
- One internal link woven in naturally where it serves the reader:
  ${track === 'for_creators'
    ? '[the Deal Radar](/creators) — the weekly email of fitness brand deals, free — and/or [the deal board](/deals).'
    : '[post a deal on FitBodega](/for-brands) — free, reviewed by hand — and/or [the FitBodega 100](/top-100).'}
  At most two links total. Never more than one sentence of self-promotion.

OUTPUT
Submit by calling the publish_post tool. category is "${track}". meta_description 130-155 chars. Tags: 3-5, lowercase. cover_image: empty string (a branded cover is generated from the title).`;
}

const PUBLISH_TOOL = {
  name: 'publish_post',
  description: 'Publish the finished Journal piece.',
  input_schema: {
    type: 'object' as const,
    properties: {
      title: { type: 'string' },
      slug: { type: 'string', description: 'MUST be exactly the assigned slug' },
      content: { type: 'string', description: 'Full markdown body, 1200-1800 words' },
      excerpt: { type: 'string', description: '1-2 sentence summary' },
      meta_title: { type: 'string', description: 'under 60 chars' },
      meta_description: { type: 'string', description: '130-155 chars' },
      tags: { type: 'array', items: { type: 'string' } },
      reading_time_minutes: { type: 'number' },
    },
    required: ['title', 'slug', 'content', 'excerpt', 'meta_title', 'meta_description', 'tags', 'reading_time_minutes'],
  },
};

export interface GeneratedPost {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  meta_title: string;
  meta_description: string;
  tags: string[];
  reading_time_minutes: number;
}

export async function writePost(topic: BacklogTopic): Promise<GeneratedPost> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 8192,
    system: systemPrompt(topic.track),
    tools: [PUBLISH_TOOL],
    tool_choice: { type: 'tool', name: 'publish_post' },
    messages: [
      {
        role: 'user',
        content: `Write this piece.

Working title: ${topic.title}
Assigned slug (use exactly): ${topic.slug}
The argument the piece must make: ${topic.angle}

You may sharpen the title. Submit via publish_post.`,
      },
    ],
  });

  const block = message.content.find((b) => b.type === 'tool_use');
  if (!block || block.type !== 'tool_use') {
    throw new Error(`writer returned no tool_use (stop: ${message.stop_reason})`);
  }
  const post = block.input as GeneratedPost;
  if (!post?.title || !post?.content || post.content.length < 2000) {
    throw new Error('writer returned an incomplete post');
  }
  // The slug is the backlog's identity — never trust the model with it.
  post.slug = topic.slug;
  return post;
}

/** The branded cover every Journal post gets, generated from its own title. */
export function coverImageUrl(slug: string, title: string, category: string): string {
  return `${SITE.url}/api/social/image?type=cover&slug=${encodeURIComponent(slug)}&title=${encodeURIComponent(title)}&category=${encodeURIComponent(category)}`;
}
