"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

// Journal search box — submits ?q= back to /community, keeping the active
// category filter. Ghost-border input per the design spec (no real borders).

export default function JournalSearch({ initialQuery = "" }: { initialQuery?: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(initialQuery);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next = new URLSearchParams();
    if (q.trim()) next.set("q", q.trim());
    const category = params.get("category");
    if (category) next.set("category", category);
    router.push(`/community${next.toString() ? `?${next.toString()}` : ""}`);
  }

  function clear() {
    setQ("");
    const category = params.get("category");
    router.push(`/community${category ? `?category=${category}` : ""}`);
  }

  return (
    <form onSubmit={submit} className="flex w-full max-w-xl">
      <div className="relative flex-1">
        <Search
          size={16}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
          aria-hidden
        />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search the Journal..."
          aria-label="Search the Journal"
          className="w-full bg-surface-input pl-11 pr-10 py-3.5 font-sans text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:shadow-[inset_0_0_0_1px_rgba(209,252,0,0.4)] transition-all [&::-webkit-search-cancel-button]:hidden"
        />
        {q && (
          <button
            type="button"
            onClick={clear}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>
      <button
        type="submit"
        className="px-6 bg-primary text-primary-on font-sans text-label-sm uppercase font-bold hover:opacity-90 transition-opacity"
      >
        Search
      </button>
    </form>
  );
}
