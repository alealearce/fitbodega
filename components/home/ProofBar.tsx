import { PROOF_BAR } from "@/lib/config/site";

// Homepage numbers. Ships disabled and renders nothing until PROOF_BAR.enabled
// is true AND every stat carries a real value — a proof bar with invented or
// placeholder figures is worse than no proof bar.
export default function ProofBar() {
  if (!PROOF_BAR.enabled) return null;
  const stats = PROOF_BAR.stats.filter((s) => s.value.trim());
  if (stats.length === 0) return null;

  return (
    <section className="bg-surface-low">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 lg:py-16 grid grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((s) => (
          <div key={s.key}>
            <p className="font-serif text-4xl lg:text-5xl font-extrabold tabular-nums text-on-surface">
              {s.value}
            </p>
            <p className="font-sans text-label-sm uppercase text-on-surface-variant mt-2">
              {s.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
