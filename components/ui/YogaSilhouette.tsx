/**
 * YogaSilhouette — compatibility shim.
 *
 * Historical name from the yoga-directory template. FitBodega has no use
 * for pose illustrations, but many call sites still import this component
 * with the original prop signature (pose, size, color). Rather than touch
 * every call site, this renders a neutral abstract mark — three staggered
 * rectangles — in place of the old pose silhouettes. The `pose` prop is
 * accepted for compatibility but does not affect the rendered mark.
 */

type Pose = "seated" | "tree" | "warrior" | "lotus" | "child" | "mountain";

interface YogaSilhouetteProps {
  pose?:      Pose;
  size?:      number;   // px, applied to width & height
  color?:     string;   // CSS color value
  className?: string;
}

export default function YogaSilhouette({
  size      = 64,
  color     = "#d1fc00",
  className = "",
}: YogaSilhouetteProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <g fill={color}>
        <rect x="8"  y="30" width="14" height="26" />
        <rect x="25" y="18" width="14" height="38" />
        <rect x="42" y="8"  width="14" height="48" />
      </g>
    </svg>
  );
}
