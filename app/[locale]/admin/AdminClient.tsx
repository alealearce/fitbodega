"use client";

import { useState } from "react";
import { Check, Trash2 } from "lucide-react";
import type { Listing } from "@/lib/supabase/types";
import Badge from "@/components/ui/Badge";

type AdminListing = Pick<
  Listing,
  | "id"
  | "name"
  | "slug"
  | "type"
  | "status"
  | "is_featured"
  | "is_verified"
  | "city"
  | "country"
  | "plan"
  | "created_at"
>;

interface Props {
  pending: AdminListing[];
  all: AdminListing[];
}

async function callAction(
  action: string,
  id: string,
  value?: boolean
): Promise<boolean> {
  const res = await fetch("/api/admin/action", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, id, value }),
  });
  return res.ok;
}

export default function AdminClient({ pending: initialPending, all: initialAll }: Props) {
  const [pending, setPending] = useState(initialPending);
  const [all, setAll] = useState(initialAll);
  const [busy, setBusy] = useState<string | null>(null);
  const [tab, setTab] = useState<"pending" | "all">("pending");

  const approve = async (id: string) => {
    setBusy(id);
    const ok = await callAction("approve", id);
    if (ok) {
      const item = pending.find((l) => l.id === id);
      setPending((prev) => prev.filter((l) => l.id !== id));
      if (item) {
        setAll((prev) =>
          prev.map((l) => (l.id === id ? { ...l, status: "approved" } : l))
        );
      }
    }
    setBusy(null);
  };

  const reject = async (id: string) => {
    setBusy(id);
    const ok = await callAction("reject", id);
    if (ok) {
      setPending((prev) => prev.filter((l) => l.id !== id));
      setAll((prev) =>
        prev.map((l) => (l.id === id ? { ...l, status: "rejected" } : l))
      );
    }
    setBusy(null);
  };

  const toggleFeatured = async (id: string, current: boolean) => {
    setBusy(id + "-featured");
    const ok = await callAction("feature", id, !current);
    if (ok) {
      setAll((prev) =>
        prev.map((l) => (l.id === id ? { ...l, is_featured: !current } : l))
      );
    }
    setBusy(null);
  };

  const toggleVerified = async (id: string, current: boolean) => {
    setBusy(id + "-verified");
    const ok = await callAction("verify", id, !current);
    if (ok) {
      setAll((prev) =>
        prev.map((l) => (l.id === id ? { ...l, is_verified: !current } : l))
      );
    }
    setBusy(null);
  };

  const removeListing = async (id: string, name: string) => {
    if (
      !window.confirm(
        `Delete "${name}"?\n\nThis permanently removes the listing from the directory and cannot be undone.`
      )
    ) {
      return;
    }
    setBusy(id + "-delete");
    const ok = await callAction("delete", id);
    if (ok) {
      setPending((prev) => prev.filter((l) => l.id !== id));
      setAll((prev) => prev.filter((l) => l.id !== id));
    } else {
      window.alert("Delete failed. Please try again.");
    }
    setBusy(null);
  };

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-2 mb-8">
        {(["pending", "all"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 font-sans text-sm font-bold uppercase tracking-wide transition-all duration-300 ${
              tab === t
                ? "bg-primary text-primary-on"
                : "bg-surface-low text-on-surface-variant hover:bg-secondary-container"
            }`}
          >
            {t === "pending" ? `Pending (${pending.length})` : `All Listings (${all.length})`}
          </button>
        ))}
      </div>

      {/* Pending tab */}
      {tab === "pending" && (
        <div>
          {pending.length === 0 ? (
            <div className="text-center py-16">
              <div className="flex justify-center mb-4">
                <Check size={32} className="text-primary" />
              </div>
              <p className="font-sans text-on-surface-variant">
                No pending listings — all clear.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl shadow-card bg-surface-card">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-outline-variant/20">
                    <th className="text-left font-sans text-xs font-semibold text-on-surface-variant uppercase tracking-wide px-5 py-3">
                      Listing
                    </th>
                    <th className="text-left font-sans text-xs font-semibold text-on-surface-variant uppercase tracking-wide px-5 py-3">
                      Type
                    </th>
                    <th className="text-left font-sans text-xs font-semibold text-on-surface-variant uppercase tracking-wide px-5 py-3">
                      Location
                    </th>
                    <th className="text-left font-sans text-xs font-semibold text-on-surface-variant uppercase tracking-wide px-5 py-3">
                      Submitted
                    </th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {pending.map((listing) => (
                    <tr key={listing.id} className="hover:bg-surface-low transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-sans font-semibold text-sm text-on-surface">
                          {listing.name}
                        </p>
                        <p className="font-sans text-xs text-on-surface-variant mt-0.5">
                          {listing.slug}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-sans text-sm text-on-surface capitalize">
                          {listing.type}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-sans text-sm text-on-surface-variant">
                          {[listing.city, listing.country].filter(Boolean).join(", ") || "—"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-sans text-xs text-on-surface-variant">
                          {new Date(listing.created_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => approve(listing.id)}
                            disabled={busy === listing.id}
                            className="px-4 py-1.5 rounded-full font-sans text-xs font-semibold bg-green-100 text-green-700 hover:bg-green-200 transition-colors disabled:opacity-50"
                          >
                            {busy === listing.id ? "..." : "Approve"}
                          </button>
                          <button
                            onClick={() => reject(listing.id)}
                            disabled={busy === listing.id}
                            className="px-4 py-1.5 rounded-full font-sans text-xs font-semibold bg-red-100 text-red-600 hover:bg-red-200 transition-colors disabled:opacity-50"
                          >
                            {busy === listing.id ? "..." : "Reject"}
                          </button>
                          <button
                            onClick={() => removeListing(listing.id, listing.name)}
                            disabled={busy === listing.id + "-delete"}
                            className="px-4 py-1.5 rounded-full font-sans text-xs font-semibold bg-red-50 text-red-700 ring-1 ring-red-200 hover:bg-red-100 transition-colors disabled:opacity-50"
                          >
                            {busy === listing.id + "-delete" ? "..." : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* All listings tab */}
      {tab === "all" && (
        <div className="overflow-x-auto rounded-2xl shadow-card bg-surface-card">
          <table className="w-full">
            <thead>
              <tr className="border-b border-outline-variant/20">
                <th className="text-left font-sans text-xs font-semibold text-on-surface-variant uppercase tracking-wide px-5 py-3">
                  Listing
                </th>
                <th className="text-left font-sans text-xs font-semibold text-on-surface-variant uppercase tracking-wide px-5 py-3">
                  Type
                </th>
                <th className="text-left font-sans text-xs font-semibold text-on-surface-variant uppercase tracking-wide px-5 py-3">
                  Status
                </th>
                <th className="text-left font-sans text-xs font-semibold text-on-surface-variant uppercase tracking-wide px-5 py-3">
                  Plan
                </th>
                <th className="text-left font-sans text-xs font-semibold text-on-surface-variant uppercase tracking-wide px-5 py-3">
                  Flags
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {all.map((listing) => (
                <tr key={listing.id} className="hover:bg-surface-low transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-sans font-semibold text-sm text-on-surface">
                      {listing.name}
                    </p>
                    <p className="font-sans text-xs text-on-surface-variant mt-0.5">
                      {[listing.city, listing.country].filter(Boolean).join(", ") || "—"}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-sans text-sm text-on-surface capitalize">
                      {listing.type}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <Badge
                      variant={
                        listing.status === "approved"
                          ? "approved"
                          : listing.status === "rejected"
                          ? "rejected"
                          : "pending"
                      }
                    >
                      {listing.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-4">
                    <Badge variant={listing.plan === "pro" ? "pro" : "free"}>
                      {listing.plan}
                    </Badge>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => toggleFeatured(listing.id, listing.is_featured)}
                        disabled={busy === listing.id + "-featured"}
                        className={`px-3 py-1 rounded-full font-sans text-xs font-semibold transition-colors disabled:opacity-50 ${
                          listing.is_featured
                            ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                            : "bg-surface-low text-on-surface-variant hover:bg-secondary-container"
                        }`}
                      >
                        {listing.is_featured ? "★ Featured" : "Feature"}
                      </button>
                      <button
                        onClick={() => toggleVerified(listing.id, listing.is_verified)}
                        disabled={busy === listing.id + "-verified"}
                        className={`px-3 py-1 rounded-full font-sans text-xs font-semibold transition-colors disabled:opacity-50 ${
                          listing.is_verified
                            ? "bg-primary/10 text-primary hover:bg-primary/20"
                            : "bg-surface-low text-on-surface-variant hover:bg-secondary-container"
                        }`}
                      >
                        {listing.is_verified ? "✓ Verified" : "Verify"}
                      </button>
                      <button
                        onClick={() => removeListing(listing.id, listing.name)}
                        disabled={busy === listing.id + "-delete"}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full font-sans text-xs font-semibold bg-red-50 text-red-600 ring-1 ring-red-200 hover:bg-red-100 transition-colors disabled:opacity-50"
                      >
                        {busy === listing.id + "-delete" ? "..." : (<><Trash2 size={12} /> Delete</>)}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
