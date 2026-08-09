"use client";

import { useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { normalizeUrl } from "@/lib/utils/validation";
import FMark from "@/components/ui/FMark";

type FormState = "idle" | "loading" | "success" | "error";

// Must match CATEGORIES / BUDGET_RANGES in app/api/brands/inquire/route.ts
const CATEGORIES = [
  "Supplements & nutrition",
  "Recovery studio or gym",
  "Fitness apparel",
  "Fitness equipment",
  "Wellness products",
  "Other",
] as const;

const BUDGET_RANGES = ["Under $5K", "$5K–$15K", "$15K–$50K", "$50K+", "Not sure yet"] as const;

const INITIAL = {
  name:           "",
  email:          "",
  company:        "",
  website:        "",
  category:       "",
  target_market:  "",
  liked_creators: "",
  budget_range:   "",
  notes:          "",
};

const inputClass =
  "w-full px-4 py-3 bg-surface-input font-sans text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:shadow-[inset_0_0_0_1px_rgba(209,252,0,0.4)] transition-all";

const labelClass = "block font-sans text-label-sm uppercase text-on-surface-variant mb-2";

export default function BrandInquiryForm() {
  const [form,    setForm]    = useState(INITIAL);
  const [status,  setStatus]  = useState<FormState>("idle");
  const [message, setMessage] = useState("");
  const errorRef = useRef<HTMLParagraphElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category) {
      setStatus("error");
      setMessage("Tell us what you sell — pick a category.");
      setTimeout(() => errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
      return;
    }
    setStatus("loading");
    try {
      const res = await fetch("/api/brands/inquire", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          // Accept bare domains — prepend https:// so "yourbrand.com" just works.
          website: normalizeUrl(form.website),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("success");
        setForm(INITIAL);
      } else {
        setStatus("error");
        setMessage(data.error ?? "Something went wrong. Please try again.");
        setTimeout(() => errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
      }
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
      setTimeout(() => errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
    }
  };

  if (status === "success") {
    return (
      <div className="bg-surface-card p-10 text-center">
        <FMark className="inline-block h-14 w-12 text-primary mb-8" />
        <h3 className="font-serif text-display-sm uppercase text-on-surface mb-5">
          Got it
        </h3>
        <p className="font-sans text-base text-on-surface-variant leading-relaxed max-w-md mx-auto">
          We&apos;ll come back with a first take on creators worth testing — before you spend
          a dollar.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-surface-card p-8 space-y-6">
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>
              Name <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={100}
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Your name"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>
              Email <span className="text-primary">*</span>
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="you@yourbrand.com"
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>
              Brand / company <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={100}
              value={form.company}
              onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
              placeholder="Your brand"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Website</label>
            <input
              type="text"
              inputMode="url"
              value={form.website}
              onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
              placeholder="https://yourbrand.com"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>
            What do you sell? <span className="text-primary">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setForm(f => ({ ...f, category: cat }))}
                className={`px-4 py-2.5 font-sans text-label-sm uppercase transition-colors duration-300 ${
                  form.category === cat
                    ? "bg-primary text-primary-on"
                    : "bg-surface-input text-on-surface-variant hover:bg-surface-bright hover:text-on-surface"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={labelClass}>
            Who is your target market? <span className="text-primary">*</span>
          </label>
          <textarea
            required
            rows={3}
            maxLength={1000}
            value={form.target_market}
            onChange={e => setForm(f => ({ ...f, target_market: e.target.value }))}
            placeholder="Who buys from you — age, training style, where they are..."
            className={`${inputClass} resize-none`}
          />
        </div>

        <div>
          <label className={labelClass}>Which creators do you like?</label>
          <textarea
            rows={3}
            maxLength={1000}
            value={form.liked_creators}
            onChange={e => setForm(f => ({ ...f, liked_creators: e.target.value }))}
            placeholder="Handles or links — who already feels right for your brand?"
            className={`${inputClass} resize-none`}
          />
        </div>

        <div>
          <label className={labelClass}>Monthly budget range</label>
          <div className="flex flex-wrap gap-2">
            {BUDGET_RANGES.map(b => (
              <button
                key={b}
                type="button"
                onClick={() => setForm(f => ({ ...f, budget_range: f.budget_range === b ? "" : b }))}
                className={`px-4 py-2.5 font-sans text-label-sm uppercase transition-colors duration-300 ${
                  form.budget_range === b
                    ? "bg-primary text-primary-on"
                    : "bg-surface-input text-on-surface-variant hover:bg-surface-bright hover:text-on-surface"
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={labelClass}>Anything else?</label>
          <textarea
            rows={3}
            maxLength={1000}
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Timelines, past creator work, questions for us..."
            className={`${inputClass} resize-none`}
          />
        </div>
      </div>

      {status === "error" && (
        <p ref={errorRef} className="font-sans text-sm text-error bg-surface-card px-4 py-3">
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full py-4 bg-primary text-primary-on font-sans text-sm font-bold tracking-wide uppercase transition-opacity duration-400 hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {status === "loading" ? (
          <span className="flex items-center justify-center gap-3">
            <span className="w-4 h-4 border-2 border-primary-on border-t-transparent rounded-full animate-spin" />
            Sending...
          </span>
        ) : (
          <span className="inline-flex items-center gap-2">
            Book an intro call
            <ArrowUpRight size={16} />
          </span>
        )}
      </button>

      <p className="font-sans text-xs text-on-surface-variant/60 text-center">
        By sending, you agree to our{" "}
        <a href="/terms" className="underline hover:text-on-surface-variant">Terms of Use</a>{" "}
        and{" "}
        <a href="/privacy" className="underline hover:text-on-surface-variant">Privacy Policy</a>.
      </p>
    </form>
  );
}
