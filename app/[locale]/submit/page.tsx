"use client";

import { useState } from "react";
import { ArrowUpRight, ImagePlus, X } from "lucide-react";
import { LISTING_TYPES, FOUNDER_QUESTIONS } from "@/lib/config/site";
import { CATEGORIES, SCHOOL_CERTIFICATIONS, PRODUCT_CATEGORIES, LISTING_LANGUAGES } from "@/lib/config/categories";
import CountrySelect from "@/components/ui/CountrySelect";

type FormState = "idle" | "loading" | "success" | "error";

const PRICE_RANGES = [
  { value: "$",    label: "$ — Budget" },
  { value: "$$",   label: "$$ — Mid" },
  { value: "$$$",  label: "$$$ — Premium" },
  { value: "$$$$", label: "$$$$ — Elite" },
] as const;

const MAX_IMAGES       = 3;
const MAX_IMAGE_SIZE   = 4 * 1024 * 1024; // 4MB
const STORY_ANSWER_MAX = 600;

const INITIAL = {
  name:              "",
  type:              "",
  email:             "",
  phone:             "",
  website:           "",
  address:           "",
  city:              "",
  country:           "",
  tagline:           "",
  description:       "",
  specialties:       [] as string[],
  experience_levels: [] as string[],
  languages:         [] as string[],
  price_range:       "",
  social_instagram:  "",
  social_facebook:   "",
  social_youtube:    "",
  social_tiktok:     "",
  certification_id:  "",
  notes:             "",
  founder_story:     {} as Record<string, string>,
  story_opt_out:     false,
};

const inputClass =
  "w-full px-4 py-3 bg-surface-input font-sans text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:shadow-[inset_0_0_0_1px_rgba(209,252,0,0.4)] transition-all";

const labelClass = "block font-sans text-label-sm uppercase text-on-surface-variant mb-2";

