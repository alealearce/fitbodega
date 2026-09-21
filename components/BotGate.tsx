"use client";

import { useEffect, useState } from "react";

/**
 * Client side of the bot gate (server side and the why: lib/botGate.ts).
 *
 *   const gate = useBotGate();
 *   <form> {gate.field} ... </form>
 *   body: JSON.stringify({ email, ...gate.payload() })
 *
 * `field` is a honeypot: off screen, out of the tab order and hidden from
 * screen readers, so only a bot fills it. The token is fetched when the form
 * mounts, which is what lets the server see how long the form was open.
 */
export function useBotGate() {
  const [token, setToken] = useState("");
  const [company, setCompany] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/bot-gate")
      .then((r) => r.json())
      .then((j) => { if (!cancelled) setToken(j.token ?? ""); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const field = (
    <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", width: 1, height: 1, overflow: "hidden" }}>
      <label>
        Company
        <input type="text" name="company" tabIndex={-1} autoComplete="off" value={company} onChange={(e) => setCompany(e.target.value)} />
      </label>
    </div>
  );

  return { field, payload: () => ({ gate_token: token, company }) };
}
