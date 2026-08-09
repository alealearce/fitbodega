"use client";

import { useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { normalizeUrl } from "@/lib/utils/validation";
import FMark from "@/components/ui/FMark";

type FormState = "idle" | "loading" | "success" | "error";

// Must match FOLLOWER_RANGES in app/api/creators/apply/route.ts
const FOLLOWER_RANGES = ["5K–25K", "25K–100K", "100K–500K", "500K+"] as const;

const PLATFORMS = ["Instagram", "TikTok", "YouTube", "X / Twitter", "Other"] as const;

const INITIAL = {
  name:            "",
  email:           "",
  platform:        "",
  handle:          "",
  follower_range:  "",
  niche:           "",
  has_brand_deals: null as boolean | null,
  best_post_url:   "",
};

const inputClass =
  "w-full px-4 py-3 bg-surface-input font-sans text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:shadow-[inset_0_0_0_1px_rgba(209,252,0,0.4)] transition-all";

const labelClass = "block font-sans text-label-sm uppercase text-on-surface-variant mb-2";

export default function CreatorApplicationForm() {
  const [form,    setForm]    = useState(INITIAL);
  const [status,  setStatus]  = useState<FormState>("idle");
  const [message, setMessage] = useState("");
  const errorRef = useRef<HTMLParagraphElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.has_brand_deals === null) {
      setStatus("error");
      setMessage("Tell us whether you've done brand deals before.");
      setTimeout(() => errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
      return;
    }
    setStatus("loading");
    try {
      const res = await fetch("/api/creators/apply", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          // Accept bare domains — prepend https:// so "instagram.com/p/…" just works.
          best_post_url: normalizeUrl(form.best_post_url),
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
          You&apos;re in the queue
        </h3>
        <p className="font-sans text-base text-on-surface-variant leading-relaxed max-w-md mx-auto">
          We review every application — if it&apos;s a fit, you&apos;ll hear from us with
          next steps.
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
              placeholder="you@example.com"
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>
              Primary platform <span className="text-primary">*</span>
            </label>
            <select
              required
              value={form.platform}
              onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}
              className={`${inputClass} appearance-none cursor-pointer`}
            >
              <option value="">Select a platform...</option>
              {PLATFORMS.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>
              Handle <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={100}
              value={form.handle}
              onChange={e => setForm(f => ({ ...f, handle: e.target.value }))}
              placeholder="@yourhandle"
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>
              Follower count <span className="text-primary">*</span>
            </label>
            <select
              required
              value={form.follower_range}
              onChange={e => setForm(f => ({ ...f, follower_range: e.target.value }))}
              className={`${inputClass} appearance-none cursor-pointer`}
            >
              <option value="">Select a range...</option>
              {FOLLOWER_RANGES.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>
              Niche <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={120}
              value={form.niche}
              onChange={e => setForm(f => ({ ...f, niche: e.target.value }))}
              placeholder="Strength, running, recovery, nutrition..."
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>
            Have you done brand deals before? <span className="text-primary">*</span>
          </label>
          <div className="flex gap-2">
            {[{ label: "Yes", value: true }, { label: "No", value: false }].map(opt => (
              <button
                key={opt.label}
                type="button"
                onClick={() => setForm(f => ({ ...f, has_brand_deals: opt.value }))}
                className={`px-6 py-2.5 font-sans text-label-sm uppercase transition-colors duration-300 ${
                  form.has_brand_deals === opt.value
                    ? "bg-primary text-primary-on"
                    : "bg-surface-input text-on-surface-variant hover:bg-surface-bright hover:text-on-surface"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={labelClass}>
            Link to your best recent post <span className="text-primary">*</span>
          </label>
          <input
            type="text"
            inputMode="url"
            required
            value={form.best_post_url}
            onChange={e => setForm(f => ({ ...f, best_post_url: e.target.value }))}
            placeholder="https://instagram.com/p/..."
            className={inputClass}
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
            Submitting...
          </span>
        ) : (
          <span className="inline-flex items-center gap-2">
            Apply to join
            <ArrowUpRight size={16} />
          </span>
        )}
      </button>

      <p className="font-sans text-xs text-on-surface-variant/60 text-center">
        By applying, you agree to our{" "}
        <a href="/terms" className="underline hover:text-on-surface-variant">Terms of Use</a>{" "}
        and{" "}
        <a href="/privacy" className="underline hover:text-on-surface-variant">Privacy Policy</a>.
      </p>
    </form>
  );
}