export default function SubmitPage() {
  const [form,    setForm]    = useState(INITIAL);
  const [images,  setImages]  = useState<{ file: File; preview: string }[]>([]);
  const [imageError, setImageError] = useState("");
  const [status,  setStatus]  = useState<FormState>("idle");
  const [message, setMessage] = useState("");

  const addImages = (files: FileList | null) => {
    if (!files) return;
    setImageError("");
    const next = [...images];
    for (const file of Array.from(files)) {
      if (next.length >= MAX_IMAGES) { setImageError(`Maximum ${MAX_IMAGES} images.`); break; }
      if (!file.type.startsWith("image/")) { setImageError("Only image files are accepted."); continue; }
      if (file.size > MAX_IMAGE_SIZE) { setImageError("Each image must be under 4MB."); continue; }
      next.push({ file, preview: URL.createObjectURL(file) });
    }
    setImages(next);
  };

  const removeImage = (index: number) => {
    setImages(prev => {
      URL.revokeObjectURL(prev[index]?.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const setAnswer = (key: string, value: string) => {
    setForm(f => ({ ...f, founder_story: { ...f.founder_story, [key]: value } }));
  };

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
      // Multipart: JSON payload + image files
      const formData = new FormData();
      formData.set("payload", JSON.stringify(form));
      images.forEach((img, i) => formData.set(`image${i}`, img.file));

      const res = await fetch("/api/business/submit", {
        method: "POST",
        body:   formData,
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("success");
        setMessage(data.message ?? "Thank you. We'll review your listing within 2–3 business days.");
        setForm(INITIAL);
        images.forEach(img => URL.revokeObjectURL(img.preview));
        setImages([]);
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
                  <label className={labelClass}>Phone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="604-555-0123"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Address / Neighbourhood</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                    placeholder="1131 West Georgia St, Downtown"
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
                <label className={labelClass}>Tagline</label>
                <input
                  type="text"
                  maxLength={200}
                  value={form.tagline}
                  onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))}
                  placeholder="One sharp line that sells your space"
                  className={inputClass}
                />
                <p className="font-sans text-xs text-on-surface-variant/60 mt-2">
                  Shown on your listing card. Keep it short and confident.
                </p>
              </div>

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

            {/* Images */}
            <div className="bg-surface-low p-8">
              <h2 className="font-serif text-xl font-extrabold uppercase tracking-tight text-on-surface mb-2">
                Photos
              </h2>
              <p className="font-sans text-sm text-on-surface-variant mb-6">
                Up to {MAX_IMAGES} images, 4MB each. The first one is your cover — lead with your strongest shot of the space. The same photos front your Member Spotlight below.
              </p>

              <div className="grid grid-cols-3 gap-3">
                {images.map((img, i) => (
                  <div key={img.preview} className="relative aspect-[4/3] bg-surface-input overflow-hidden group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.preview} alt={`Upload ${i + 1}`} className="w-full h-full object-cover" />
                    {i === 0 && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 bg-primary text-primary-on font-sans text-label-sm uppercase">
                        Cover
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      aria-label="Remove image"
                      className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center bg-bg/80 text-on-surface hover:bg-error hover:text-on-surface transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}

                {images.length < MAX_IMAGES && (
                  <label className="aspect-[4/3] bg-surface-input flex flex-col items-center justify-center gap-2 cursor-pointer text-on-surface-variant hover:bg-surface-bright hover:text-on-surface transition-colors">
                    <ImagePlus size={22} />
                    <span className="font-sans text-label-sm uppercase">Add Photo</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      multiple
                      className="hidden"
                      onChange={e => { addImages(e.target.files); e.target.value = ""; }}
                    />
                  </label>
                )}
              </div>

              {imageError && (
                <p className="font-sans text-xs text-error mt-3">{imageError}</p>
              )}
              <p className="font-sans text-xs text-on-surface-variant/60 mt-4">
                By uploading, you confirm you own these images or have the right to publish them.
              </p>
            </div>

            {/* Member Spotlight — story questions; reuses the photos above */}
            <div className="bg-surface-low p-8 space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-7 h-[3px] bg-primary" aria-hidden />
                  <p className="font-sans text-label-md uppercase text-primary">Member Spotlight</p>
                </div>
                <h2 className="font-serif text-xl font-extrabold uppercase tracking-tight text-on-surface mb-3">
                  Get featured
                </h2>
                <p className="font-sans text-sm text-on-surface-variant leading-relaxed">
                  Every member who joins gets introduced: a spotlight published in The Journal
                  and featured across our channels, led by the photos you added above. Answer in
                  your own words — two or three sentences each is plenty. We shape it into your
                  introduction.
                </p>
              </div>

              {/* Opt-out toggle */}
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, story_opt_out: !f.story_opt_out }))}
                className="flex items-center gap-3 text-left group"
              >
                <span
                  className={`w-5 h-5 flex-shrink-0 flex items-center justify-center transition-colors duration-300 ${
                    form.story_opt_out ? "bg-primary text-primary-on" : "bg-surface-input"
                  }`}
                  aria-hidden
                >
                  {form.story_opt_out && <X size={13} />}
                </span>
                <span className="font-sans text-sm text-on-surface-variant group-hover:text-on-surface transition-colors">
                  Prefer not to be featured? Check this and we simply list your space — no
                  spotlight, no social feature.
                </span>
              </button>

              {!form.story_opt_out && (
                <>
                  {FOUNDER_QUESTIONS.map(q => (
                    <div key={q.key}>
                      <label className={labelClass}>{q.label}</label>
                      <textarea
                        rows={3}
                        maxLength={STORY_ANSWER_MAX}
                        value={form.founder_story[q.key] ?? ""}
                        onChange={e => setAnswer(q.key, e.target.value)}
                        placeholder="In your own words..."
                        className={`${inputClass} resize-none`}
                      />
                      <p className="font-sans text-xs text-on-surface-variant/60 mt-1 text-right">
                        {(form.founder_story[q.key] ?? "").length}/{STORY_ANSWER_MAX}
                      </p>
                    </div>
                  ))}

                  <p className="font-sans text-xs text-on-surface-variant/60">
                    Answer at least 3 questions to qualify — your photos above lead the spotlight
                    and the social feature. All of it stays editable from your dashboard.
                  </p>
                </>
              )}
            </div>

            {/* Pricing */}
            <div className="bg-surface-low p-8">
              <h2 className="font-serif text-xl font-extrabold uppercase tracking-tight text-on-surface mb-2">
                Pricing
              </h2>
              <p className="font-sans text-sm text-on-surface-variant mb-6">
                Give visitors a sense of your price point. Put specifics (drop-in rates, memberships, packages) in your description.
              </p>
              <div className="flex flex-wrap gap-2">
                {PRICE_RANGES.map(p => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, price_range: f.price_range === p.value ? "" : p.value }))}
                    className={`px-4 py-2.5 font-sans text-label-sm uppercase transition-colors duration-300 ${
                      form.price_range === p.value
                        ? "bg-primary text-primary-on"
                        : "bg-surface-input text-on-surface-variant hover:bg-surface-bright hover:text-on-surface"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Social Media */}
            <div className="bg-surface-low p-8 space-y-5">
              <div>
                <h2 className="font-serif text-xl font-extrabold uppercase tracking-tight text-on-surface mb-2">
                  Social Media
                </h2>
                <p className="font-sans text-sm text-on-surface-variant">
                  Where can people follow your work?
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>Instagram</label>
                  <input
                    type="url"
                    value={form.social_instagram}
                    onChange={e => setForm(f => ({ ...f, social_instagram: e.target.value }))}
                    placeholder="https://instagram.com/yourspace"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>TikTok</label>
                  <input
                    type="url"
                    value={form.social_tiktok}
                    onChange={e => setForm(f => ({ ...f, social_tiktok: e.target.value }))}
                    placeholder="https://tiktok.com/@yourspace"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>Facebook</label>
                  <input
                    type="url"
                    value={form.social_facebook}
                    onChange={e => setForm(f => ({ ...f, social_facebook: e.target.value }))}
                    placeholder="https://facebook.com/yourspace"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>YouTube</label>
                  <input
                    type="url"
                    value={form.social_youtube}
                    onChange={e => setForm(f => ({ ...f, social_youtube: e.target.value }))}
                    placeholder="https://youtube.com/@yourspace"
                    className={inputClass}
                  />
                </div>
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
