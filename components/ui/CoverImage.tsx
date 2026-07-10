"use client";

import { useState } from "react";

interface CoverImageProps {
  src: string;
  alt: string;
  className?: string;
  /** Set on above-the-fold/LCP images (e.g. a detail-page hero) to load
      eagerly. Defaults to false so off-screen card images lazy-load. */
  priority?: boolean;
}

// Plain <img> (not next/image) so local demo paths like "/demo/zenith-lab.svg"
// and arbitrary remote URLs both render without a configured loader.
export default function CoverImage({ src, alt, className = "w-full h-full object-cover", priority = false }: CoverImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    // Typography-first fallback — bold first-letter monogram, no silhouette art.
    return (
      <div className="w-full h-full flex items-center justify-center bg-surface-low">
        <span className="font-serif text-6xl font-extrabold text-surface-bright select-none">
          {alt?.charAt(0)?.toUpperCase() || "F"}
        </span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
