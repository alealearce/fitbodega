import Anthropic from '@anthropic-ai/sdk';
import type { Listing } from '@/lib/supabase/types';
import { SITE, CHATBOT } from '@/lib/config/site';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ── Chatbot ────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// System prompt is built from site config — no hardcoded brand values here
const CHATBOT_SYSTEM = `${CHATBOT.persona} You help users:
- Find the right recovery studio, gym, coach, nutritionist, health food store, or youth sports program for their training
- Navigate the ${SITE.name} directory
- Understand recovery modalities (sauna, cold plunge, cryotherapy, float, compression) and training specialties
- Discover the network of spaces and practitioners in Vancouver and worldwide

Keep answers concise (2-3 sentences max).

PASSWORD / LOGIN HELP: If a user can't log in, forgot their password, or can't reset it, do TWO things in the same reply: (1) point them to the password reset page ${SITE.url}/forgot-password — they enter their account email and receive a reset link (remind them to check spam/junk); and (2) ask them to share the email address on their account right here in the chat, so our support team can look into it for them directly. Once the user shares their email address, warmly confirm that our team has been notified and will sort out their password within 24 hours — do NOT tell them to email support themselves; it's already handled.

IMPORTANT: If a user is frustrated, upset, complaining, has a technical issue, an account problem, a billing question, or asks about something you truly cannot help with, always respond kindly AND include this exactly: "For direct help, email us at ${SITE.supportEmail} — we usually respond within 24 hours!"

Never invent specific class schedules, prices, or instructor availability.`;

export async function chatWithAssistant(messages: ChatMessage[]): Promise<string> {
  const response = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 400,
    system: CHATBOT_SYSTEM,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  });

  const block = response.content[0];
  return block.type === 'text' ? block.text : '';
}

// ── Long Description Generation (500-800 words) ──────────────────────────

interface LongDescriptionResult {
  long_description: string;
}

export async function generateLongDescription(
  listing: Partial<Listing>
): Promise<LongDescriptionResult> {
  const prompt = `You are writing a detailed, SEO-optimized listing description for ${SITE.name} — a curated directory of recovery studios, gyms, coaches, nutritionists, health food stores, and youth sports programs, starting in Vancouver and open worldwide.

Listing: "${listing.name}"
Type: ${listing.type}
City: ${listing.city}${listing.country ? `, ${listing.country}` : ''}
${listing.specialties && listing.specialties.length > 0 ? `Specialties: ${listing.specialties.join(', ')}` : ''}
${listing.experience_levels && listing.experience_levels.length > 0 ? `Experience Levels: ${listing.experience_levels.join(', ')}` : ''}
${listing.languages && listing.languages.length > 0 ? `Languages: ${listing.languages.join(', ')}` : ''}
${listing.description ? `Short description: ${listing.description}` : ''}

Write a comprehensive listing description (500-800 words):
- Confident, terse, editorial tone — no exclamation marks, no "amazing/awesome", no hedging
- Highlight the unique qualities of this space or practice — the environment, methodology, and results it delivers
- Mention specialties and what clients can expect from training or recovering here
- Include natural keyword usage for local and specialty-based SEO
- Mention the city naturally
- Use paragraphs, not bullet points

IMPORTANT: Write at least 500 words. Be thorough, evocative, and detailed.

Respond in this exact JSON format:
{
  "long_description": "..."
}`;

  const response = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}';

  try {
    return JSON.parse(text) as LongDescriptionResult;
  } catch {
    return {
      long_description: '',
    };
  }
}

// ── Short Description Generator (for listing submission "Let AI write it") ──────

interface ShortDescriptionResult {
  description: string;
}

export async function generateShortDescription(input: {
  name: string;
  type: string;
  city: string;
  country?: string;
  specialties?: string[];
  experience_levels?: string[];
  website?: string;
  instagram?: string;
  facebook?: string;
  youtube?: string;
  keywords?: string;
}): Promise<ShortDescriptionResult> {
  const socialSignals = [
    input.instagram && `Instagram: @${input.instagram.replace('@', '')}`,
    input.facebook && `Facebook: ${input.facebook}`,
    input.youtube && `YouTube: ${input.youtube}`,
  ].filter(Boolean).join('\n');

  const prompt = `You are ${CHATBOT.name}, a helpful content writer for ${SITE.name} — the curated fitness and recovery network.

Write a short, engaging listing description (3-5 sentences) for this listing:

Name: ${input.name}
Type: ${input.type}
City: ${input.city}${input.country ? `, ${input.country}` : ''}${input.specialties && input.specialties.length > 0 ? `\nSpecialties: ${input.specialties.join(', ')}` : ''}${input.experience_levels && input.experience_levels.length > 0 ? `\nExperience Levels: ${input.experience_levels.join(', ')}` : ''}${input.website ? `\nWebsite: ${input.website}` : ''}${socialSignals ? `\nSocial media:\n${socialSignals}` : ''}${input.keywords ? `\nKeywords/tags: ${input.keywords}` : ''}

Guidelines:
- Confident, terse, editorial tone — no exclamation marks, no "amazing/awesome", no hedging
- Highlight what makes this listing special and why people should train or recover here
- Naturally mention the city and specialties for SEO
- 3-5 sentences, no bullet points
- Do NOT invent specific class schedules, prices, or facts not provided

Respond with ONLY the description text — no labels, no JSON, no extra commentary.`;

  const response = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 300,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text.trim() : '';
  return { description: text };
}

// ── Listing AI Enrichment ─────────────────────────────────────────────────

interface EnrichmentResult {
  description: string;
  tags: string[];
}

export async function enrichListing(
  listing: Partial<Listing>
): Promise<EnrichmentResult> {
  const prompt = `You are enriching a directory listing for: "${listing.name}" in ${listing.city}${listing.country ? `, ${listing.country}` : ''}.
Type: ${listing.type}
${listing.specialties && listing.specialties.length > 0 ? `Specialties: ${listing.specialties.join(', ')}` : ''}

Write a SHORT description (2-3 sentences) — confident, terse, editorial — highlighting what makes this listing stand out and why people would train or recover here.

Also suggest 3-5 relevant tags (comma-separated, lowercase, e.g. strength-training, cold-plunge, beginners-welcome, sports-nutrition).

Respond in this exact JSON format:
{
  "description": "...",
  "tags": ["tag1", "tag2"]
}`;

  const response = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 500,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}';

  try {
    return JSON.parse(text) as EnrichmentResult;
  } catch {
    return {
      description: `${listing.name} is a ${listing.type} based in ${listing.city}.`,
      tags: [],
    };
  }
}
