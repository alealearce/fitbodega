/**
 * YFNIcon — compatibility shim (historical name from the yoga-directory
 * template: "Yoga Founders Network"). FitBodega renders it as a sharp
 * "FB" monogram square — white on #1a1a1a with a lime accent bar — instead
 * of a single soft letter badge. Prop signature is unchanged so existing
 * call sites keep working.
 *
 * Usage:
 *   <YFNIcon letter="S" />               // default md / soft
 *   <YFNIcon letter="T" size="lg" variant="solid" />
 */

import { cn } from "@/lib/utils/cn";

type Size    = "xs" | "sm" | "md" | "lg" | "xl";
type Variant = "solid" | "soft" | "ghost";

interface YFNIconProps {
  letter:    string;
  size?:     Size;
  variant?:  Variant;
  className?: string;
}

const SIZE_CLASSES: Record<Size, string> = {
  xs: "w-7 h-7 text-xs",
  sm: "w-9 h-9 text-sm",
  md: "w-12 h-12 text-base",
  lg: "w-16 h-16 text-xl",
  xl: "w-20 h-20 text-2xl",
};

const VARIANT_CLASSES: Record<Variant, string> = {
  solid: "bg-primary text-primary-on",
  soft:  "bg-[#1a1a1a] text-on-surface",
  ghost: "bg-surface-low text-on-surface-variant",
};

export default function YFNIcon({
  letter,
  size    = "md",
  variant = "soft",
  className,
}: YFNIconProps) {
  return (
    <span
      className={cn(
        "relative inline-flex items-center justify-center flex-shrink-0",
        "font-sans font-extrabold uppercase leading-none select-none",
        SIZE_CLASSES[size],
        VARIANT_CLASSES[variant],
        className,
      )}
      aria-hidden="true"
    >
      {variant !== "solid" && (
        <span
          className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary"
          aria-hidden="true"
        />
      )}
      {letter.charAt(0).toUpperCase()}
    </span>
  );
}
