"use client";

import { useState } from "react";

// Deal Radar subscribe form. Double opt-in: submitting sends a confirmation
// email; the address only goes active after the link is clicked. Drop this
// component onto any page.

export default function DealRadarSubscribeForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setState("busy");
    try {
      const res = await fetch("/api/deal-radar/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <p className="font-sans text-sm text-on-surface">
        Check your inbox — click the confirmation link and you are in.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col sm:flex-row gap-3">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        className="flex-1 bg-surface-input text-on-surface font-sans text-sm px-4 py-4 focus:outline-none focus:shadow-[inset_0_0_0_1px_rgba(209,252,0,0.4)]"
      />
      <button
        type="submit"
        disabled={state === "busy"}
        className="px-8 py-4 bg-primary text-primary-on font-sans text-sm font-bold tracking-wide uppercase hover:opacity-90 disabled:opacity-40"
      >
        {state === "busy" ? "Sending" : "Get Deal Radar"}
      </button>
      {state === "error" && (
        <p className="font-sans text-sm text-error self-center">Try again in a moment.</p>
      )}
    </form>
  );
}
