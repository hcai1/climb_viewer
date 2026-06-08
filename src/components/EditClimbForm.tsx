"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ClimbSummary } from "@/lib/types";

interface EditClimbFormProps {
  climb: Pick<ClimbSummary, "id" | "name" | "description" | "date">;
}

export default function EditClimbForm({ climb }: EditClimbFormProps) {
  const router = useRouter();
  const [name, setName] = useState(climb.name);
  const [description, setDescription] = useState(climb.description);
  const [date, setDate] = useState(climb.date);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("date", date);
    if (file) formData.append("gpx", file);

    try {
      const res = await fetch(`/api/climbs/${climb.id}`, {
        method: "PATCH",
        body: formData,
      });

      const data = await res.json();

      if (res.status === 401) {
        router.push(`/login?next=/climbs/${climb.id}/edit`);
        return;
      }

      if (!res.ok) {
        setError(data.error ?? "Could not save changes.");
        return;
      }

      router.push(`/climbs/${climb.id}`);
      router.refresh();
    } catch {
      setError("Could not save changes.");
    } finally {
      setLoading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.name.toLowerCase().endsWith(".gpx")) {
      setFile(dropped);
    } else {
      setError("Please drop a .gpx file.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm text-mountain-300">
            Climb name *
          </label>
          <input
            id="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-mountain-700 bg-mountain-950 px-4 py-2.5 text-mountain-100 focus:border-summit-500 focus:outline-none focus:ring-1 focus:ring-summit-500"
          />
        </div>
        <div>
          <label htmlFor="date" className="mb-1 block text-sm text-mountain-300">
            Date
          </label>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg border border-mountain-700 bg-mountain-950 px-4 py-2.5 text-mountain-100 focus:border-summit-500 focus:outline-none focus:ring-1 focus:ring-summit-500"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="description"
          className="mb-1 block text-sm text-mountain-300"
        >
          Description
        </label>
        <textarea
          id="description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-lg border border-mountain-700 bg-mountain-950 px-4 py-2.5 text-mountain-100 focus:border-summit-500 focus:outline-none focus:ring-1 focus:ring-summit-500"
        />
      </div>

      <div>
        <p className="mb-2 text-sm text-mountain-300">
          Replace GPX track <span className="text-mountain-500">(optional)</span>
        </p>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`rounded-2xl border-2 border-dashed p-8 text-center transition ${
            dragOver
              ? "border-summit-400 bg-summit-500/10"
              : "border-mountain-700 bg-mountain-900/50"
          }`}
        >
          <input
            type="file"
            accept=".gpx,application/gpx+xml"
            id="gpx-file"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <label htmlFor="gpx-file" className="cursor-pointer">
            <p className="font-medium text-mountain-100">
              {file ? file.name : "Drop a new GPX file to replace the route"}
            </p>
            <p className="mt-1 text-sm text-mountain-400">
              Leave empty to keep the current track
            </p>
          </label>
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-summit-500 px-6 py-3 font-medium text-mountain-950 transition hover:bg-summit-400 disabled:opacity-60"
        >
          {loading ? "Saving…" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={() => router.push(`/climbs/${climb.id}`)}
          className="rounded-xl border border-mountain-700 px-6 py-3 text-mountain-300 transition hover:border-mountain-500"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
