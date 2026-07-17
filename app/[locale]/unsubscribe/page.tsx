import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";
import { SITE } from "@/lib/config/site";
import FMark from "@/components/ui/FMark";

export const metadata = {
  title: `Unsubscribed — ${SITE.name}`,
  robots: { index: false },
};

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  let success = false;

  if (token) {
    const adminSupabase = createAdminClient();
    const { error } = await adminSupabase
      .from("newsletter_subscribers")
      .update({ is_confirmed: false })
      .eq("unsubscribe_token", token);

    if (!error) success = true;
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-6 py-24">
      <div className="text-center max-w-md">
        <FMark className="inline-block h-12 w-10 text-primary mb-8" />

        {success || !token ? (
          <>
            <h1 className="font-serif text-display-sm uppercase text-on-surface mb-4">
              You&apos;ve been unsubscribed
            </h1>
            <p className="font-sans text-base text-on-surface-variant mb-8 leading-relaxed">
              You&apos;ve been removed from The Dispatch. We&apos;ll miss having
              you in the network.
            </p>
            <p className="font-sans text-sm text-on-surface-variant mb-10">
              Changed your mind? You can always re-subscribe from our homepage.
            </p>
          </>
        ) : (
          <>
            <h1 className="font-serif text-display-sm uppercase text-on-surface mb-4">
              Something went wrong
            </h1>
            <p className="font-sans text-base text-on-surface-variant mb-8 leading-relaxed">
              We couldn&apos;t process your unsubscribe request. The link may be
              invalid or expired.
            </p>
            <p className="font-sans text-sm text-on-surface-variant mb-10">
              Please contact us at{" "}
              <a
                href={`mailto:${SITE.email}`}
                className="text-primary hover:underline"
              >
                {SITE.email}
              </a>{" "}
              and we&apos;ll take care of it.
            </p>
          </>
        )}

        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-on font-sans text-sm font-bold tracking-wide uppercase transition-opacity duration-400 hover:opacity-90"
        >
          Return home
          <ArrowUpRight size={16} />
        </Link>
      </div>
    </div>
  );
}
