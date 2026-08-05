import type { Metadata } from "next";
import { SITE, DEFAULT_OG_IMAGE } from "@/lib/config/site";
import AuditForm from "@/components/top100/AuditForm";

const PAGE_TITLE = "Measure Up — Free Audit Against the FitBodega 100";
const PAGE_DESC =
  "Enter your Instagram or website and get a free, personalized audit: concrete improvements, each one anchored to how a FitBodega 100 name handles it.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESC,
  alternates: { canonical: `${SITE.url}/measure-up` },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESC,
    url: `${SITE.url}/measure-up`,
    images: [DEFAULT_OG_IMAGE],
    siteName: SITE.name,
    locale: "en_US",
    type: "website",
  },
};

export default function MeasureUpPage() {
  return (
    <main className="bg-bg">
      {/* ── Hero ── */}
      <section className="pt-32 pb-16 lg:pt-40 lg:pb-20 bg-bg relative overflow-hidden">
        <span
          aria-hidden
          className="pointer-events-none select-none absolute -top-10 -right-6 font-serif font-extrabold leading-none tracking-tighter text-[16rem] lg:text-[24rem] text-on-surface/[0.04]"
        >
          100
        </span>
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-7 h-[3px] bg-primary" aria-hidden />
            <p className="font-sans text-label-md uppercase text-primary">The FitBodega 100</p>
          </div>
          <h1 className="font-serif text-display-lg lg:text-display-xl uppercase tracking-tight text-on-surface max-w-4xl">
            How do you <span className="text-primary">measure up</span>?
          </h1>
          <p className="font-sans text-base lg:text-lg text-on-surface-variant mt-6 max-w-2xl">
            The FitBodega 100 ranks the people, places, and spaces that define training culture.
            Tell us who you are and we&apos;ll send you a free audit — concrete improvements, each
            one showing how a name from the rankings handles it.
          </p>
        </div>
      </section>

      {/* ── The form / the report ── */}
      <section className="py-16 lg:py-20 bg-surface-low">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <AuditForm />
        </div>
      </section>
    </main>
  );
}
