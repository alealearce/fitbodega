"use client";

import { useState } from "react";
import { Star } from "lucide-react";

interface ReviewFormProps {
  listingId: string;
  listingName: string;
}

export default function ReviewForm({ listingId, listingName }: ReviewFormProps) {
  const [rating,    setRating]    = useState(0);
  const [hovered,   setHovered]   = useState(0);
  const [name,      setName]      = useState("");
  const [body,      setBody]      = useState("");
  const [status,    setStatus]    = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message,   setMessage]   = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) { setStatus("error"); setMessage("Select a star rating."); return; }
    setStatus("loading");
    try {
      const res = await fetch("/api/reviews", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ listing_id: listingId, user_name: name, rating, body }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("success");
        setMessage(data.message);
        setRating(0); setName(""); setBody("");
      } else {
        setStatus("error");
        setMessage(data.error ?? "Something went wrong.");
      }
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Try again.");
    }
  };

  return (
    <div className="bg-surface-card p-8" style={{ boxShadow: "inset 0 0 0 1px rgba(72,72,71,0.3)" }}>
      {/* CTA header */}
      <div className="flex items-center gap-3 mb-4">
        <span className="w-7 h-[3px] bg-primary" aria-hidden />
        <p className="font-sans text-label-md uppercase text-primary">Leave a Review</p>
      </div>
      <div className="mb-6">
        <h2 className="font-serif text-display-sm font-extrabold uppercase tracking-tight text-on-surface mb-1">
          Do you know {listingName}?
        </h2>
        <p className="font-sans text-sm text-on-surface-variant">
          Your review helps others in the network find the right space.
        </p>
      </div>

      {status === "success" ? (
        <div className="py-6 text-center">
          <p className="font-serif text-display-sm font-extrabold uppercase tracking-tight text-on-surface mb-1">Thank you.</p>
          <p className="font-sans text-sm text-on-surface-variant">{message}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Star rating */}
          <div>
            <label className="block font-sans text-label-sm uppercase text-on-surface mb-3">
              Your Rating <span className="text-primary">*</span>
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  className="p-0.5"
                >
                  <Star
                    size={28}
                    className={
                      star <= (hovered || rating)
                        ? "text-primary fill-primary"
                        : "text-outline-variant"
                    }
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 self-center font-sans text-sm text-on-surface-variant">
                  {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][rating]}
                </span>
              )}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block font-sans text-label-sm uppercase text-on-surface mb-2">
              Your Name <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Jane D."
              className="w-full px-4 py-3 bg-surface-input font-sans text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:shadow-[inset_0_0_0_1px_rgba(209,252,0,0.4)] transition-all"
            />
          </div>

          {/* Review body */}
          <div>
            <label className="block font-sans text-label-sm uppercase text-on-surface mb-2">
              Your Review <span className="text-primary">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="What did you experience? What would you tell someone training seriously?"
              className="w-full px-4 py-3 bg-surface-input font-sans text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:shadow-[inset_0_0_0_1px_rgba(209,252,0,0.4)] transition-all resize-none"
            />
          </div>

          {status === "error" && (
            <p className="font-sans text-sm text-error">{message}</p>
          )}

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full py-4 bg-primary text-primary-on font-sans text-sm font-bold tracking-wide uppercase transition-opacity duration-300 hover:opacity-90 disabled:opacity-50"
          >
            {status === "loading" ? "Submitting…" : "Submit Review"}
          </button>

          <p className="font-sans text-xs text-on-surface-variant/60 text-center">
            Reviews are moderated before appearing publicly.
          </p>
        </form>
      )}
    </div>
  );
}
