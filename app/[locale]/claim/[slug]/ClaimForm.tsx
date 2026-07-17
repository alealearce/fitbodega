"use client";

import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import FMark from "@/components/ui/FMark";

interface Props {
  slug: string;
  existingYaId: string | null;
  userEmail: string;
}

type Status = "idle" | "loading" | "success" | "error";

const inputClass =
  "w-full px-4 py-3 bg-surface-input font-sans text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:shadow-[inset_0_0_0_1px_rgba(209,252,0,0.4)] transition-all";

const labelClass = "block font-sans text-label-sm uppercase text-on-surface-variant mb-2";

export default function ClaimForm({ slug, existingYaId, userEmail }: Props) {
  const [yaId, setYaId] = useState(existingYaId ?? "");
  const [relationship, setRelationship] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/listings/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, certification_id: yaId, relationship }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("success");
        setMessage(data.message);
      } else {
        setStatus("error");
        setMessage(data.error ?? "Something went wrong.");
      }
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Try again later.");
    }
  };

  if (status === "success") {
    return (
      <div className="bg-surface-low p-8 text-center space-y-4">
        <FMark className="inline-block h-9 w-8 text-primary" />
        <h2 className="font-serif text-xl uppercase font-extrabold text-on-surface">Claim received</h2>
        <p className="font-sans text-sm text-on-surface-variant">{message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="bg-surface-low p-8 space-y-5">
      <p className="font-sans text-sm text-on-surface-variant">
        Signed in as <span className="font-semibold text-on-surface">{userEmail}</span>. We&apos;ll review your claim within 2–3 business days.
      </p>

      <div>
        <label className={labelClass}>
          Certification / License ID <span className="text-on-surface-variant/60 normal-case font-normal">(optional)</span>
        </label>
        <input
          type="text"
          value={yaId}
          onChange={e => setYaId(e.target.value)}
          placeholder="CSCS, NSCA, Registered Dietitian, etc."
          className={inputClass}
        />
        <p className="font-sans text-xs text-on-surface-variant/60 mt-2">
          If you provide a valid certification or license, we&apos;ll add a verified badge to the listing.
        </p>
      </div>

      <div>
        <label className={labelClass}>
          How are you connected to this listing? <span className="text-primary">*</span>
        </label>
        <textarea
          required
          rows={4}
          value={relationship}
          onChange={e => setRelationship(e.target.value)}
          placeholder="I'm the owner / operator / head coach of ..."
          className={`${inputClass} resize-none`}
        />
      </div>

      {status === "error" && (
        <p className="font-sans text-sm text-error bg-surface-input px-4 py-3">{message}</p>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full py-3.5 bg-primary text-primary-on font-sans text-sm font-bold tracking-wide uppercase transition-opacity duration-400 hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {status === "loading" ? (
          "Submitting..."
        ) : (
          <span className="inline-flex items-center justify-center gap-2">
            Submit claim
            <ArrowUpRight size={15} />
          </span>
        )}
      </button>
    </form>
  );
}
