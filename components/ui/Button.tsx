import Link from "next/link";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "secondary" | "ghost";
type Size    = "sm" | "md" | "lg";

interface ButtonProps {
  variant?:   Variant;
  size?:      Size;
  href?:      string;
  onClick?:   () => void;
  disabled?:  boolean;
  loading?:   boolean;
  className?: string;
  children:   React.ReactNode;
  type?:      "button" | "submit" | "reset";
  target?:    string;
  rel?:       string;
}

// "The Brutalist Sanctuary" — sharp rectangles (radius scale is zeroed
// globally), uppercase labels, no shadows. Hover = opacity / tonal shift only.
const variantClasses: Record<Variant, string> = {
  primary:   "bg-primary text-primary-on hover:opacity-90 disabled:opacity-50",
  secondary: "bg-transparent text-on-surface hover:bg-surface-low disabled:opacity-50",
  ghost:     "bg-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-low disabled:opacity-50",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-4 py-2 text-xs",
  md: "px-6 py-3 text-sm",
  lg: "px-8 py-4 text-sm",
};

export default function Button({
  variant = "primary",
  size = "md",
  href,
  onClick,
  disabled,
  loading,
  className,
  children,
  type = "button",
  target,
  rel,
}: ButtonProps) {
  const base = cn(
    "inline-flex items-center justify-center gap-2 font-sans font-bold tracking-wide uppercase",
    "transition-all duration-400 cursor-pointer select-none",
    variantClasses[variant],
    sizeClasses[size],
    (disabled || loading) && "pointer-events-none",
    className
  );

  // Secondary uses a ghost inset-shadow border instead of a real border.
  const inlineStyle =
    variant === "secondary"
      ? { boxShadow: "inset 0 0 0 1px rgba(72,72,71,0.3)" }
      : undefined;

  const content = loading ? (
    <>
      <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent animate-spin" />
      {children}
    </>
  ) : (
    children
  );

  if (href) {
    return (
      <Link href={href} className={base} style={inlineStyle} target={target} rel={rel}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={base}
      style={inlineStyle}
    >
      {content}
    </button>
  );
}
