"use client";

import { useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import { countryFlag } from "@/lib/config/countries";

interface SearchCountryFilterProps {
  countries: string[];
  current: string;
  query: string;
  type: string;
}

/** Country dropdown for the search page — navigates with the country param
 *  while preserving the active query and type. */
export default function SearchCountryFilter({
  countries,
  current,
  query,
  type,
}: SearchCountryFilterProps) {
  const router = useRouter();

  const onChange = (country: string) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (type) params.set("type", type);
    if (country) params.set("country", country);
    const qs = params.toString();
    router.push(qs ? `/search?${qs}` : "/search");
  };

  if (countries.length === 0) return null;

  return (
    <div className="relative inline-flex items-center">
      <Globe size={13} className="absolute left-3 text-on-surface-variant/60 pointer-events-none" />
      <select
        value={current}
        onChange={(e) => onChange(e.target.value)}
        className={`appearance-none pl-8 pr-8 py-2.5 font-sans text-label-sm uppercase cursor-pointer outline-none transition-colors duration-300 ${
          current
            ? "bg-primary text-primary-on"
            : "bg-surface-input text-on-surface-variant hover:bg-surface-bright"
        }`}
      >
        <option value="">All countries</option>
        {countries.map((c) => (
          <option key={c} value={c}>
            {countryFlag(c)} {c}
          </option>
        ))}
      </select>
    </div>
  );
}
