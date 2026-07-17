"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import FMark from "@/components/ui/FMark";

type State = "idle" | "loading" | "success" | "error";

const inputClass =
  "w-full px-4 py-3 bg-surface-input font-sans text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:shadow-[inset_0_0_0_1px_rgba(209,252,0,0.4)] transition-all";

const labelClass = "block font-sans text-label-sm uppercase text-on-surface-variant mb-2";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("loading");
    setErrorMsg("");

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setState("error");
      setErrorMsg(error.message);
      return;
    }

    setState("success");
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-6 py-24">
      <div className="w-full max-w-md">

        <div className="text-center mb-10">
          <FMark className="inline-block h-9 w-8 text-primary mb-4" />
          <h1 className="font-serif text-display-sm uppercase text-on-surface mb-2">
            Reset your password
          </h1>
          <p className="font-sans text-sm text-on-surface-variant">
            Enter your email and we&apos;ll send you a link to reset it.
          </p>
        </div>

        <div className="bg-surface-low p-8">

          {state === "success" ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-primary flex items-center justify-center mx-auto">
                <Check size={20} className="text-primary-on" />
              </div>
              <h2 className="font-serif text-xl uppercase font-extrabold text-on-surface">
                Check your email
              </h2>
              <p className="font-sans text-sm text-on-surface-variant leading-relaxed">
                We&apos;ve sent a password reset link to{" "}
                <span className="font-semibold text-on-surface">{email}</span>.
                Check your inbox and follow the link to create a new password.
              </p>
              <Link
                href="/login"
                className="inline-block font-sans text-sm text-primary font-semibold hover:underline mt-2"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className={labelClass}>Email address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={inputClass}
                />
              </div>

              {state === "error" && (
                <p className="font-sans text-sm text-error bg-surface-input px-4 py-3">
                  {errorMsg}
                </p>
              )}

              <button
                type="submit"
                disabled={state === "loading"}
                className="w-full py-3.5 bg-primary text-primary-on font-sans text-sm font-bold tracking-wide uppercase transition-opacity duration-400 hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {state === "loading" ? (
                  <span className="flex items-center justify-center gap-3">
                    <span className="w-4 h-4 border-2 border-primary-on border-t-transparent rounded-full animate-spin" />
                    Sending...
                  </span>
                ) : (
                  "Send reset link"
                )}
              </button>

              <p className="text-center font-sans text-sm text-on-surface-variant">
                Remembered it?{" "}
                <Link href="/login" className="text-primary font-semibold hover:underline">
                  Sign in
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
