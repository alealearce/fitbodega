import type { Metadata } from "next";
import ProfileEditor from "@/components/creators/ProfileEditor";

// Private edit screen for a creator profile. The token in the URL is the only
// key — profiles have no account behind them — so this page is never indexed.

export const metadata: Metadata = {
  title: "Edit your creator profile",
  robots: { index: false, follow: false },
};

export default async function CreatorProfilePage(
  props: {
    searchParams: Promise<{ token?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-3xl mx-auto px-6 lg:px-8 pt-32 pb-24 lg:pt-40">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-7 h-[3px] bg-primary" aria-hidden />
          <p className="font-sans text-label-md uppercase text-primary">Your profile</p>
        </div>
        <h1 className="font-serif text-display-md uppercase text-on-surface mb-10">
          Edit your profile
        </h1>
        <ProfileEditor token={searchParams.token ?? ""} />
      </div>
    </div>
  );
}
