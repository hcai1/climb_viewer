"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface DeleteClimbButtonProps {
  climbId: string;
  climbName: string;
}

export default function DeleteClimbButton({
  climbId,
  climbName,
}: DeleteClimbButtonProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/climbs/${climbId}`, { method: "DELETE" });

      if (res.status === 401) {
        router.push("/login?next=/climbs/" + climbId);
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Could not delete climb.");
        setLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Could not delete climb.");
      setLoading(false);
    }
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-lg border border-red-500/40 px-4 py-2 text-sm text-red-300 transition hover:bg-red-500/10"
      >
        Delete climb
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
      <p className="text-sm text-red-200">
        Delete <strong>{climbName}</strong>? This cannot be undone.
      </p>
      {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          disabled={loading}
          onClick={handleDelete}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500 disabled:opacity-60"
        >
          {loading ? "Deleting…" : "Yes, delete"}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => {
            setConfirming(false);
            setError(null);
          }}
          className="rounded-lg border border-mountain-700 px-4 py-2 text-sm text-mountain-300"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
