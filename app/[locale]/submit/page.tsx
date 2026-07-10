"use client";

import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { LISTING_TYPES } from "@/lib/config/site";
import { CATEGORIES, SCHOOL_CERTIFICATIONS, PRODUCT_CATEGORIES, LISTING_LANGUAGES } from "@/lib/config/categories";
import CountrySelect from "@/components/ui/CountrySelect";

type FormState = "idle" | "loading" | "success" | "error";

const INITIAL = {
  name:              "",
  type:              "",
  email:             "",
  website:           "",
  city:              "",
  country:           "",
  description:       "",
  specialties:       [] as string[],
  experience_levels: [] as string[],
  languages:         [] as string[],
  certification_id:  "",
  notes:             "",
};

const inputClass =
  "w-full px-4 py-3 bg-surface-input font-sans text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:shadow-[inset_0_0_0_1px_rgba(209,252,0,0.4)] transition-all";

const labelClass = "block font-sans text-label-sm uppercase text-on-surface-variant mb-2";

export default function SubmitPage() {
  const [form,    setForm]    = useState(INITIAL);
  const [status,  setStatus]  = useState<FormState>("idle");
  const [message, setMessage] = useState("");

  const toggle = (style: string) => {
    setForm(f => ({
      ...f,
      specialties: f.specialties.includes(style)
        ? f.specialties.filter(s => s !== style)
        : [...f.specialties, style],
    }));
  };

  const toggleLanguage = (lang: string) => {
    setForm(f => ({
      ...f,
      languages: f.languages.includes(lang)
        ? f.languages.filter(l => l !== lang)
        : [...f.languages, lang],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/business/submit", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("success");
        setMessage(data.message ?? "Thank you. We'll review your listing within 2–3 business days.");
        setForm(INITIAL);
      } else {
        setStatus("error");
        setMessage(data.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  };

  if (status === "success") {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-6">
        <div className="max-w-md text-center py-20">
          <p className="font-serif text-5xl font-extrabold text-primary mb-6">FB</p>
          <h1 className="font-serif text-display-sm uppercase text-on-surface mb-4">
            You&apos;re in the queue
          </h1>
          <p className="font-sans text-base text-on-surface-variant leading-relaxed mb-8">
            {message}
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-on font-sans text-sm font-bold tracking-wide uppercase transition-opacity duration-400 hover:opacity-90"
          >
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-12 bg-bg">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-7 h-[3px] bg-primary" aria-hidden />
            <p className="font-sans text-label-md uppercase text-primary">Join the Directory</p>
          </div>
          <h1 className="font-serif text-display-md uppercase text-on-surface mb-4">
            Put your space on the map
          </h1>
          <p className="font-sans text-lg text-on-surface-variant leading-relaxed">
            List your recovery studio, gym, coaching practice, nutrition service, health food store, or youth program in the curated network — free to apply, reviewed by our team.
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="pb-24 bg-bg">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Basic Info */}
            <div className="bg-surface-low p-8 space-y-6">
              <h2 className="font-serif text-xl font-extrabold uppercase tracking-tight text-on-surface">
                Basic Information
              </h2>

              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>
                    Name <span className="text-primary">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Your space or practice name"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Type <span className="text-primary">*</span>
                  </label>
                  <select
                    required
                    value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    className={`${inputClass} appearance-none cursor-pointer`}
                  >
                    <option value="">Select a type...</option>
                    {LISTING_TYPES.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>
                    Email <span className="text-primary">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="hello@yourspace.com"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Website</label>
                  <input
                    type="url"
                    value={form.website}
                    onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                    placeholder="https://yourspace.com"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>
                    City <span className="text-primary">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.city}
                    onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                    placeholder="e.g. Vancouver"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Country <span className="text-primary">*</span>
                  </label>
                  <CountrySelect
                    required
                    value={form.country}
                    onChange={country => setForm(f => ({ ...f, country }))}
                    placeholder="Select a country…"
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>
                  Certification / License ID <span className="text-on-surface-variant/60 normal-case font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={form.certification_id}
                  onChange={e => setForm(f => ({ ...f, certification_id: e.target.value }))}
                  placeholder="CSCS, NSCA, Registered Dietitian, etc."
                  className={inputClass}
                />
                <p className="font-sans text-xs text-on-surface-variant/60 mt-2">
                  If you hold a relevant certification or license, include it — we&apos;ll add a verified badge to your listing.
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="bg-surface-low p-8 space-y-6">
              <h2 className="font-serif text-xl font-extrabold uppercase tracking-tight text-on-surface">
                Tell Us About Your Space
              </h2>

              <div>
                <label className={labelClass}>
                  Description <span className="text-primary">*</span>
                </label>
                <textarea
                  required
                  rows={5}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Describe your space, your approach, what makes you unique, who you train..."
                  className={`${inputClass} resize-none`}
                />
              </div>
            </div>

            {/* Specialties */}
            <div className="bg-surface-low p-8">
              <h2 className="font-serif text-xl font-extrabold uppercase tracking-tight text-on-surface mb-2">
                Specialties
              </h2>
              <p className="font-sans text-sm text-on-surface-variant mb-6">
                Select all that apply.
              </p>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggle(cat.label)}
                    className={`px-4 py-2.5 font-sans text-label-sm uppercase transition-colors duration-300 ${
                      form.specialties.includes(cat.label)
                        ? "bg-primary text-primary-on"
                        : "bg-surface-input text-on-surface-variant hover:bg-surface-bright hover:text-on-surface"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Languages */}
            <div className="bg-surface-low p-8">
              <h2 className="font-serif text-xl font-extrabold uppercase tracking-tight text-on-surface mb-2">
                Languages
              </h2>
              <p className="font-sans text-sm text-on-surface-variant mb-6">
                Which languages do you coach or serve clients in? Select all that apply.
              </p>
              <div className="flex flex-wrap gap-2">
                {LISTING_LANGUAGES.map(lang => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => toggleLanguage(lang)}
                    className={`px-4 py-2.5 font-sans text-label-sm uppercase transition-colors duration-300 ${
                      form.languages.includes(lang)
                        ? "bg-primary text-primary-on"
                        : "bg-surface-input text-on-surface-variant hover:bg-surface-bright hover:text-on-surface"
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            {/* Trainer — Certifications */}
            {form.type === "trainer" && (
              <div className="bg-surface-low p-8">
                <h2 className="font-serif text-xl font-extrabold uppercase tracking-tight text-on-surface mb-2">
                  Coach Certifications
                </h2>
                <p className="font-sans text-sm text-on-surface-variant mb-6">
                  What certifications do you hold?
                </p>
                <div className="flex flex-wrap gap-2">
                  {SCHOOL_CERTIFICATIONS.map(cert => (
                    <button
                      key={cert}
                      type="button"
                      onClick={() => setForm(f => ({
                        ...f,
                        experience_levels: f.experience_levels.includes(cert)
                          ? f.experience_levels.filter(v => v !== cert)
                          : [...f.experience_levels, cert],
                      }))}
                      className={`px-4 py-2.5 font-sans text-label-sm uppercase transition-colors duration-300 ${
                        form.experience_levels.includes(cert)
                          ? "bg-primary text-primary-on"
                          : "bg-surface-input text-on-surface-variant hover:bg-surface-bright hover:text-on-surface"
                      }`}
                    >
                      {cert}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Store — Categories */}
            {form.type === "store" && (
              <div className="bg-surface-low p-8">
                <h2 className="font-serif text-xl font-extrabold uppercase tracking-tight text-on-surface mb-2">
                  Store Categories
                </h2>
                <p className="font-sans text-sm text-on-surface-variant mb-6">
                  What does your store carry?
                </p>
                <div className="flex flex-wrap gap-2">
                  {PRODUCT_CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setForm(f => ({
                        ...f,
                        experience_levels: f.experience_levels.includes(cat)
                          ? f.experience_levels.filter(v => v !== cat)
                          : [...f.experience_levels, cat],
                      }))}
                      className={`px-4 py-2.5 font-sans text-label-sm uppercase transition-colors duration-300 ${
                        form.experience_levels.includes(cat)
                          ? "bg-primary text-primary-on"
                          : "bg-surface-input text-on-surface-variant hover:bg-surface-bright hover:text-on-surface"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="bg-surface-low p-8">
              <h2 className="font-serif text-xl font-extrabold uppercase tracking-tight text-on-surface mb-4">
                Anything else to share?
              </h2>
              <textarea
                rows={3}
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Any questions, special context, or notes for our team..."
                className={`${inputClass} resize-none`}
              />
            </div>

            {/* Error */}
            {status === "error" && (
              <p className="font-sans text-sm text-error bg-surface-low px-4 py-3">
                {message}
              </p>
            )}

            {/* Submit */}
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
                  Submit Your Space
                  <ArrowUpRight size={16} />
                </span>
              )}
            </button>

            <p className="font-sans text-xs text-on-surface-variant/60 text-center">
              By submitting, you agree to our{" "}
              <a href="/terms" className="underline hover:text-on-surface-variant">Terms of Use</a>{" "}
              and{" "}
              <a href="/privacy" className="underline hover:text-on-surface-variant">Privacy Policy</a>.
              We review all listings within 2–3 business days.
            </p>
          </form>
        </div>
      </section>
    </>
  );
}
