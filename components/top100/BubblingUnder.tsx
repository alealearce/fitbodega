// Bubbling Under names, shared by all nine list pages. Each name links out —
// website first, then Instagram, then any other handle — so the section is
// browsable like the ledger above it.

export type BubblingEntry = {
  name: string;
  score: number;
  website?: string | null;
  handles?: Record<string, string>;
};

function linkFor(e: BubblingEntry): string | null {
  if (e.website) return e.website;
  const handles = e.handles ?? {};
  const href = handles.instagram ?? Object.values(handles).find((v) => v.startsWith("http"));
  return href ?? null;
}

export default function BubblingUnder({ entries }: { entries: BubblingEntry[] }) {
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-3">
      {entries.map((b) => {
        const href = linkFor(b);
        return (
          <span key={b.name} className="font-sans text-sm">
            {href ? (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="text-on-surface font-medium underline decoration-on-surface-variant/40 underline-offset-4 hover:text-primary hover:decoration-primary transition-colors"
              >
                {b.name}
              </a>
            ) : (
              <span className="text-on-surface font-medium">{b.name}</span>
            )}{" "}
            <span className="text-on-surface-variant tabular-nums">{b.score}</span>
          </span>
        );
      })}
    </div>
  );
}
