"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

// Name search over every ranked entry (all Top 100 lists + the Vancouver 50).
// A hit links straight into that entry's claim flow.
type Item = { n: string; l: string; r: number };
type ListMeta = { title: string; page: string };

export default function ClaimSearch({
  items,
  lists,
}: {
  items: Item[];
  lists: Record<string, ListMeta>;
}) {
  const [q, setQ] = useState("");

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (s.length < 2) return [];
    return items.filter((i) => i.n.toLowerCase().includes(s)).slice(0, 8);
  }, [q, items]);

  const searched = q.trim().length >= 2;

  return (
    <div className="mb-12">
      <div className="relative">
        <Search
          size={16}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
          aria-hidden
        />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search your name…"
          aria-label="Search your name across all lists"
          className="w-full bg-surface-input text-on-surface font-sans text-sm pl-11 pr-4 py-4 placeholder:text-on-surface-variant focus:outline-none focus:shadow-[inset_0_0_0_1px_rgba(209,252,0,0.4)]"
        />
      </div>

      {searched && results.length > 0 && (
        <div className="mt-3 space-y-1">
          {results.map((i) => (
            <Link
              key={`${i.l}-${i.r}`}
              href={`/top-100/claim?list=${i.l}&rank=${i.r}`}
              className="flex items-baseline justify-between gap-4 bg-surface-card hover:bg-surface-input transition-colors px-5 py-4"
            >
              <span className="font-sans text-sm font-bold text-on-surface">{i.n}</span>
              <span className="font-sans text-label-sm uppercase text-on-surface-variant text-right">
                No. {i.r} · {lists[i.l]?.title}
              </span>
            </Link>
          ))}
        </div>
      )}

      {searched && results.length === 0 && (
        <p className="font-sans text-sm text-on-surface-variant mt-3">
          No ranked entry matches that name.{" "}
          <Link
            href="/measure-up"
            className="text-primary font-bold underline underline-offset-4"
          >
            Compare your business with the Top 100
          </Link>{" "}
          instead.
        </p>
      )}
    </div>
  );
}
