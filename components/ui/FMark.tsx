/**
 * FMark — the FitBodega blocky "F" logo mark as an inline SVG.
 * Geometry is lifted 1:1 from public/images/favicon.png (three rects in
 * 512-space), so this IS the favicon F, color driven by currentColor.
 * Use text-primary for the lime mark; size via h- and w- classes.
 */
export default function FMark({ className = "inline-block h-12 w-10" }: { className?: string }) {
  return (
    <svg
      viewBox="140 96 256 320"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <rect x="140" y="96" width="256" height="80" />
      <rect x="140" y="252" width="216" height="70" />
      <rect x="140" y="96" width="86" height="320" />
    </svg>
  );
}
