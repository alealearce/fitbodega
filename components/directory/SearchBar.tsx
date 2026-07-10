"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { LISTING_TYPES } from "@/lib/config/site";

const FILTER_CHIPS = [
  { label: "All", value: "" },
  ...LISTING_TYPES.map(t => ({ label: t.label, value: t.id as string })),
];

interface SearchBarProps {
  initialQuery?:    string;
  initialType?:     string;
  onSearch?:        (query: string, type: string) => void;
  placeholder?:     string;
  showFilters?:     boolean;
  compact?:         boolean;
}

export default function SearchBar({
  initialQuery  = "",
  initialType   = "",
  onSearch,
  placeholder   = "Search recovery, gyms, coaches...",
  showFilters   = true,
  compact       = false,
}: SearchBarProps) {
  const router   = useRouter();
  const [query,  setQuery]  = useState(initialQuery);
  const [type,   setType]   = useState(initialType);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (onSearch) {
        onSearch(query, type);
        return;
      }
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (type)  params.set("type", type);
      router.push(`/search?${params.toString()}`);
    },
    [query, type, onSearch, router]
  );

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit}>
        <div className={cn(
          "flex items-center gap-3 bg-surface-input",
          "focus-within:shadow-[inset_0_0_0_1px_rgba(209,252,0,0.4)]",
          compact ? "px-4 py-2" : "px-6 py-4"
        )}>
          <Search
            size={compact ? 16 : 20}
            className="text-on-surface-variant flex-shrink-0"
          />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={placeholder}
            className={cn(
              "flex-1 min-w-0 bg-transparent font-sans text-on-surface outline-none",
              "placeholder:text-on-surface-variant/50",
              compact ? "text-sm" : "text-base"
            )}
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                if (onSearch) onSearch("", type);
                else {
                  const params = new URLSearchParams();
                  if (type) params.set("type", type);
                  router.push(params.toString() ? `/search?${params.toString()}` : "/search");
                }
              }}
              aria-label="Clear search"
              className="flex-shrink-0 p-1 text-on-surface-variant hover:text-on-surface hover:bg-surface-bright transition-colors"
            >
              <X size={compact ? 14 : 16} />
            </button>
          )}
          <button
            type="submit"
            className={cn(
              "flex-shrink-0 bg-primary text-primary-on font-sans font-bold tracking-wide uppercase",
              "transition-opacity duration-400 hover:opacity-90",
              compact ? "px-4 py-1.5 text-xs" : "px-6 py-2.5 text-sm"
            )}
          >
            Search
          </button>
        </div>
      </form>

      {showFilters && (
        <div className="flex flex-wrap gap-2 mt-4">
          {FILTER_CHIPS.map(chip => (
            <button
              key={chip.value}
              type="button"
              onClick={() => setType(chip.value)}
              className={cn(
                "px-4 py-2.5 font-sans text-label-sm uppercase",
                "transition-colors duration-300",
                type === chip.value
                  ? "bg-primary text-primary-on"
                  : "bg-surface-input text-on-surface-variant hover:bg-surface-bright hover:text-on-surface"
              )}
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
