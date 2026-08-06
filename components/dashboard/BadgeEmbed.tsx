"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

// Copy-paste embed block for a Top 100 ranking badge.
export default function BadgeEmbed({ embedCode }: { embedCode: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Selection fallback: the textarea below stays selectable.
    }
  };

  return (
    <div>
      <textarea
        readOnly
        rows={3}
        value={embedCode}
        onFocus={(e) => e.currentTarget.select()}
        className="w-full px-3 py-2.5 bg-surface-input font-mono text-xs text-on-surface-variant outline-none resize-none"
      />
      <button
        onClick={copy}
        className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-surface-input font-sans text-xs font-bold uppercase tracking-wide text-on-surface hover:bg-surface-bright transition-colors"
      >
        {copied ? <Check size={13} className="text-primary" /> : <Copy size={13} />}
        {copied ? "Copied" : "Copy embed code"}
      </button>
    </div>
  );
}
