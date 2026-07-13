import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SITE } from "@/lib/config/site";
import type { Listing } from "@/lib/supabase/types";
import EditForm from "./EditForm";

export const metadata = {
  title: `Edit Listing — ${SITE.name}`,
  robots: { index: false },
};

export default async function DashboardEditPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/login?next=/dashboard/edit/${params.slug}`);

  // RLS lets owners read their own rows; the owner_id check guards against
  // the public approved-listings read policy matching someone else's listing.
  const { data } = await supabase
    .from("listings")
    .select(
      "id, name, slug, owner_id, status, tagline, description, email, phone, website, address, city, country, specialties, social_instagram, social_facebook, social_youtube, social_tiktok, images"
    )
    .eq("slug", params.slug)
    .maybeSingle();

  const listing = data as
    | Pick<
        Listing,
        | "id" | "name" | "slug" | "owner_id" | "status" | "tagline" | "description"
        | "email" | "phone" | "website" | "address" | "city" | "country"
        | "specialties" | "social_instagram" | "social_facebook" | "social_youtube"
        | "social_tiktok" | "images"
      >
    | null;

  if (!listing || listing.owner_id !== user.id) notFound();

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
          <p className="font-sans text-label-md uppercase text-primary">Edit Listing</p>
        </div>
        <h1 className="font-serif text-display-sm uppercase text-on-surface mb-4">
          {listing.name}
        </h1>
        <p className="font-sans text-base text-on-surface-variant leading-relaxed mb-10 max-w-xl">
          Update your public details. Changes go live immediately
          {listing.status !== "approved" && " once your listing is approved"}.
        </p>

        <EditForm listing={listing} />
      </div>
    </div>
  );
}
