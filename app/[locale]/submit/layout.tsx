import type { Metadata } from "next";
import { SITE } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "List Your Space in the Network",
  description: "Add your recovery studio, gym, coaching practice, nutrition service, health food store, or youth sports program to the FitBodega directory. Free to apply — reviewed within 2–3 business days.",
  alternates: { canonical: `${SITE.url}/submit` },
};

export default function SubmitLayout({ children }: { children: React.ReactNode }) {
  return children;
}
