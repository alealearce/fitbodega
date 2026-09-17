import { Suspense } from "react";
import type { Metadata } from "next";
import { SITE } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "Sign In",
  description: `Sign in to your ${SITE.name} account to manage your recovery studio, gym, coaching, nutrition, store, or youth sports listing.`,
  robots: { index: false },
};

// The page reads ?next= with useSearchParams, which needs a Suspense boundary.
export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <Suspense>{children}</Suspense>;
}
