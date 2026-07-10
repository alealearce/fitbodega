"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { NEWSLETTER } from "@/lib/config/site";

interface Props {
  variant?: "footer" | "inline" | "hero" | "compact";
}

export default function NewsletterSignup({ variant = "inline" }: Props) {
  const [email,     setEmail]     = useState("");
  const [status,    setStatus]    = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message,   setMessage]   = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("success");
        setMessage(data.message ?? "Confirmed. Check your inbox to finish signing up.");
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.error ?? "Something went wrong. Try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Try again.");
    }
  };

  if (status === "success") {
    return (
      <div className={cn(
        "p-4 text-center",
        variant === "footer" ? "bg-white/10" : "bg-surface-input"
      )}>
        <p className="font-sans text-sm font-medium text-primary">
          {message}
        </p>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <form onSubmit={handleSubmit} className="flex items-center bg-surface-input">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder={NEWSLETTER.placeholder}
          required
          className="flex-1 min-w-0 px-4 py-2.5 font-sans text-xs text-on-surface placeholder:text-on-surface-variant/50 outline-none bg-transparent focus:shadow-[inset_0_0_0_1px_rgba(209,252,0,0.4)]"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="flex-shrink-0 px-4 py-2.5 bg-primary text-primary-on font-sans text-label-sm uppercase font-bold transition-opacity duration-300 hover:opacity-90 disabled:opacity-60"
        >
          {status === "loading" ? "..." : NEWSLETTER.cta}
        </button>
      </form>
    );
  }

  return (
    <div>
      <p className="font-sans text-label-sm uppercase text-on-surface-variant mb-2">
        {NEWSLETTER.title}
      </p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder={NEWSLETTER.placeholder}
          required
          className={cn(
            "flex-1 px-4 py-3 font-sans text-sm outline-none transition-all duration-300",
            "placeholder:text-on-surface-variant/50",
            variant === "footer"
              ? "bg-white/10 text-white placeholder:text-white/50 focus:bg-white/15"
              : "bg-surface-input text-on-surface focus:shadow-[inset_0_0_0_1px_rgba(209,252,0,0.4)]"
          )}
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="flex items-center gap-2 px-5 py-3 bg-primary text-primary-on font-sans text-label-sm uppercase font-bold transition-opacity duration-300 hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Send size={14} />
          {status === "loading" ? "..." : NEWSLETTER.cta}
        </button>
      </form>
      {status === "error" && (
        <p className="font-sans text-xs text-error mt-2">{message}</p>
      )}
    </div>
  );
}
