"use client";

import { useState } from "react";
import { ImagePlus, X, Check } from "lucide-react";
import { CATEGORIES } from "@/lib/config/categories";
import CountrySelect from "@/components/ui/CountrySelect";
import type { Listing } from "@/lib/supabase/types";
import { compressImage } from "@/lib/utils/compressImage";

const MAX_IMAGES = 3;
const MAX_IMAGE_SIZE = 4 * 1024 * 1024; // 4MB

const inputClass =
  "w-full px-4 py-3 bg-surface-input font-sans text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:shadow-[inset_0_0_0_1px_rgba(209,252,0,0.4)] transition-all";

const labelClass = "block font-sans text-label-sm uppercase text-on-surface-variant mb-2";

type EditListing = Pick<
  Listing,
  | "id" | "name" | "slug" | "tagline" | "description" | "email" | "phone"
  | "website" | "address" | "city" | "country" | "specialties"
  | "social_instagram" | "social_facebook" | "social_youtube" | "social_tiktok"
  | "images"
>;

export default function EditForm({ listing }: { listing: EditListing }) {
  const [form, setForm] = useState({
    name:             listing.name,
    tagline:          listing.tagline ?? "",
    description:      listing.description ?? "",
    email:            listing.email ?? "",
    phone:            listing.phone ?? "",
    website:          listing.website ?? "",
    address:          listing.address ?? "",
    city:             listing.city ?? "",
    country:          listing.country ?? "",
    specialties:      listing.specialties ?? [],
    social_instagram: listing.social_instagram ?? "",
    social_facebook:  listing.social_facebook ?? "",
    social_youtube:   listing.social_youtube ?? "",
    social_tiktok:    listing.social_tiktok ?? "",
  });
  const [existing, setExisting] = useState<string[]>(listing.images ?? []);
  const [newPhotos, setNewPhotos] = useState<{ file: File; preview: string }[]>([]);
  const [photoError, setPhotoError] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  const totalPhotos = existing.length + newPhotos.length;

  const addPhotos = async (files: FileList | null) => {
    if (!files) return;
    setPhotoError("");
    const next = [...newPhotos];
    for (const raw of Array.from(files)) {
      if (existing.length + next.length >= MAX_IMAGES) {
        setPhotoError(`Maximum ${MAX_IMAGES} images.`);
        break;
      }
      if (!raw.type.startsWith("image/")) { setPhotoError("Only image files are accepted."); continue; }
      // Oversized picks are compressed in the browser — no work for the user.
      const file = raw.size > MAX_IMAGE_SIZE ? await compressImage(raw) : raw;
      if (file.size > MAX_IMAGE_SIZE) { setPhotoError("We couldn't process that image — please try a smaller one."); continue; }
      next.push({ file, preview: URL.createObjectURL(file) });
    }
    setNewPhotos(next);
  };

  const removeExisting = (url: string) => setExisting(prev => prev.filter(u => u !== url));
  const removeNew = (index: number) => {
    setNewPhotos(prev => {
      URL.revokeObjectURL(prev[index]?.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const toggleSpecialty = (label: string) => {
    setForm(f => ({
      ...f,
      specialties: f.specialties.includes(label)
        ? f.specialties.filter(s => s !== label)
        : [...f.specialties, label],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("saving");
    setMessage("");
    try {
      const formData = new FormData();
      formData.set(
        "payload",
        JSON.stringify({ slug: listing.slug, ...form, existing_images: existing })
      );
      newPhotos.forEach((p, i) => formData.set(`image${i}`, p.file));

      const res = await fetch("/api/business/update", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok) {
        setStatus("saved");
        if (Array.isArray(data.images)) {
          setExisting(data.images);
          newPhotos.forEach(p => URL.revokeObjectURL(p.preview));
          setNewPhotos([]);
        }
      } else {
        setStatus("error");
        setMessage(data.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Basic Info */}
      <div className="bg-surface-low p-8 space-y-6">
        <h2 className="font-serif text-xl font-extrabold uppercase tracking-tight text-on-surface">
          Basic Information
        </h2>

        <div>
          <label className={labelClass}>
            Name <span className="text-primary">*</span>
          </label>
          <input
            type="text"
            required
            minLength={2}
            maxLength={100}
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Your space or practice name"
            className={inputClass}
          />
        </div>

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
            maxLength={2000}
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Describe your space, your approach, what makes you unique, who you train..."
            className={`${inputClass} resize-none`}
          />
        </div>
      </div>

      {/* Contact */}
      <div className="bg-surface-low p-8 space-y-6">
        <h2 className="font-serif text-xl font-extrabold uppercase tracking-tight text-on-surface">
          Contact
        </h2>

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
              maxLength={30}
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
              maxLength={160}
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
              minLength={2}
              maxLength={100}
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
              onClick={() => toggleSpecialty(cat.label)}
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

      {/* Photos */}
      <div className="bg-surface-low p-8">
        <h2 className="font-serif text-xl font-extrabold uppercase tracking-tight text-on-surface mb-2">
          Photos
        </h2>
        <p className="font-sans text-sm text-on-surface-variant mb-6">
          Up to {MAX_IMAGES} images, 4MB each. The first one is your cover — lead
          with your strongest shot of the space.
        </p>

        <div className="grid grid-cols-3 gap-3">
          {existing.map((url, i) => (
            <div key={url} className="relative aspect-[4/3] bg-surface-input overflow-hidden group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Listing photo ${i + 1}`} className="w-full h-full object-cover" />
              {i === 0 && (
                <span className="absolute top-2 left-2 px-2 py-0.5 bg-primary text-primary-on font-sans text-label-sm uppercase">
                  Cover
                </span>
              )}
              <button
                type="button"
                onClick={() => removeExisting(url)}
                aria-label="Remove photo"
                className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center bg-bg/80 text-on-surface hover:bg-error hover:text-on-surface transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          ))}
          {newPhotos.map((p, i) => (
            <div key={p.preview} className="relative aspect-[4/3] bg-surface-input overflow-hidden group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.preview} alt={`New photo ${i + 1}`} className="w-full h-full object-cover" />
              <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-surface-bright text-on-surface-variant font-sans text-label-sm uppercase">
                New
              </span>
              <button
                type="button"
                onClick={() => removeNew(i)}
                aria-label="Remove photo"
                className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center bg-bg/80 text-on-surface hover:bg-error hover:text-on-surface transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          ))}
          {totalPhotos < MAX_IMAGES && (
            <label className="aspect-[4/3] bg-surface-input flex flex-col items-center justify-center gap-2 cursor-pointer text-on-surface-variant hover:bg-surface-bright hover:text-on-surface transition-colors">
              <ImagePlus size={22} />
              <span className="font-sans text-label-sm uppercase">Add Photo</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                multiple
                className="hidden"
                onChange={e => { addPhotos(e.target.files); e.target.value = ""; }}
              />
            </label>
          )}
        </div>
        {photoError && <p className="font-sans text-xs text-error mt-3">{photoError}</p>}
        <p className="font-sans text-xs text-on-surface-variant/60 mt-4">
          By uploading, you confirm you own these images or have the right to publish them.
        </p>
      </div>

      {/* Error */}
      {status === "error" && (
        <p className="font-sans text-sm text-error bg-surface-low px-4 py-3">{message}</p>
      )}

      {/* Save */}
      <button
        type="submit"
        disabled={status === "saving"}
        className="w-full py-4 bg-primary text-primary-on font-sans text-sm font-bold tracking-wide uppercase transition-opacity duration-400 hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {status === "saving" ? (
          <span className="flex items-center justify-center gap-3">
            <span className="w-4 h-4 border-2 border-primary-on border-t-transparent rounded-full animate-spin" />
            Saving...
          </span>
        ) : status === "saved" ? (
          <span className="inline-flex items-center gap-2">
            <Check size={16} />
            Saved
          </span>
        ) : (
          "Save Changes"
        )}
      </button>
    </form>
  );
}
