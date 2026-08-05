"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Loader2 } from "lucide-react";

const TYPES: { id: string; label: string }[] = [
  { id: "coach", label: "Coach / Trainer" },
  { id: "gym", label: "Gym / Studio" },
  { id: "creator", label: "Content Creator" },
  { id: "recovery", label: "Recovery Space" },
  { id: "store", label: "Health Food Store" },
  { id: "club", label: "Run Club / Crew" },
  { id: "nutritionist", label: "Nutritionist" },
  { id: "retreat", label: "Retreat / Resort" },
  { id: "athlete", label: "Athlete" },
];

type Recommendation = {
  title: string;
  detail: string;
  exemplarName: string;
  exemplarRank: number;
  listSlug: string;
  listLabel: string;
  study: string;
};
type Report = {
  headline: string;
  assessment: string;
  recommendations: Recommendation[];
  nextStep: string;
};

const inputClass =
  "w-full bg-surface-input px-5 py-4 font-sans text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:shadow-[inset_0_0_0_1px_rgba(209,252,0,0.4)]";

export default function AuditForm() {
  const [entityType, setEntityType] = useState("coach");
  const [instagram, setInstagram] = useState("");
  const [website, setWebsite] = useState("");
  const [goal, setGoal] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<Report | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!instagram.trim() && !website.trim()) {
      setError("Add your Instagram or your website — at least one.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/top100-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, entity_type: entityType, instagram, website, goal }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setReport(data.report);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong — try again.");
    } finally {
      setLoading(false);
    }
  }

  if (report) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-4">
          <span className="w-7 h-[3px] bg-primary" aria-hidden />
          <p className="font-sans text-label-md uppercase text-primary">Your audit</p>
        </div>
        <h2 className="font-serif text-display-md uppercase text-on-surface max-w-3xl">
          {report.headline}
        </h2>
        <p className="font-sans text-base text-on-surface-variant mt-5 max-w-2xl">
          {report.assessment}
        </p>

        <div className="mt-12 space-y-3 max-w-3xl">
          {report.recommendations.map((r, i) => (
            <div key={i} className="relative overflow-hidden bg-surface-card p-7">
              <span
                aria-hidden
                className="pointer-events-none select-none absolute -bottom-8 -right-2 font-serif font-extrabold leading-none tracking-tighter text-[8rem] text-on-surface/[0.04]"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="relative font-sans text-label-sm text-on-surface-variant tabular-nums mb-3">
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className="relative font-serif text-xl lg:text-2xl font-extrabold uppercase tracking-tight text-on-surface">
                {r.title}
              </h3>
              <p className="relative font-sans text-sm text-on-surface-variant mt-3 leading-relaxed">
                {r.detail}
              </p>
              <div className="relative mt-4">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <span className="w-5 h-[3px] bg-primary" aria-hidden />
                  <span className="font-sans text-label-sm uppercase text-primary">Study</span>
                </div>
                <p className="font-sans text-sm text-on-surface">
                  <Link href={r.listSlug} className="font-bold hover:text-primary transition-colors">
                    {r.exemplarName}
                  </Link>{" "}
                  <span className="text-on-surface-variant">
                    (#{r.exemplarRank}, {r.listLabel})
                  </span>{" "}
                  — {r.study}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-primary p-8 lg:p-10 max-w-3xl">
          <p className="font-sans text-base text-primary-on/90 max-w-xl">{report.nextStep}</p>
          <Link
            href="/submit"
            className="inline-flex items-center gap-2 mt-6 px-8 py-4 bg-bg text-on-surface font-sans text-sm font-bold tracking-wide uppercase hover:opacity-90 transition-opacity"
          >
            List your space
            <ArrowUpRight size={16} />
          </Link>
        </div>
        <p className="font-sans text-xs text-on-surface-variant/70 mt-6 max-w-2xl">
          A copy is in your inbox. Benchmarks reference the FitBodega 100 — editorial rankings,
          reviewed monthly. This is not an official ranking of you.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="max-w-2xl">
      <p className="font-sans text-label-md uppercase text-on-surface-variant mb-4">I am a</p>
      <div className="flex flex-wrap gap-2 mb-10">
        {TYPES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setEntityType(t.id)}
            className={`px-4 py-2.5 font-sans text-label-sm uppercase transition-colors duration-200 ${
              entityType === t.id
                ? "bg-primary text-primary-on"
                : "bg-surface-input text-on-surface hover:bg-surface-bright"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <input
          type="text"
          value={instagram}
          onChange={(e) => setInstagram(e.target.value)}
          placeholder="Instagram handle (e.g. @yourname)"
          className={inputClass}
        />
        <input
          type="text"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder="Website (e.g. yoursite.com)"
          className={inputClass}
        />
        <input
          type="text"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="What are you trying to grow? (optional)"
          className={inputClass}
        />
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email — we send the full report here"
          className={inputClass}
        />
      </div>

      {error && <p className="font-sans text-sm text-error mt-4">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="mt-8 inline-flex items-center gap-3 px-8 py-4 bg-primary text-primary-on font-sans text-sm font-bold tracking-wide uppercase hover:opacity-90 transition-opacity disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Measuring you against the 100...
          </>
        ) : (
          "Get my audit"
        )}
      </button>
      <p className="font-sans text-xs text-on-surface-variant/70 mt-4">
        Free. One report per submission, sent to your email. No spam — this is how we meet the
        next generation of the 100.
      </p>
    </form>
  );
}
