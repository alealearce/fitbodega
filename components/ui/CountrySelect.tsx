"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Check, Search } from "lucide-react";
import { COUNTRIES, POPULAR_COUNTRIES } from "@/lib/config/countries";

interface CountrySelectProps {
  value: string;
  onChange: (countryName: string) => void;
  placeholder?: string;
  required?: boolean;
}

/**
 * Searchable country combobox for the global directory.
 * Type-ahead filter over the full ISO country list, with popular
 * training destinations surfaced first when no search is active.
 */
export default function CountrySelect({
  value,
  onChange,
  placeholder = "Select a country…",
  required = false,
}: CountrySelectProps) {
  const [open, setOpen]   = useState(false);
  const [query, setQuery] = useState("");
  const rootRef  = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = COUNTRIES.find((c) => c.name === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      const popular = POPULAR_COUNTRIES
        .map((name) => COUNTRIES.find((c) => c.name === name))
        .filter(Boolean) as typeof COUNTRIES;
      const popularSet = new Set(popular.map((c) => c.code));
      const rest = COUNTRIES.filter((c) => !popularSet.has(c.code));
      return [...popular, ...rest];
    }
    return COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase() === q
    );
  }, [query]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  // Focus the search box when the menu opens
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const pick = (name: string) => {
    onChange(name);
    setOpen(false);
    setQuery("");
  };

  return (
    <div ref={rootRef} className="relative">
      {/* Hidden input keeps native form-validation working with required */}
      {required && (
        <input
          tabIndex={-1}
          aria-hidden
          required
          value={value}
          onChange={() => {}}
          className="absolute opacity-0 w-0 h-0 pointer-events-none"
        />
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-surface-input font-sans text-sm text-on-surface outline-none focus:shadow-[inset_0_0_0_1px_rgba(209,252,0,0.4)] transition-all"
      >
        <span className={selected ? "text-on-surface" : "text-on-surface-variant/50"}>
          {selected ? `${selected.flag}  ${selected.name}` : placeholder}
        </span>
        <ChevronDown size={16} className="text-on-surface-variant/60 shrink-0" />
      </button>

      {open && (
        <div
          className="absolute z-30 mt-1 w-full bg-surface-card overflow-hidden"
          style={{ boxShadow: "inset 0 0 0 1px rgba(72,72,71,0.3)" }}
        >
          <div
            className="flex items-center gap-2 px-3 py-2"
            style={{ boxShadow: "inset 0 -1px 0 0 rgba(72,72,71,0.3)" }}
          >
            <Search size={15} className="text-on-surface-variant/50 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search countries…"
              className="w-full bg-transparent font-sans text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none"
            />
          </div>
          <ul className="max-h-64 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <li className="px-4 py-3 font-sans text-sm text-on-surface-variant/60">
                No matches
              </li>
            )}
            {filtered.map((c) => (
              <li key={c.code}>
                <button
                  type="button"
                  onClick={() => pick(c.name)}
                  className={`w-full flex items-center justify-between gap-2 px-4 py-2 text-left font-sans text-sm transition-colors hover:bg-surface-input ${
                    c.name === value ? "text-primary font-semibold" : "text-on-surface"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span className="text-base leading-none">{c.flag}</span>
                    {c.name}
                  </span>
                  {c.name === value && <Check size={15} className="text-primary shrink-0" />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
