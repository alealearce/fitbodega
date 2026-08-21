import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SITE } from "@/lib/config/site";
import {
  PUBLIC_PROFILE_COLUMNS,
  handleUrl,
  type PublicCreatorProfile,
} from "@/lib/creators/profile";
import { NETWORK_MIN_PROFILES } from "@/lib/creators/network";
import { createAdminClient } from "@/lib/supabase/server";

// The creator network, as brands see it. Profiles only — a Deal Radar
// subscriber who never completed a profile is not listed here. Emails are
// never exposed; brands reach creators through the links they published.

export const revalidate = 600;

// The page is only worth indexing once it holds real profiles; while it is
// holding it stays out of search entirely.
export async function generateMetadata(): Promise<Metadata> {
  const open = (await loadProfiles()).length >= NETWORK_MIN_PROFILES;
  return {
    title: "The Creator Network — Fitness Creators Open to Brand Work",
    description:
      "Fitness, training, recovery, and nutrition creators in the FitBodega network — niche, audience size, and where to find their work.",
    alternates: { canonical: `${SITE.url}/creators/network` },
    robots: open ? undefined : { index: false, follow: true },
  };
}

async function loadProfiles(): Promise<PublicCreatorProfile[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("creator_profiles")
    .select(PUBLIC_PROFILE_COLUMNS)
    .eq("status", "live")
    .order("created_at", { ascending: false });
  return (data ?? []) as unknown as PublicCreatorProfile[];
}

export default async function CreatorNetworkPage() {
  const profiles = await loadProfiles();
  const open = profiles.length >= NETWORK_MIN_PROFILES;

  return (
    <div className="min-h-screen bg-bg">
      <div className="bg-surface-low">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-32 pb-16 lg:pt-40">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-7 h-[3px] bg-primary" aria-hidden />
            <p className="font-sans text-label-md uppercase text-primary">The Creator Network</p>
          </div>
          <h1 className="font-serif text-display-lg uppercase tracking-tight text-on-surface max-w-4xl">
            Creators open to brand work
          </h1>
          <p className="font-sans text-base lg:text-lg text-on-surface-variant mt-6 max-w-2xl">
            {open
              ? "Every creator here completed a profile themselves. Niche, audience size, and the links to judge the work by. Brands: reach them through their own channels."
              : "The browse opens with its first profiles. Creators fill in their own — niche, audience size, and the links to judge the work by — and brands reach them through their own channels."}
          </p>
          <div className="flex flex-wrap items-center gap-6 mt-10">
            <Link
              href="/creators#join"
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-on font-sans text-sm font-bold tracking-wide uppercase hover:opacity-90 transition-opacity"
            >
              Add your profile
              <ArrowUpRight size={16} />
            </Link>
            <Link
              href="/for-brands"
              className="font-sans text-label-md uppercase text-on-surface-variant hover:text-on-surface transition-colors"
            >
              Hiring? Post a deal free
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
        {!open ? (
          <div className="max-w-3xl">
            <h2 className="font-serif text-display-sm uppercase text-on-surface">
              Not open yet
            </h2>
            <p className="font-sans text-base text-on-surface-variant mt-4">
              We would rather show you nothing than a thin list. The browse opens once the
              first profiles are in — complete yours and it is there from the first day
              brands look.
            </p>
            <Link
              href="/creators#join"
              className="inline-flex items-center gap-2 mt-8 px-8 py-4 bg-primary text-primary-on font-sans text-sm font-bold tracking-wide uppercase hover:opacity-90 transition-opacity"
            >
              Complete your profile
              <ArrowUpRight size={16} />
            </Link>
            <p className="font-sans text-base text-on-surface-variant mt-14 max-w-xl">
              In the meantime, the creators and businesses we already track are in the
              FitBodega 100 — our own rankings, updated monthly. Being ranked there is not
              the same as being in the network: nobody on those lists has signed up for
              brand work here.
            </p>
            <Link
              href="/top-100"
              className="inline-flex items-center gap-2 mt-6 font-sans text-label-md uppercase text-on-surface hover:text-primary transition-colors duration-300"
            >
              See the FitBodega 100
              <ArrowUpRight size={16} />
            </Link>
          </div>
        ) : (
          <>
            <p className="font-sans text-label-md uppercase text-on-surface-variant mb-10">
              {profiles.length} {profiles.length === 1 ? "creator" : "creators"} in the network
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {profiles.map((p) => (
                <CreatorCard key={p.id} p={p} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function CreatorCard({ p }: { p: PublicCreatorProfile }) {
  const links: { label: string; href: string }[] = [];
  if (p.instagram) links.push({ label: `IG @${p.instagram}`, href: handleUrl("instagram", p.instagram) });
  if (p.tiktok) links.push({ label: `TikTok @${p.tiktok}`, href: handleUrl("tiktok", p.tiktok) });
  if (p.youtube) links.push({ label: `YouTube @${p.youtube}`, href: handleUrl("youtube", p.youtube) });
  if (p.website) links.push({ label: "Website", href: p.website });

  return (
    <div className="relative overflow-hidden bg-surface-card p-7 lg:p-8 flex flex-col">
      <span
        aria-hidden
        className="pointer-events-none select-none absolute -bottom-10 -right-1 font-serif font-extrabold leading-none tracking-tighter text-[8rem] text-on-surface/[0.04]"
      >
        {p.name.charAt(0).toUpperCase()}
      </span>
      <p className="relative font-sans text-label-sm uppercase text-on-surface-variant">
        {p.audience_size}
        {p.location ? ` · ${p.location}` : ""}
      </p>
      <h3 className="relative font-serif text-2xl lg:text-3xl font-extrabold uppercase tracking-tight text-on-surface mt-3">
        {p.name}
      </h3>
      <p className="relative font-sans text-sm text-primary uppercase mt-2">{p.niche}</p>
      {p.note && (
        <p className="relative font-sans text-sm text-on-surface-variant leading-relaxed mt-4">
          {p.note}
        </p>
      )}
      <div className="relative mt-auto pt-7 flex flex-wrap gap-x-4 gap-y-2">
        {links.map((l) => (
          <a
            key={l.href}
            href={l.href}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="font-sans text-sm text-on-surface hover:text-primary transition-colors"
          >
            {l.label}
          </a>
        ))}
      </div>
      {p.content_examples.length > 0 && (
        <div className="relative mt-4 flex flex-wrap gap-x-4 gap-y-2">
          {p.content_examples.map((url, i) => (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="inline-flex items-center gap-1 font-sans text-label-sm uppercase text-on-surface-variant hover:text-primary transition-colors"
            >
              Example {i + 1}
              <ArrowUpRight size={12} aria-hidden />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
