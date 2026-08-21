"use client";

import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import CreatorProfileForm, { emptyProfile } from "@/components/creators/CreatorProfileForm";

// The site's primary conversion, in two steps.
//
// Step 1 — email (plus first name at most). Submitting subscribes to the
// weekly Deal Radar and is a complete action on its own: the email arrives
// whether or not a profile follows.
// Step 2 — the profile push, straight after, because a profile is what makes
// a creator visible to brands and eligible for the FitBodega 100.

export default function JoinTheRadar({
  variant = "full",
  id,
}: {
  variant?: "full" | "compact";
  id?: string;
}) {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "error">("idle");
  const [step, setStep] = useState<1 | 2>(1);
  const [skipped, setSkipped] = useState(false);

  const inputClass =
    "w-full bg-surface-input px-4 py-4 font-sans text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:shadow-[inset_0_0_0_1px_rgba(209,252,0,0.4)] transition-all";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setState("busy");
    try {
      const res = await fetch("/api/deal-radar/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, first_name: firstName }),
      });
      if (!res.ok) {
        setState("error");
        return;
      }
      setState("idle");
      setStep(2);
    } catch {
      setState("error");
    }
  }

  if (step === 2) {
    return (
      <div id={id} className="scroll-mt-24">
        <div className="bg-primary p-6 lg:p-8 mb-3">
          <p className="font-sans text-label-sm uppercase text-primary-on/70 mb-2">
            Step 1 of 2 — done
          </p>
          <p className="font-sans text-base text-primary-on leading-relaxed max-w-2xl">
            Check your inbox and click the confirmation link — that locks in the weekly Deal
            Radar. Nothing below is required to receive it.
          </p>
        </div>

        {skipped ? (
          <div className="bg-surface-card p-6 lg:p-8">
            <p className="font-sans text-base text-on-surface-variant leading-relaxed max-w-2xl">
              The email is set. When you want brands to be able to find you, come back and
              complete a profile — that is what puts you in the network browse and in front of
              the FitBodega 100 shortlist.
            </p>
            <button
              type="button"
              onClick={() => setSkipped(false)}
              className="inline-flex items-center gap-2 mt-6 px-8 py-4 bg-primary text-primary-on font-sans text-sm font-bold tracking-wide uppercase hover:opacity-90 transition-opacity"
            >
              Complete my profile
              <ArrowUpRight size={16} />
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="font-sans text-label-sm uppercase text-primary mb-3">Step 2 of 2</p>
              <h3 className="font-serif text-2xl lg:text-3xl font-extrabold uppercase tracking-tight text-on-surface">
                Now the part brands see
              </h3>
              <p className="font-sans text-sm text-on-surface-variant mt-3 max-w-2xl">
                A completed profile is what makes you visible to brands browsing the network,
                and what puts you in the running for the FitBodega 100. Under three minutes.
              </p>
            </div>
            <CreatorProfileForm initial={emptyProfile(email, firstName)} />
            <button
              type="button"
              onClick={() => setSkipped(true)}
              className="mt-5 font-sans text-label-sm uppercase text-on-surface-variant hover:text-on-surface transition-colors"
            >
              I&apos;ll do this later
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div id={id} className="scroll-mt-24">
      <form
        onSubmit={submit}
        className={variant === "compact" ? "flex flex-col sm:flex-row gap-3" : "space-y-3"}
      >
        <input
          type="text"
          maxLength={60}
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="First name (optional)"
          className={variant === "compact" ? `${inputClass} sm:max-w-[12rem]` : inputClass}
        />
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className={inputClass}
        />
        <button
          type="submit"
          disabled={state === "busy"}
          className="px-8 py-4 bg-primary text-primary-on font-sans text-sm font-bold tracking-wide uppercase hover:opacity-90 transition-opacity disabled:opacity-50 whitespace-nowrap"
        >
          {state === "busy" ? "Sending" : "Join the Deal Radar"}
        </button>
      </form>
      {state === "error" && (
        <p className="font-sans text-sm text-error mt-3">Something went wrong — try again.</p>
      )}
      <p className="font-sans text-xs text-on-surface-variant/70 mt-3">
        Free. One email a week. Unsubscribe in one click.
      </p>
    </div>
  );
}
