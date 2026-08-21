"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import CreatorProfileForm, { type ProfileValues } from "@/components/creators/CreatorProfileForm";

// Loads a profile by its edit token and hands it to the same form used at
// signup. A missing or unknown token gets a plain explanation, not a login
// wall — there is no account to log into.

export default function ProfileEditor({ token }: { token: string }) {
  const [values, setValues] = useState<ProfileValues | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("This link is missing its key. Use the edit link from your FitBodega email.");
      return;
    }
    fetch(`/api/creators/profile?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "We could not open that profile.");
          return;
        }
        const p = data.profile;
        setValues({
          ...p,
          content_examples: [...(p.content_examples ?? []), "", ""].slice(0, 2),
        });
      })
      .catch(() => setError("We could not open that profile. Try the link again in a moment."));
  }, [token]);

  if (error) {
    return (
      <div className="bg-surface-card p-8">
        <p className="font-sans text-base text-on-surface-variant leading-relaxed">{error}</p>
        <Link
          href="/creators#join"
          className="inline-block mt-6 font-sans text-label-md uppercase text-on-surface hover:text-primary transition-colors"
        >
          Start a new profile
        </Link>
      </div>
    );
  }

  if (!values) {
    return <p className="font-sans text-sm text-on-surface-variant">Loading your profile...</p>;
  }

  return <CreatorProfileForm initial={values} mode="edit" />;
}
