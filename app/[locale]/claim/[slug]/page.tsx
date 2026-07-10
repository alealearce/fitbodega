import { redirect, notFound } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { SITE } from "@/lib/config/site";
import ClaimForm from "./ClaimForm";

export const metadata = {
  title: `Claim your listing — ${SITE.name}`,
  robots: { index: false },
};

export default async function ClaimPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/claim/${encodeURIComponent(slug)}`);

  const admin = createAdminClient();
  const { data: listing } = await admin
    .from("listings")
    .select("id, name, slug, type, city, country, owner_id, certification_id")
    .eq("slug", slug)
    .maybeSingle();

  if (!listing) notFound();

  return (
    <div className="min-h-screen bg-bg px-6 py-24">
      <div className="max-w-xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-7 h-[3px] bg-primary" aria-hidden />
            <p className="font-sans text-label-md uppercase text-primary">Claim your listing</p>
          </div>
          <h1 className="font-serif text-display-sm uppercase text-on-surface mb-2">
            {listing.name}
          </h1>
          <p className="font-sans text-sm text-on-surface-variant">
            {[listing.city, listing.country].filter(Boolean).join(", ") || `${listing.type} listing`}
          </p>
        </div>

        {listing.owner_id ? (
          <div className="bg-surface-low p-6 space-y-3">
            <p className="font-sans text-sm text-on-surface">
              This listing is already claimed. If it&apos;s yours and you&apos;ve lost
              access, email <a href={`mailto:${SITE.email}`} className="text-primary underline">{SITE.email}</a>.
            </p>
          </div>
        ) : (
          <ClaimForm slug={listing.slug} existingYaId={listing.certification_id} userEmail={user.email ?? ""} />
        )}
      </div>
    </div>
  );
}
