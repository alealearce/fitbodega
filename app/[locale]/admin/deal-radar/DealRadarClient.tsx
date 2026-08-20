"use client";

import { useMemo, useState } from "react";
import type { DrDealSubmission, DrOpportunity, DrRun, DrWeeklyDigest } from "@/lib/deal-radar/types";

// Draft review: include/skip toggles per opportunity, editable intro copy,
// brand deal submissions (approve puts them live on the /deals board), and
// the single Approve & Publish action. All copy is validated here by a
// human before anything sends.

interface Props {
  digest: DrWeeklyDigest;
  opportunities: DrOpportunity[];
  runs: DrRun[];
  activeSubscribers: number;
  submissions: DrDealSubmission[];
}

export default function DealRadarClient({ digest, opportunities, runs, activeSubscribers, submissions }: Props) {
  const [pendingSubs, setPendingSubs] = useState(submissions);
  const [items, setItems] = useState(opportunities);
  const [intro, setIntro] = useState(digest.intro_copy ?? "");
  const [introSaved, setIntroSaved] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [published, setPublished] = useState(digest.status === "published");

  const included = useMemo(() => items.filter((i) => i.status === "included"), [items]);
  const collabs = included.filter((i) => i.source_type === "listed_deal");
  const signals = included.filter((i) => i.source_type === "spend_signal");

  async function setStatus(id: string, status: "included" | "skipped" | "new") {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
    await fetch("/api/deal-radar/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "set_status", opportunityId: id, status }),
    });
  }

  async function saveIntro() {
    setBusy(true);
    const res = await fetch("/api/deal-radar/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "save_intro", digestId: digest.id, introCopy: intro }),
    });
    setBusy(false);
    setIntroSaved(res.ok);
    setMessage(res.ok ? "Intro saved." : "Intro save failed.");
  }

  async function approveAndPublish() {
    const confirmed = window.confirm(
      `Publish week ${digest.week_slug}?\n\n` +
      `- ${included.length} opportunities (${collabs.length} collabs, ${signals.length} spend signals)\n` +
      `- Email to ${activeSubscribers} active subscribers\n` +
      `- Post goes live at /deals/${digest.week_slug}\n\nThis cannot be undone.`
    );
    if (!confirmed) return;

    setBusy(true);
    setMessage("Publishing and sending...");
    const res = await fetch("/api/deal-radar/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ digestId: digest.id }),
    });
    const data = await res.json();
    setBusy(false);
    if (res.ok) {
      setPublished(true);
      setMessage(`Published. Sent ${data.sent}/${data.subscribers} emails${data.failed ? `, ${data.failed} failed (see dr_email_log)` : ""}. Post: ${data.postUrl}`);
    } else {
      setMessage(`Publish failed: ${data.error}`);
    }
  }

  const statusChip = (o: DrOpportunity) => {
    const base = "font-sans text-label-sm uppercase px-4 py-2.5";
    return (
      <div className="flex gap-2">
        <button
          onClick={() => setStatus(o.id, "included")}
          disabled={published}
          className={`${base} ${o.status === "included" ? "bg-primary text-primary-on" : "bg-surface-input text-on-surface hover:bg-surface-bright"}`}
        >
          Include
        </button>
        <button
          onClick={() => setStatus(o.id, "skipped")}
          disabled={published}
          className={`${base} ${o.status === "skipped" ? "bg-surface-bright text-error" : "bg-surface-input text-on-surface hover:bg-surface-bright"}`}
        >
          Skip
        </button>
      </div>
    );
  };

  const row = (o: DrOpportunity) => (
    <div key={o.id} className="bg-surface-card p-6 mb-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <p className="font-serif text-xl font-extrabold uppercase tracking-tight text-on-surface">
              {o.brand_name}
            </p>
            <span className="font-sans text-label-sm uppercase text-primary">{o.score}</span>
          </div>
          <p className="font-sans text-label-sm uppercase text-on-surface-variant mt-1">
            {o.source.replace("_", " ")} · {o.source_type === "listed_deal" ? "Open collab" : "Spend signal"}
            {o.active_ad_count ? ` · ${o.active_ad_count} active ads` : ""}
            {(o.meta?.evidence as string) ? ` · ${o.meta.evidence as string}` : ""}
          </p>
          {o.compensation_text && (
            <p className="font-sans text-sm text-primary mt-2">{o.compensation_text}</p>
          )}
          {o.deliverables && (
            <p className="font-sans text-sm text-on-surface-variant mt-1">{o.deliverables}</p>
          )}
          {(o.meta?.evidenceNote as string) && (
            <p className="font-sans text-sm text-on-surface-variant mt-1">{o.meta.evidenceNote as string}</p>
          )}
          {(o.meta?.pitchAngle as string) && (
            <p className="font-sans text-sm text-on-surface mt-1">Pitch: {o.meta.pitchAngle as string}</p>
          )}
          {o.source_url && (
            <a
              href={o.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-sans text-sm text-on-surface-variant hover:text-primary mt-2 inline-block break-all"
            >
              {o.source_url}
            </a>
          )}
        </div>
        {statusChip(o)}
      </div>
    </div>
  );

  const listed = items.filter((i) => i.source_type === "listed_deal");
  const spend = items.filter((i) => i.source_type === "spend_signal");

  async function reviewSubmission(id: string, decision: "approved" | "rejected") {
    setBusy(true);
    const res = await fetch("/api/deal-radar/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "review_submission", submissionId: id, decision }),
    });
    setBusy(false);
    if (res.ok) {
      setPendingSubs((prev) => prev.filter((s) => s.id !== id));
      setMessage(decision === "approved" ? "Approved — live on the /deals board now." : "Rejected.");
    } else {
      const data = await res.json().catch(() => ({}));
      setMessage(`Review failed: ${data.error ?? res.status}`);
    }
  }

  return (
    <div>
      {message && (
        <div className="bg-surface-input p-4 mb-8">
          <p className="font-sans text-sm text-on-surface">{message}</p>
        </div>
      )}

      {/* Brand deal submissions — approval puts them live immediately */}
      {pendingSubs.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-7 h-[3px] bg-primary" aria-hidden />
            <p className="font-sans text-label-md uppercase text-error">
              Brand submissions awaiting review ({pendingSubs.length})
            </p>
          </div>
          {pendingSubs.map((s) => (
            <div key={s.id} className="bg-surface-card p-6 mb-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-serif text-xl font-extrabold uppercase tracking-tight text-on-surface">
                    {s.brand_name}
                  </p>
                  <p className="font-sans text-label-sm uppercase text-on-surface-variant mt-1">
                    {s.offer_type} · {s.platforms.join(" · ") || "no platforms given"}
                  </p>
                  <p className="font-sans text-sm text-primary mt-2">{s.compensation_text}</p>
                  <p className="font-sans text-sm text-on-surface-variant mt-1">{s.deliverables}</p>
                  {s.notes && <p className="font-sans text-sm text-on-surface-variant mt-1">Notes: {s.notes}</p>}
                  <p className="font-sans text-sm text-on-surface-variant mt-2">
                    {s.contact_email}
                    {s.brand_website && (
                      <>
                        {" · "}
                        <a href={s.brand_website} target="_blank" rel="noopener noreferrer nofollow" className="hover:text-primary underline">
                          {s.brand_website}
                        </a>
                      </>
                    )}
                    {s.apply_url && (
                      <>
                        {" · "}
                        <a href={s.apply_url} target="_blank" rel="noopener noreferrer nofollow" className="hover:text-primary underline">
                          apply link
                        </a>
                      </>
                    )}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => reviewSubmission(s.id, "approved")}
                    disabled={busy}
                    className="font-sans text-label-sm uppercase px-4 py-2.5 bg-primary text-primary-on hover:opacity-90 disabled:opacity-40"
                  >
                    Approve — go live
                  </button>
                  <button
                    onClick={() => reviewSubmission(s.id, "rejected")}
                    disabled={busy}
                    className="font-sans text-label-sm uppercase px-4 py-2.5 bg-surface-input text-error hover:bg-surface-bright disabled:opacity-40"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Intro copy */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-7 h-[3px] bg-primary" aria-hidden />
          <p className="font-sans text-label-md uppercase text-primary">Intro copy — yours to edit</p>
        </div>
        <textarea
          value={intro}
          onChange={(e) => { setIntro(e.target.value); setIntroSaved(false); }}
          disabled={published}
          rows={4}
          className="w-full bg-surface-input text-on-surface font-sans text-sm p-4 focus:outline-none focus:shadow-[inset_0_0_0_1px_rgba(209,252,0,0.4)]"
        />
        <button
          onClick={saveIntro}
          disabled={busy || introSaved || published}
          className="mt-3 px-8 py-4 bg-surface-input text-on-surface font-sans text-sm font-bold tracking-wide uppercase hover:bg-surface-bright disabled:opacity-40"
        >
          {introSaved ? "Saved" : "Save intro"}
        </button>
      </div>

      {/* Open collabs */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-7 h-[3px] bg-primary" aria-hidden />
          <p className="font-sans text-label-md uppercase text-primary">
            Open collabs ({listed.filter((i) => i.status === "included").length}/{listed.length} included)
          </p>
        </div>
        {listed.map(row)}
      </div>

      {/* Spend signals */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-7 h-[3px] bg-primary" aria-hidden />
          <p className="font-sans text-label-md uppercase text-primary">
            Spending now ({spend.filter((i) => i.status === "included").length}/{spend.length} included)
          </p>
        </div>
        {spend.map(row)}
      </div>

      {/* Publish */}
      <div className="bg-surface-card p-8 mb-12">
        <p className="font-sans text-sm text-on-surface-variant mb-6">
          Approve &amp; Publish sends the email to {activeSubscribers} active subscribers and
          makes the post live at /deals/{digest.week_slug}. Preview the post first — it renders
          exactly what is marked Include, with your intro.
        </p>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={approveAndPublish}
            disabled={busy || published || included.length === 0 || !intro.trim()}
            className="px-8 py-4 bg-primary text-primary-on font-sans text-sm font-bold tracking-wide uppercase hover:opacity-90 disabled:opacity-40"
          >
            {published ? "Published" : `Approve & Publish (${included.length})`}
          </button>
          <a
            href={`/deals/${digest.week_slug}?preview=1`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-4 font-sans text-sm font-bold tracking-wide uppercase text-on-surface hover:text-primary"
            style={{ boxShadow: "inset 0 0 0 1px rgba(72,72,71,0.3)" }}
          >
            Preview post
          </a>
        </div>
      </div>

      {/* Run log */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <span className="w-7 h-[3px] bg-primary" aria-hidden />
          <p className="font-sans text-label-md uppercase text-primary">Last collection runs</p>
        </div>
        {runs.map((r) => (
          <p key={r.id} className="font-sans text-sm text-on-surface-variant mb-2">
            {r.source} — {r.items_found} items — {r.ok ? "ok" : `failed: ${r.errors.join(", ")}`}
            {r.duration_ms ? ` — ${(r.duration_ms / 1000).toFixed(1)}s` : ""}
          </p>
        ))}
      </div>
    </div>
  );
}
