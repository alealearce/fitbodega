"use client";

import { useState } from "react";
import { ImagePlus, X, Check } from "lucide-react";
import { FOUNDER_QUESTIONS } from "@/lib/config/site";
import type { Listing } from "@/lib/supabase/types";

const MAX_STORY_PHOTOS = 3;
const MAX_IMAGE_SIZE = 4 * 1024 * 1024; // 4MB
const STORY_ANSWER_MAX = 600;

const inputClass =
  "w-full px-4 py-3 bg-surface-input font-sans text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:shadow-[inset_0_0_0_1px_rgba(209,252,0,0.4)] transition-all";

const labelClass = "block font-sans text-label-sm uppercase text-on-surface-variant mb-2";

type StoryListing = Pick<
  Listing,
  "id" | "name" | "slug" | "founder_story" | "founder_images" | "story_opt_out" | "story_post_id"
>;

export default function StoryEditor({ listing }: { listing: StoryListing }) {
  const [answers, setAnswers] = useState<Record<string, string>>(
    (listing.founder_story as Record<string, string>) ?? {}
  );
  const [optOut, setOptOut] = useState(listing.story_opt_out);
  const [existing, setExisting] = useState<string[]>(listing.founder_images ?? []);
  const [newPhotos, setNewPhotos] = useState<{ file: File; preview: string }[]>([]);
  const [photoError, setPhotoError] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  const totalPhotos = existing.length + newPhotos.length;

  const addPhotos = (files: FileList | null) => {
    if (!files) return;
    setPhotoError("");
    const next = [...newPhotos];
    for (const file of Array.from(files)) {
      if (existing.length + next.length >= MAX_STORY_PHOTOS) {
        setPhotoError(`Maximum ${MAX_STORY_PHOTOS} photos.`);
        break;
      }
      if (!file.type.startsWith("image/")) { setPhotoError("Only image files are accepted."); continue; }
      if (file.size > MAX_IMAGE_SIZE) { setPhotoError("Each photo must be under 4MB."); continue; }
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

  const save = async () => {
    setStatus("saving");
    setMessage("");
    try {
      const formData = new FormData();
      formData.set(
        "payload",
        JSON.stringify({
          slug: listing.slug,
          founder_story: answers,
          story_opt_out: optOut,
          existing_images: existing,
        })
      );
      newPhotos.forEach((p, i) => formData.set(`storyImage${i}`, p.file));

      const res = await fetch("/api/business/story", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok) {
        setStatus("saved");
        if (Array.isArray(data.founder_images)) {
          setExisting(data.founder_images);
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
    <div className="space-y-6">
      {listing.story_post_id && (
        <div className="bg-surface-card p-5">
          <p className="font-sans text-sm text-on-surface-variant">
            <span className="text-primary font-semibold uppercase text-label-sm mr-2">Published</span>
            Your spotlight is live in The Journal. Edits here update your answers on file but do
            not change the published piece — reply to any of our emails if you want it revised.
          </p>
        </div>
      )}

      <div className="bg-surface-low p-8 space-y-6">
        {/* Opt-out toggle */}
        <button
          type="button"
          onClick={() => setOptOut(v => !v)}
          className="flex items-center gap-3 text-left group"
        >
          <span
            className={`w-5 h-5 flex-shrink-0 flex items-center justify-center transition-colors duration-300 ${
              optOut ? "bg-primary text-primary-on" : "bg-surface-input"
            }`}
            aria-hidden
          >
            {optOut && <X size={13} />}
          </span>
          <span className="font-sans text-sm text-on-surface-variant group-hover:text-on-surface transition-colors">
            Prefer not to be featured? Check this and we simply list your space — no spotlight,
            no social feature.
          </span>
        </button>

        {!optOut && (
          <>
            {FOUNDER_QUESTIONS.map(q => (
              <div key={q.key}>
                <label className={labelClass}>{q.label}</label>
                <textarea
                  rows={3}
                  maxLength={STORY_ANSWER_MAX}
                  value={answers[q.key] ?? ""}
                  onChange={e => setAnswers(a => ({ ...a, [q.key]: e.target.value }))}
                  placeholder="In your own words..."
                  className={`${inputClass} resize-none`}
                />
                <p className="font-sans text-xs text-on-surface-variant/60 mt-1 text-right">
                  {(answers[q.key] ?? "").length}/{STORY_ANSWER_MAX}
                </p>
              </div>
            ))}

            <div>
              <p className="font-sans text-sm text-on-surface-variant mb-4">
                Up to {MAX_STORY_PHOTOS} photos of you and your space — a portrait works best
                as the first one. It leads your spotlight and the social feature.
              </p>
              <div className="grid grid-cols-3 gap-3">
                {existing.map((url, i) => (
                  <div key={url} className="relative aspect-[4/3] bg-surface-input overflow-hidden group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Spotlight photo ${i + 1}`} className="w-full h-full object-cover" />
                    {i === 0 && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 bg-primary text-primary-on font-sans text-label-sm uppercase">
                        Lead
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
                {totalPhotos < MAX_STORY_PHOTOS && (
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
                Answer at least 3 questions and keep at least 1 photo to qualify for the spotlight.
              </p>
            </div>
          </>
        )}
      </div>

      {status === "error" && (
        <p className="font-sans text-sm text-error bg-surface-low px-4 py-3">{message}</p>
      )}

      <button
        type="button"
        onClick={save}
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
          "Save Spotlight"
        )}
      </button>
    </div>
  );
}
