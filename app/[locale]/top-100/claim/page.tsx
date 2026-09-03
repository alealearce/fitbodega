import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { BadgeCheck, MapPin, Globe } from "lucide-react";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { SITE } from "@/lib/config/site";
import { getListingUrl } from "@/lib/utils/listingUrl";
import { CLAIMABLE_LISTS, getEntry, isClaimableList } from "@/lib/top100/registry";
import ClaimTop100Form from "./ClaimTop100Form";
import ClaimSearch from "./ClaimSearch";

export const metadata = {
  title: "Claim your Top 100 profile",
  robots: { index: false },
};

export default async function ClaimTop100Page({
  searchParams,
}: {
  searchParams: { list?: string; rank?: string };
}) {
  const list = searchParams.list ?? "";
  const rank = Number.parseInt(searchParams.rank ?? "", 10);

  // No list/rank — the hero "Claim your profile" buttons land here.
  // Claims are per-entry, so point the visitor at their list first.
  if (!isClaimableList(list) || !Number.isInteger(rank)) {
    const searchIndex = Object.entries(CLAIMABLE_LISTS).flatMap(([id, c]) => [
      ...c.data.entries.map((e) => ({ n: e.name, l: id, r: e.rank })),
      // Bubbling Under names carry no rank — the search links them to the
      // list's on-the-radar section instead of a claim flow.
      ...(c.data.bubblingUnder ?? []).map((b) => ({ n: b.name, l: id })),
    ]);
    const listMeta = Object.fromEntries(
      Object.entries(CLAIMABLE_LISTS).map(([id, c]) => [
        id,
        {
          title: c.title,
          page: c.page,
          // The Vancouver 50 is a journal post with no radar anchor.
          radar: id === "van50" ? c.page : `${c.page}#bubbling-under`,
        },
      ]),
    );
    return (
      <div className="min-h-screen bg-bg px-6 py-24">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-7 h-[3px] bg-primary" aria-hidden />
            <p className="font-sans text-label-md uppercase text-primary">
              Claim your Top 100 profile
            </p>
          </div>
          <h1 className="font-serif text-display-sm uppercase text-on-surface mb-4">
            Find your name first
          </h1>
          <p className="font-sans text-sm text-on-surface-variant mb-8">
            Search your name to jump to your spot on the list — every list is covered,
            the Vancouver 50 included. Your card has the claim link; approved claims can
            update everything on the profile, including the picture. Or browse below.
          </p>
          <ClaimSearch items={searchIndex} lists={listMeta} />
          <div className="space-y-5">
            {Object.entries(CLAIMABLE_LISTS).map(([id, c]) => (
              <Link
                key={id}
                href={c.page}
                className="block font-sans text-sm font-bold uppercase tracking-wide text-on-surface hover:text-primary transition-colors"
              >
                {c.title}
              </Link>
            ))}
          </div>
          <p className="font-sans text-sm text-on-surface-variant mt-10">
            Not ranked yet?{" "}
            <Link
              href="/measure-up"
              className="text-primary font-bold underline underline-offset-4"
            >
              Get a free report
            </Link>{" "}
            that compares your business with the Top 100.
          </p>
        </div>
      </div>
    );
  }

  const entry = getEntry(list, rank);
  if (!entry) notFound();
  const config = CLAIMABLE_LISTS[list];

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/top-100/claim?list=${list}&rank=${rank}`)}`);
  }

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("top100_claims")
    .select("status, listings!inner(slug, type, status)")
    .eq("list_id", list)
    .eq("entry_name", entry.name)
    .in("status", ["pending", "approved"])
    .maybeSingle();

  const claimedListing = existing?.listings as unknown as
    | { slug: string; type: string; status: string }
    | undefined;

  return (
    <div className="min-h-screen bg-bg px-6 py-24">
      <div className="max-w-xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-7 h-[3px] bg-primary" aria-hidden />
            <p className="font-sans text-label-md uppercase text-primary">
              Claim your Top 100 profile
            </p>
          </div>
          <h1 className="font-serif text-display-sm uppercase text-on-surface mb-2">
            {entry.name}
          </h1>
          <p className="font-sans text-sm text-on-surface-variant">
            Ranked #{entry.rank} — {config.title}
          </p>
        </div>

        {/* What we already know — this prefills the profile */}
        <div className="bg-surface-card p-6 mb-6">
          <p className="font-sans text-label-sm uppercase text-on-surface-variant mb-4">
            Your profile starts with what the ranking already knows
          </p>
          <div className="space-y-2 font-sans text-sm text-on-surface">
            {entry.city && (
              <p className="flex items-center gap-2">
                <MapPin size={14} className="text-primary flex-shrink-0" aria-hidden />
                {entry.city}
              </p>
            )}
            {entry.website && (
              <p className="flex items-center gap-2">
                <Globe size={14} className="text-primary flex-shrink-0" aria-hidden />
                {entry.website.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
              </p>
            )}
            <p className="text-on-surface-variant">{entry.who}</p>
          </div>
          <p className="font-sans text-xs text-on-surface-variant/70 mt-4">
            After approval you can edit everything and add photos from your dashboard.
          </p>
        </div>

        {existing ? (
          <div className="bg-surface-low p-6 space-y-3">
            {existing.status === "approved" ? (
              <>
                <p className="font-sans text-sm text-on-surface flex items-start gap-2">
                  <BadgeCheck size={16} className="text-primary flex-shrink-0 mt-0.5" aria-hidden />
                  This profile is already claimed.
                </p>
                {claimedListing?.status === "approved" && (
                  <Link
                    href={getListingUrl(claimedListing.type, claimedListing.slug)}
                    className="inline-block font-sans text-sm font-semibold text-primary hover:underline"
                  >
                    View the profile
                  </Link>
                )}
                <p className="font-sans text-sm text-on-surface-variant">
                  Yours and you&apos;ve lost access? Email{" "}
                  <a href={`mailto:${SITE.email}`} className="text-primary underline">
                    {SITE.email}
                  </a>
                  .
                </p>
              </>
            ) : (
              <p className="font-sans text-sm text-on-surface">
                A claim for this profile is already under review. If that&apos;s you,
                we&apos;ll be in touch by email.
              </p>
            )}
          </div>
        ) : (
          <ClaimTop100Form list={list} rank={entry.rank} userEmail={user.email ?? ""} />
        )}
      </div>
    </div>
  );
}
