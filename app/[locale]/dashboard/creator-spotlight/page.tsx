import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import type { CreatorProfile } from "@/lib/creators/profile";
import CreatorSpotlightEditor from "./CreatorSpotlightEditor";

export const metadata = {
  title: "Your Creator Spotlight",
  robots: { index: false },
};

const NEXT = "/dashboard/creator-spotlight";

export default async function CreatorSpotlightPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(NEXT)}`);

  // Profiles are token-keyed, not owner-keyed: the signed-in account's
  // confirmed email is what ties it to a row. Same rule as the API route.
  const email = (user.email ?? "").toLowerCase();
  const confirmed = Boolean(user.email_confirmed_at);
  const admin = createAdminClient();
  const { data } = email
    ? await admin
        .from("creator_profiles")
        .select("id, name, niche, spotlight_story, spotlight_images, spotlight_opt_out, spotlight_post_id")
        .eq("email", email)
        .maybeSingle()
    : { data: null };
  const profile = data as
    | Pick<CreatorProfile, "id" | "name" | "niche" | "spotlight_story" | "spotlight_images" | "spotlight_opt_out" | "spotlight_post_id">
    | null;

  return (
    <div className="min-h-screen bg-bg px-6 py-16">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 font-sans text-sm text-on-surface-variant hover:text-on-surface transition-colors mb-8"
        >
          <ArrowLeft size={15} />
          Back to Dashboard
        </Link>

        <div className="flex items-center gap-3 mb-4">
          <span className="w-7 h-[3px] bg-primary" aria-hidden />
          <p className="font-sans text-label-md uppercase text-primary">Creator Spotlight</p>
        </div>
        <h1 className="font-serif text-display-sm uppercase text-on-surface mb-4">
          Your Spotlight
        </h1>

        {!profile ? (
          <div className="bg-surface-card p-8 lg:p-10 mt-8">
            <p className="font-sans text-base text-on-surface-variant leading-relaxed max-w-md">
              There is no creator profile under <span className="text-on-surface">{user.email}</span>.
              The spotlight is for creators in the network, so the profile comes first, about
              three minutes. Use this same email so we can match the two.
            </p>
            <Link
              href="/creators#join"
              className="inline-flex items-center gap-2 mt-8 px-8 py-4 bg-primary text-primary-on font-sans text-sm font-bold tracking-wide uppercase hover:opacity-90 transition-opacity"
            >
              Create my creator profile
              <ArrowUpRight size={16} />
            </Link>
          </div>
        ) : !confirmed ? (
          <div className="bg-surface-card p-8 lg:p-10 mt-8">
            <p className="font-sans text-base text-on-surface-variant leading-relaxed max-w-md">
              Confirm your email address first, then come back here. The confirmation link is
              in the email we sent when you created the account.
            </p>
          </div>
        ) : (
          <>
            <p className="font-sans text-base text-on-surface-variant leading-relaxed mb-10 max-w-xl">
              Every creator in the network gets introduced: a spotlight published in The Journal
              and featured across our channels, where brands read it. Answer in your own words;
              we shape it into the introduction for{" "}
              <span className="text-on-surface">{profile.name}</span>.
            </p>
            <CreatorSpotlightEditor profile={profile} />
          </>
        )}
      </div>
    </div>
  );
}
