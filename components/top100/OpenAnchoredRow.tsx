"use client";

import { useEffect } from "react";

// When the page loads with a #rank-N hash (claim-search hits link here),
// expand that ledger row and scroll to it — the native anchor jump happens
// before hydration, so re-scroll after opening changes the layout.
export default function OpenAnchoredRow() {
  useEffect(() => {
    const m = window.location.hash.match(/^#rank-\d+$/);
    if (!m) return;
    const el = document.getElementById(m[0].slice(1));
    if (!el) return;
    if (el instanceof HTMLDetailsElement) el.open = true;
    el.scrollIntoView({ block: "start" });
  }, []);
  return null;
}
