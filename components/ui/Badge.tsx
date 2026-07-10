import { cn } from "@/lib/utils/cn";

type Variant =
  | "verified"
  | "featured"
  | "pending"
  | "approved"
  | "rejected"
  | "free"
  | "pro";

interface BadgeProps {
  variant?: Variant;
  children: React.ReactNode;
  className?: string;
}

// Rectangular, uppercase, tonal — no rounded pills, no light-mode colors.
const variantClasses: Record<Variant, string> = {
  verified:  "bg-primary/10 text-primary",
  featured:  "bg-primary text-primary-on",
  pending:   "bg-surface-input text-on-surface-variant",
  approved:  "bg-primary/10 text-primary",
  rejected:  "bg-error/10 text-error",
  free:      "bg-surface-input text-on-surface-variant",
  pro:       "bg-primary text-primary-on",
};

export default function Badge({ variant = "pending", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 font-sans text-label-sm uppercase",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
