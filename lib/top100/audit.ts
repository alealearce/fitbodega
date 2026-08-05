import Anthropic from "@anthropic-ai/sdk";
import influencers from "@/data/top-100/fitness-influencers.json";
import gyms from "@/data/top-100/gyms.json";
import retreats from "@/data/top-100/retreats.json";
import hyrox from "@/data/top-100/hyrox.json";
import coaches from "@/data/top-100/coaches.json";
import recovery from "@/data/top-100/recovery.json";
import runclubs from "@/data/top-100/runclubs.json";
import stores from "@/data/top-100/stores.json";
import nutritionists from "@/data/top-100/nutritionists.json";

// The FitBodega 100 audit: personalized recommendations for a lead,
// every one anchored to a named exemplar from the rankings.

export type AuditEntityType =
  | "coach"
  | "gym"
  | "creator"
  | "recovery"
  | "store"
  | "club"
  | "nutritionist"
  | "retreat"
  | "athlete";

export interface AuditInput {
  entityType: AuditEntityType;
  instagram?: string;
  website?: string;
  goal?: string;
  websiteText?: string;
}

export interface AuditRecommendation {
  title: string;
  detail: string;
  exemplarName: string;
  exemplarRank: number;
  listSlug: string;
  listLabel: string;
  study: string;
}

export interface AuditReport {
  headline: string;
  assessment: string;
  recommendations: AuditRecommendation[];
  nextStep: string;
}

type ListEntry = {
  rank: number;
  name: string;
  segment: string;
  who: string;
  takeaway?: string;
};
type ListData = { entries: ListEntry[] };

const LISTS: Record<string, { data: ListData; slug: string; label: string }> = {
  influencers: {
    data: influencers as unknown as ListData,
    slug: "/top-100-fitness-influencers",
    label: "Top 100 Fitness Influencers",
  },
  gyms: { data: gyms as unknown as ListData, slug: "/top-100-gyms", label: "Top 100 Gyms in the World" },
  retreats: {
    data: retreats as unknown as ListData,
    slug: "/top-100-fitness-retreats",
    label: "Top 100 Fitness Retreats",
  },
  hyrox: { data: hyrox as unknown as ListData, slug: "/top-100-hyrox-athletes", label: "Top 100 Hyrox Athletes" },
  coaches: {
    data: coaches as unknown as ListData,
    slug: "/top-100-online-fitness-coaches",
    label: "Top 100 Online Fitness Coaches",
  },
  recovery: {
    data: recovery as unknown as ListData,
    slug: "/top-100-recovery-spaces",
    label: "Top 100 Recovery Spaces",
  },
  runclubs: { data: runclubs as unknown as ListData, slug: "/top-100-run-clubs", label: "Top 100 Run Clubs & Crews" },
  stores: {
    data: stores as unknown as ListData,
    slug: "/top-100-health-food-stores",
    label: "Top 100 Health Food Stores",
  },
  nutritionists: {
    data: nutritionists as unknown as ListData,
    slug: "/top-100-nutritionists",
    label: "Top 100 Nutritionists",
  },
};

// Which lists feed exemplars for each entity type. The first is the
// "home" list; influencers ride along for content-presentation exemplars.
const TYPE_LISTS: Record<AuditEntityType, string[]> = {
  coach: ["coaches", "influencers"],
  gym: ["gyms", "influencers"],
  creator: ["influencers", "coaches"],
  recovery: ["recovery", "influencers"],
  store: ["stores", "influencers"],
  club: ["runclubs", "influencers"],
  nutritionist: ["nutritionists", "influencers"],
  retreat: ["retreats", "influencers"],
  athlete: ["hyrox", "influencers"],
};

