"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { AUDIENCE_RANGES, CREATOR_PLATFORMS } from "@/lib/creators/profile";
import FMark from "@/components/ui/FMark";

// Step 2 of the creator flow: the profile that makes a creator visible to
// brands. Kept to one screen and under three minutes — everything optional is
// marked optional, and nothing here blocks the Deal Radar email from step 1.

export interface ProfileValues {
  email: string;
  name: string;
  niche: string;
  location: string;
  audience_size: string;
  primary_platform: string;
  instagram: string;
  tiktok: string;
  youtube: string;
  website: string;
  content_examples: string[];
  note: string;
  edit_token?: string;
}

export function emptyProfile(email = "", name = ""): ProfileValues {
  return {
    email,
    name,
    niche: "",
    location: "",
    audience_size: "",
    primary_platform: "Instagram",
    instagram: "",
    tiktok: "",
    youtube: "",
    website: "",
    content_examples: ["", ""],
    note: "",
  };
}

const inputClass =
  "w-full bg-surface-input px-4 py-3.5 font-sans text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:shadow-[inset_0_0_0_1px_rgba(209,252,0,0.4)] transition-all";
const labelClass = "block font-sans text-label-sm uppercase text-on-surface-variant mb-2";

export default function CreatorProfileForm({
  initial,
  lockEmail = true,
  mode = "create",
}: {
  initial: ProfileValues;
  lockEmail?: boolean;
  mode?: "create" | "edit";
}) {
  const [form, setForm] = useState<ProfileValues>(initial);
  const [status, setStatus] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  const set = <K extends keyof ProfileValues>(k: K, v: ProfileValues[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    // The chip fields and the "one link" rule can't use HTML validation —
    // catch them here so nobody meets a server error message.
    if (!form.audience_size) {
      setStatus("error");
      setMessage("Pick an audience size — brands filter on it.");
      return;
    }
    if (!form.instagram.trim() && !form.tiktok.trim() && !form.youtube.trim() && !form.website.trim()) {
      setStatus("error");
      setMessage("Add at least one handle or link — brands need somewhere to look.");
      return;
    }
    setStatus("busy");
    setMessage("");
    try {
      const res = await fetch("/api/creators/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          content_examples: form.content_examples.filter((u) => u.trim()),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "Could not save your profile.");
        return;
      }
      setStatus("done");
    } catch {
      setStatus("error");
      setMessage("Could not save your profile. Try again in a moment.");
    }
  }

  if (status === "done") {
    return (
      <div className="bg-surface-card p-8 lg:p-10">
        <FMark className="inline-block h-12 w-10 text-primary mb-7" />
        <h3 className="font-serif text-display-sm uppercase text-on-surface mb-4">
          {mode === "edit" ? "Profile updated" : "You're in the network"}
        </h3>
        <p className="font-sans text-base text-on-surface-variant leading-relaxed max-w-md">
          Brands browsing the network can see your profile, and every profile is considered
          for the FitBodega 100. We emailed you a private link for editing it later.
        </p>
        <Link
          href="/deals"
          className="inline-flex items-center gap-2 mt-8 px-8 py-4 bg-primary text-primary-on font-sans text-sm font-bold tracking-wide uppercase hover:opacity-90 transition-opacity"
        >
          See the board
          <ArrowUpRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="bg-surface-card p-6 lg:p-8 space-y-6">
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
              onChange={(e) => set("name", e.target.value)}
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
              readOnly={lockEmail}
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="you@example.com"
              className={`${inputClass} ${lockEmail ? "text-on-surface-variant" : ""}`}
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>
              Niche or discipline <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={120}
              value={form.niche}
              onChange={(e) => set("niche", e.target.value)}
              placeholder="Strength, running, recovery, nutrition..."
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Location (optional)</label>
            <input
              type="text"
              maxLength={120}
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
              placeholder="City or region"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>
            Audience size <span className="text-primary">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {AUDIENCE_RANGES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => set("audience_size", r)}
                className={`px-4 py-2.5 font-sans text-label-sm uppercase transition-colors duration-200 ${
                  form.audience_size === r
                    ? "bg-primary text-primary-on"
                    : "bg-surface-input text-on-surface hover:bg-surface-bright"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={labelClass}>
            Where you post most <span className="text-primary">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {CREATOR_PLATFORMS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => set("primary_platform", p)}
                className={`px-4 py-2.5 font-sans text-label-sm uppercase transition-colors duration-200 ${
                  form.primary_platform === p
                    ? "bg-primary text-primary-on"
                    : "bg-surface-input text-on-surface hover:bg-surface-bright"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={labelClass}>
            Handles and links <span className="text-primary">*</span>
          </label>
          <p className="font-sans text-xs text-on-surface-variant/70 mb-3">
            At least one. This is what a brand clicks.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            <input
              type="text"
              maxLength={120}
              value={form.instagram}
              onChange={(e) => set("instagram", e.target.value)}
              placeholder="Instagram — @handle"
              className={inputClass}
            />
            <input
              type="text"
              maxLength={120}
              value={form.tiktok}
              onChange={(e) => set("tiktok", e.target.value)}
              placeholder="TikTok — @handle"
              className={inputClass}
            />
            <input
              type="text"
              maxLength={120}
              value={form.youtube}
              onChange={(e) => set("youtube", e.target.value)}
              placeholder="YouTube — @handle"
              className={inputClass}
            />
            <input
              type="text"
              inputMode="url"
              maxLength={300}
              value={form.website}
              onChange={(e) => set("website", e.target.value)}
              placeholder="Website"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Content examples (optional)</label>
          <p className="font-sans text-xs text-on-surface-variant/70 mb-3">
            Two posts that show what you make at your best.
          </p>
          <div className="space-y-3">
            {form.content_examples.map((url, i) => (
              <input
                key={i}
                type="text"
                inputMode="url"
                maxLength={500}
                value={url}
                onChange={(e) =>
                  set(
                    "content_examples",
                    form.content_examples.map((u, j) => (j === i ? e.target.value : u))
                  )
                }
                placeholder={`https://instagram.com/p/...`}
                className={inputClass}
              />
            ))}
          </div>
        </div>

        <div>
          <label className={labelClass}>One line about your work (optional)</label>
          <input
            type="text"
            maxLength={300}
            value={form.note}
            onChange={(e) => set("note", e.target.value)}
            placeholder="What you make, and the brand work you want"
            className={inputClass}
          />
        </div>
      </div>

      {status === "error" && (
        <p className="font-sans text-sm text-error bg-surface-card px-4 py-3">{message}</p>
      )}

      <button
        type="submit"
        disabled={status === "busy"}
        className="w-full py-4 bg-primary text-primary-on font-sans text-sm font-bold tracking-wide uppercase transition-opacity duration-400 hover:opacity-90 disabled:opacity-60"
      >
        {status === "busy"
          ? "Saving..."
          : mode === "edit"
            ? "Save my profile"
            : "Publish my profile"}
      </button>

      <p className="font-sans text-xs text-on-surface-variant/60">
        Your profile is public to brands browsing the network. Your email address is not —
        brands reach you through the links you list. See our{" "}
        <a href="/privacy" className="underline hover:text-on-surface-variant">
          Privacy Policy
        </a>
        .
      </p>
    </form>
  );
}
