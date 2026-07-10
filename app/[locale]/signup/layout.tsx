import type { Metadata } from "next";
import { SITE } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "Create Account",
  description: `Create a ${SITE.name} account to submit and manage your recovery studio, gym, coaching, nutrition, store, or youth sports listing.`,
  robots: { index: false },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