function exemplarPack(entityType: AuditEntityType): string {
  const [primaryKey, secondaryKey] = TYPE_LISTS[entityType];
  const primary = LISTS[primaryKey];
  const secondary = LISTS[secondaryKey];

  const pick = (list: { data: ListData; slug: string; label: string }, ranks: number[]) =>
    list.data.entries
      .filter((e) => ranks.includes(e.rank))
      .map(
        (e) =>
          `- ${e.name} (#${e.rank}, ${list.label}, link ${list.slug}) — ${e.segment}. ${e.who}${
            e.takeaway ? ` Their lesson: ${e.takeaway}` : ""
          }`
      )
      .join("\n");

  // Top of the home list + a spread further down, plus the top of the
  // secondary list for content/presentation references.
  const primaryLines = pick(primary, [1, 2, 3, 4, 5, 6, 7, 8, 12, 15, 20, 25, 30]);
  const secondaryLines = pick(secondary, [1, 2, 3, 4, 5, 7]);
  return `HOME LIST (${primary.label}):\n${primaryLines}\n\nSECONDARY LIST (${secondary.label}):\n${secondaryLines}`;
}

const SYSTEM = `You are the editor of the FitBodega 100, world rankings of fitness culture (fitbodega.com). You write short, confident, useful audits in the site's voice: terse, editorial, direct. No exclamation marks, no "amazing", no emojis, no hedging filler. You never invent facts about the person being audited — if you don't know something about them, frame the recommendation as a practice to adopt, not a diagnosis of what they do wrong. Every recommendation must be anchored to a real exemplar from the provided pack, by exact name and rank.

You respond with ONLY a JSON object, no markdown fences, matching:
{
  "headline": string,            // 4-8 words, addressed to them, no punctuation at end
  "assessment": string,          // 2-3 sentences: honest read of where they likely stand and the biggest lever
  "recommendations": [           // exactly 5 or 6 items
    {
      "title": string,           // imperative, max 8 words
      "detail": string,          // 2-3 sentences of concrete, doable advice
      "exemplarName": string,    // exact name from the pack
      "exemplarRank": number,    // their rank from the pack
      "listSlug": string,        // the pack link for that exemplar, e.g. "/top-100-gyms"
      "listLabel": string,       // the pack list label for that exemplar
      "study": string            // one sentence: what specifically to study in how the exemplar does it
    }
  ],
  "nextStep": string             // one sentence pointing them to list their business in the FitBodega directory
}`;

export async function generateAudit(input: AuditInput): Promise<AuditReport> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const pack = exemplarPack(input.entityType);

  const userParts = [
    `Audit subject:`,
    `- Type: ${input.entityType}`,
    input.instagram ? `- Instagram (declared, not crawled): ${input.instagram}` : null,
    input.website ? `- Website: ${input.website}` : null,
    input.goal ? `- Their stated goal: ${input.goal}` : null,
    input.websiteText
      ? `\nExtract from their website (fetched just now, may be partial):\n"""\n${input.websiteText}\n"""`
      : `\nNo website content could be fetched — base the audit on the declared info and universal levers for this type.`,
    `\nExemplar pack (the ONLY names you may reference):\n${pack}`,
    `\nWrite the audit JSON now. Pick exemplars that genuinely fit each recommendation; use at least 4 different exemplars across the recommendations, and prefer home-list exemplars for business/presence advice and secondary-list exemplars for content advice.`,
  ].filter(Boolean);

  const msg = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 2200,
    messages: [{ role: "user", content: userParts.join("\n") }],
    system: SYSTEM,
  });

  const textBlock = msg.content.find((b) => b.type === "text");
  const text = textBlock && textBlock.type === "text" ? textBlock.text : "";
  const jsonStart = text.indexOf("{");
  const jsonEnd = text.lastIndexOf("}");
  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error(
      `audit: no JSON in model output. stop=${msg.stop_reason} blocks=${msg.content
        .map((b) => b.type)
        .join(",")} head="${text.slice(0, 160)}"`
    );
  }
  const report = JSON.parse(text.slice(jsonStart, jsonEnd + 1)) as AuditReport;

  if (!report.headline || !Array.isArray(report.recommendations) || report.recommendations.length < 4) {
    throw new Error("audit: malformed report");
  }
  return report;
}
