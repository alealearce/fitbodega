"use client";

import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import FMark from "@/components/ui/FMark";

interface Props {
  list: string;
  rank: number;
  userEmail: string;
}

type Status = "idle" | "loading" | "success" | "error";

const inputClass =
  "w-full px-4 py-3 bg-surface-input font-sans text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:shadow-[inset_0_0_0_1px_rgba(209,252,0,0.4)] transition-all";

const labelClass = "block font-sans text-label-sm uppercase text-on-surface-variant mb-2";

export default function ClaimTop100Form({ list, rank, userEmail }: Props) {
  const [certId, setCertId] = useState("");
  const [relationship, setRelationship] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/top100/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ list, rank, relationship, certification_id: certId }),
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
        Signed in as <span className="font-semibold text-on-surface">{userEmail}</span>.
        Claims from an email on the same domain as your website are approved fastest.
      </p>

      <div>
        <label className={labelClass}>
          How are you connected to this profile? <span className="text-primary">*</span>
        </label>
        <textarea
          required
          rows={4}
          value={relationship}
          onChange={(e) => setRelationship(e.target.value)}
          placeholder="This is me / I'm the owner / operator / head coach of ..."
          className={`${inputClass} resize-none`}
        />
      </div>

      <div>
        <label className={labelClass}>
          Certification / License ID{" "}
          <span className="text-on-surface-variant/60 normal-case font-normal">(optional)</span>
        </label>
        <input
          type="text"
          value={certId}
          onChange={(e) => setCertId(e.target.value)}
          placeholder="CSCS, NSCA, Registered Dietitian, etc."
          className={inputClass}
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
            Claim this profile
            <ArrowUpRight size={15} />
          </span>
        )}
      </button>
    </form>
  );
}
