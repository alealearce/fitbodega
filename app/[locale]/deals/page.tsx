import type { Metadata } from "next";
import Link from "next/link";
import DealBoard from "@/components/deal-radar/DealBoard";
import DigestContent from "@/components/deal-radar/DigestContent";
import JoinTheRadar from "@/components/creators/JoinTheRadar";
import { SITE } from "@/lib/config/site";
import { splitBoard } from "@/lib/deal-radar/board";
import type { DrOpportunity, DrWeeklyDigest } from "@/lib/deal-radar/types";
import { weekSlugToTitleDate } from "@/lib/deal-radar/week";
import { createAdminClient } from "@/lib/supabase/server";

// The board, in two labelled sections: deals a creator can act on (Section A,
// brand-posted first) and brands we track spending on creator content
// elsewhere (Section B). Past editions stay readable below, as published.

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Deal Radar — Fitness Brand Deals & Creator-Ad Spend",
  description:
    "Open fitness brand deals you can apply to, kept separate from weekly intelligence on the brands paying for creator content. Free for creators.",
  alternates: { canonical: `${SITE.url}/deals` },
  openGraph: {
    title: "Deal Radar — Fitness Brand Deals & Creator-Ad Spend",
    description:
      "Deals you can take, and the brands buying creator content elsewhere. Two sections, never mixed.",
    url: `${SITE.url}/deals`,
  },
};

export default async function DealsShowcasePage() {
  const supabase = createAdminClient();

  const { data: digestData } = await supabase
    .from("dr_weekly_digests")
    .select("*")
    .eq("status", "published")
    .order("week_slug", { ascending: false });
  const digests = (digestData ?? []) as DrWeeklyDigest[];

  const { data: oppData } = digests.length
    ? await supabase
        .from("dr_opportunities")
        .select("*")
        .in("week_id", digests.map((d) => d.id))
        .eq("status", "included")
        .order("score", { ascending: false })
    : { data: [] };
  const allOpps = (oppData ?? []) as DrOpportunity[];
  const oppsFor = (id: string) => allOpps.filter((o) => o.week_id === id);

  // Brand-posted board deals (week_id null) join the current board directly —
  // they go live on approval, between editions.
  const { data: boardData } = await supabase
    .from("dr_opportunities")
    .select("*")
    .is("week_id", null)
    .eq("status", "included")
    .order("score", { ascending: false });
  const boardDeals = (boardData ?? []) as DrOpportunity[];

  const [latest, ...past] = digests;
  const currentBoard = latest ? [...boardDeals, ...oppsFor(latest.id)] : boardDeals;
  const board = splitBoard(currentBoard);

  return (
    <div className="min-h-screen bg-bg">
      {/* Masthead — the offer, then the one action this page wants */}
      <div className="bg-surface-low">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-24 pb-16">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-7 h-[3px] bg-primary" aria-hidden />
            <p className="font-sans text-label-md uppercase text-primary">The Deal Radar</p>
          </div>
          <h1 className="font-serif text-display-lg lg:text-display-xl uppercase tracking-tight text-on-surface max-w-4xl">
            Fitness brand deals, every week
          </h1>
          <p className="font-sans text-base lg:text-lg text-on-surface-variant mt-6 max-w-2xl">
            On the board is what you can take today — deals brands posted here, plus open
            listings we found, each one naming where you apply. The Radar is intelligence: the
            brands paying for creator content somewhere else, tracked weekly.
          </p>
          <div className="mt-10 max-w-2xl">
            <p className="font-sans text-label-md uppercase text-primary mb-4">
              Get it in your inbox
            </p>
            <JoinTheRadar id="join" />
          </div>
        </div>
      </div>

      {/* Current board */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-14">
          <h2 className="font-serif text-display-sm lg:text-display-md uppercase font-extrabold tracking-tight text-on-surface">
            {latest ? `Week of ${weekSlugToTitleDate(latest.week_slug)}` : "The board"}
          </h2>
          <p className="font-sans text-sm text-on-surface-variant max-w-sm">
            Hiring creators?{" "}
            <Link href="/for-brands" className="text-on-surface hover:text-primary underline">
              Post your deal free
            </Link>{" "}
            — reviewed by hand, live on this board.
          </p>
        </div>

        <DealBoard
          posted={board.posted}
          found={board.found}
          radar={board.radar}
          variant="full"
        />

        {latest && (
          <Link
            href={`/deals/${latest.week_slug}`}
            className="mt-16 inline-block font-sans text-sm text-on-surface-variant hover:text-primary uppercase"
          >
            Permalink for this edition
          </Link>
        )}

        {/* Past editions — as published, date-labeled dropdowns */}
        {past.length > 0 && (
          <section className="mt-24">
            <div className="flex items-center gap-3 mb-8">
              <span className="w-7 h-[3px] bg-primary" aria-hidden />
              <h2 className="font-sans text-label-md uppercase text-primary">Past editions</h2>
            </div>
            {past.map((d) => (
              <details key={d.id} className="group bg-surface-card mb-6">
                <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden p-6 lg:p-8 flex items-center justify-between hover:bg-surface-input transition-colors duration-300">
                  <span className="font-serif text-xl lg:text-2xl font-extrabold uppercase tracking-tight text-on-surface">
                    Week of {weekSlugToTitleDate(d.week_slug)}
                  </span>
                  <span className="font-sans text-label-sm uppercase text-primary group-open:hidden" aria-hidden>
                    Read
                  </span>
                  <span className="font-sans text-label-sm uppercase text-on-surface-variant hidden group-open:inline" aria-hidden>
                    Close
                  </span>
                </summary>
                <div className="px-6 lg:px-8 pb-10 pt-4">
                  <DigestContent digest={d} opportunities={oppsFor(d.id)} />
                  <Link
                    href={`/deals/${d.week_slug}`}
                    className="mt-8 inline-block font-sans text-sm text-on-surface-variant hover:text-primary uppercase"
                  >
                    Permalink for this edition
                  </Link>
                </div>
              </details>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
