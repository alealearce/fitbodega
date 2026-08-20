"use client";

import { useState } from "react";

// Post-a-deal form — the brand door into the marketplace. Free. Submissions
// go to dr_deal_submissions and are reviewed by hand before going live.

const PLATFORM_OPTIONS = ["instagram", "tiktok", "youtube", "x", "podcast", "blog"];

const inputClass =
  "w-full bg-surface-input text-on-surface font-sans text-sm px-4 py-4 focus:outline-none focus:shadow-[inset_0_0_0_1px_rgba(209,252,0,0.4)] placeholder:text-on-surface-variant/60";

export default function PostDealForm() {
  const [form, setForm] = useState({
    brandName: "",
    brandWebsite: "",
    contactEmail: "",
    offerType: "paid",
    compensationText: "",
    deliverables: "",
    applyUrl: "",
    notes: "",
  });
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("busy");
    try {
      const res = await fetch("/api/deal-radar/deals/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, platforms }),
      });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className="bg-surface-card p-8">
        <p className="font-serif text-2xl font-extrabold uppercase tracking-tight text-on-surface mb-3">
          Deal received
        </p>
        <p className="font-sans text-sm text-on-surface-variant">
          Every deal is reviewed by hand before it goes on the board — usually within one
          business day. You will hear from us at the email you gave if anything needs
          clarifying.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-5">
      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label className="block font-sans text-label-sm uppercase text-on-surface-variant mb-2">
            Brand name
          </label>
          <input required maxLength={120} value={form.brandName} onChange={(e) => set("brandName", e.target.value)} className={inputClass} placeholder="Ridge Fuel Nutrition" />
        </div>
        <div>
          <label className="block font-sans text-label-sm uppercase text-on-surface-variant mb-2">
            Website
          </label>
          <input type="url" maxLength={300} value={form.brandWebsite} onChange={(e) => set("brandWebsite", e.target.value)} className={inputClass} placeholder="https://yourbrand.com" />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label className="block font-sans text-label-sm uppercase text-on-surface-variant mb-2">
            Contact email
          </label>
          <input required type="email" maxLength={200} value={form.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} className={inputClass} placeholder="partnerships@yourbrand.com" />
        </div>
        <div>
          <label className="block font-sans text-label-sm uppercase text-on-surface-variant mb-2">
            Deal type
          </label>
          <div className="flex gap-2">
            {(["paid", "gifted", "commission"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => set("offerType", t)}
                className={`font-sans text-label-sm uppercase px-4 py-3.5 flex-1 ${form.offerType === t ? "bg-primary text-primary-on" : "bg-surface-input text-on-surface hover:bg-surface-bright"}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className="block font-sans text-label-sm uppercase text-on-surface-variant mb-2">
          What it pays
        </label>
        <input required maxLength={300} value={form.compensationText} onChange={(e) => set("compensationText", e.target.value)} className={inputClass} placeholder="$250 per video / 20% commission / gifted product ($240 value)" />
      </div>

      <div>
        <label className="block font-sans text-label-sm uppercase text-on-surface-variant mb-2">
          What the creator makes
        </label>
        <textarea required maxLength={600} rows={3} value={form.deliverables} onChange={(e) => set("deliverables", e.target.value)} className={inputClass} placeholder="Two 30-45s vertical UGC videos, raw footage delivery, usage rights for paid ads" />
      </div>

      <div>
        <label className="block font-sans text-label-sm uppercase text-on-surface-variant mb-2">
          Platforms
        </label>
        <div className="flex flex-wrap gap-2">
          {PLATFORM_OPTIONS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() =>
                setPlatforms((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]))
              }
              className={`font-sans text-label-sm uppercase px-4 py-2.5 ${platforms.includes(p) ? "bg-primary text-primary-on" : "bg-surface-input text-on-surface hover:bg-surface-bright"}`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block font-sans text-label-sm uppercase text-on-surface-variant mb-2">
          Application link (optional — we use your email otherwise)
        </label>
        <input type="url" maxLength={400} value={form.applyUrl} onChange={(e) => set("applyUrl", e.target.value)} className={inputClass} placeholder="https://yourbrand.com/creators" />
      </div>

      <div>
        <label className="block font-sans text-label-sm uppercase text-on-surface-variant mb-2">
          Anything else (optional)
        </label>
        <textarea maxLength={1000} rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} className={inputClass} placeholder="Follower minimums, region, timeline" />
      </div>

      <div>
        <button
          type="submit"
          disabled={state === "busy"}
          className="px-8 py-4 bg-primary text-primary-on font-sans text-sm font-bold tracking-wide uppercase hover:opacity-90 disabled:opacity-40"
        >
          {state === "busy" ? "Submitting" : "Post the deal — free"}
        </button>
        {state === "error" && (
          <p className="font-sans text-sm text-error mt-3">
            Could not submit. Check the fields and try again.
          </p>
        )}
      </div>
    </form>
  );
}
