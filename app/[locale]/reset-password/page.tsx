"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import FMark from "@/components/ui/FMark";

type State = "idle" | "loading" | "success" | "error";

const inputClass =
  "w-full px-4 py-3 bg-surface-input font-sans text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:shadow-[inset_0_0_0_1px_rgba(209,252,0,0.4)] transition-all";

const labelClass = "block font-sans text-label-sm uppercase text-on-surface-variant mb-2";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [state, setState] = useState<State>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (password !== confirm) {
      setErrorMsg("Passwords do not match.");
      setState("error");
      return;
    }

    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters.");
      setState("error");
      return;
    }

    setState("loading");

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setState("error");
      setErrorMsg(error.message);
      return;
    }

    setState("success");
    setTimeout(() => router.push("/login"), 2000);
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-6 py-24">
      <div className="w-full max-w-md">

        <div className="text-center mb-10">
          <FMark className="inline-block h-9 w-8 text-primary mb-4" />
          <h1 className="font-serif text-display-sm uppercase text-on-surface mb-2">
            Create new password
          </h1>
          <p className="font-sans text-sm text-on-surface-variant">
            Choose a strong password for your account.
          </p>
        </div>

        <div className="bg-surface-low p-8">

          {state === "success" ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-primary flex items-center justify-center mx-auto">
                <Check size={20} className="text-primary-on" />
              </div>
              <h2 className="font-serif text-xl uppercase font-extrabold text-on-surface">
                Password updated
              </h2>
              <p className="font-sans text-sm text-on-surface-variant">
                Redirecting you to sign in...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* New password */}
              <div>
                <label className={labelClass}>New password</label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className={`${inputClass} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div>
                <label className={labelClass}>Confirm new password</label>
                <input
                  type={showPw ? "text" : "password"}
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat your password"
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
                    Updating...
                  </span>
                ) : (
                  "Update password"
                )}
              </button>

              <p className="text-center font-sans text-sm text-on-surface-variant">
                <Link href="/login" className="text-primary font-semibold hover:underline">
                  Back to sign in
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
