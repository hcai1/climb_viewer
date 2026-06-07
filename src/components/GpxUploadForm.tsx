"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function GpxUploadForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!file) {
      setError("Please select a GPX file.");
      return;
    }

    const formData = new FormData();
    formData.append("gpx", file);
    formData.append("name", name);
    formData.append("description", description);
    formData.append("date", date);

    setLoading(true);

    try {
      const res = await fetch("/api/climbs", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Upload failed.");
        return;
      }

      router.push(`/climbs/${data.id}`);
      router.refresh();
    } catch {
      setError("Upload failed. Please try again.");
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
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`rounded-2xl border-2 border-dashed p-10 text-center transition ${
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
          <p className="text-4xl">⛰️</p>
          <p className="mt-3 font-medium text-mountain-100">
            {file ? file.name : "Drop your GPX file here"}
          </p>
          <p className="mt-1 text-sm text-mountain-400">
            or click to browse — supports Garmin heart rate extensions
          </p>
        </label>
      </div>

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
            placeholder="e.g. Mount Washington via Tuckerman Ravine"
            className="w-full rounded-lg border border-mountain-700 bg-mountain-950 px-4 py-2.5 text-mountain-100 placeholder:text-mountain-600 focus:border-summit-500 focus:outline-none focus:ring-1 focus:ring-summit-500"
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
          placeholder="Weather, route notes, how it felt..."
          className="w-full rounded-lg border border-mountain-700 bg-mountain-950 px-4 py-2.5 text-mountain-100 placeholder:text-mountain-600 focus:border-summit-500 focus:outline-none focus:ring-1 focus:ring-summit-500"
        />
      </div>

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-summit-500 px-6 py-3 font-medium text-mountain-950 transition hover:bg-summit-400 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {loading ? "Processing GPX…" : "Publish climb"}
      </button>
    </form>
  );
}
