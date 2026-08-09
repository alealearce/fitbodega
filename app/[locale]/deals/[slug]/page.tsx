import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import DealRadarSubscribeForm from "@/components/deal-radar/DealRadarSubscribeForm";
import DigestContent from "@/components/deal-radar/DigestContent";
import { isAdminEmail, SITE } from "@/lib/config/site";
import type { DrOpportunity, DrWeeklyDigest } from "@/lib/deal-radar/types";
import { weekSlugToTitleDate } from "@/lib/deal-radar/week";
import { createAdminClient, createClient } from "@/lib/supabase/server";

// One Deal Radar edition — the SEO permalink, rendered as the same ledger
// as the /deals showcase. Draft editions render only for a logged-in admin
// (?preview=1 from the review screen).

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string; locale: string }>;
  searchParams: Promise<{ preview?: string }>;
}

async function loadDigest(slug: string, allowDraft: boolean) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("dr_weekly_digests")
    .select("*")
    .eq("week_slug", slug)
    .maybeSingle();
  const digest = data as DrWeeklyDigest | null;
  if (!digest) return null;
  if (digest.status !== "published" && !allowDraft) return null;

  const { data: oppData } = await supabase
    .from("dr_opportunities")
    .select("*")
    .eq("week_id", digest.id)
    .in("status", digest.status === "published" ? ["included"] : ["included", "new"])
    .order("score", { ascending: false });

  return { digest, opportunities: (oppData ?? []) as DrOpportunity[] };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const title = `Fitness Brand Deals & Collabs — Week of ${weekSlugToTitleDate(slug)}`;
  const description = `This week's open fitness brand deals, UGC gigs, and brands actively spending on creator ads. Curated for fitness creators by ${SITE.name}.`;
  return {
    title: `${title} | ${SITE.name}`,
    description,
    alternates: { canonical: `${SITE.url}/deals/${slug}` },
    openGraph: { title, description, url: `${SITE.url}/deals/${slug}`, type: "article" },
  };
}

export default async function DealsPostPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { preview } = await searchParams;

  let allowDraft = false;
  if (preview === "1") {
    const authClient = await createClient();
    const { data: { user } } = await authClient.auth.getUser();
    allowDraft = Boolean(user && isAdminEmail(user.email));
  }

  const result = await loadDigest(slug, allowDraft);
  if (!result) notFound();
  const { digest, opportunities } = result;

  const title = `Fitness Brand Deals & Collabs — Week of ${weekSlugToTitleDate(slug)}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: title,
        datePublished: digest.published_at ?? undefined,
        author: { "@type": "Organization", name: SITE.name, url: SITE.url },
        publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
        mainEntityOfPage: `${SITE.url}/deals/${slug}`,
      },
      {
        "@type": "ItemList",
        name: title,
        numberOfItems: opportunities.length,
        itemListElement: opportunities.map((o, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: o.brand_name,
          url: o.source_url ?? undefined,
        })),
      },
    ],
  };

  return (
    <div className="min-h-screen bg-bg">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Masthead */}
      <div className="bg-surface-low">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-24 pb-16">
          {digest.status !== "published" && (
            <div className="bg-surface-input p-4 mb-10 max-w-md">
              <p className="font-sans text-label-sm uppercase text-error">
                Draft preview — not published, not indexed
              </p>
            </div>
          )}
          <div className="flex items-center gap-3 mb-4">
            <span className="w-7 h-[3px] bg-primary" aria-hidden />
            <p className="font-sans text-label-md uppercase text-primary">The Deal Radar</p>
          </div>
          <h1 className="font-serif text-display-lg lg:text-display-xl uppercase tracking-tight text-on-surface max-w-4xl">
            Week of {weekSlugToTitleDate(slug)}
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
        <DigestContent digest={digest} opportunities={opportunities} />

        {/* Subscribe CTA */}
        <div className="bg-surface-low p-8 lg:p-10 mt-20 max-w-3xl">
          <div className="flex items-center gap-3 mb-2">
            <span className="w-7 h-[3px] bg-primary" aria-hidden />
            <p className="font-sans text-label-md uppercase text-primary">Get this in your inbox</p>
          </div>
          <p className="font-sans text-sm text-on-surface-variant mb-5">
            One email a week. Human-curated, double opt-in, one-click unsubscribe.
          </p>
          <DealRadarSubscribeForm />
        </div>

        <div className="mt-12">
          <Link
            href="/deals"
            className="font-sans text-sm text-on-surface-variant hover:text-primary uppercase"
          >
            All editions
          </Link>
        </div>
      </div>
    </div>
  );
}
