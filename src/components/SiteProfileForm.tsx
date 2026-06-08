"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { SiteProfile } from "@/lib/site-config";

interface SiteProfileFormProps {
  initial: SiteProfile;
}

export default function SiteProfileForm({ initial }: SiteProfileFormProps) {
  const router = useRouter();
  const [profile, setProfile] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/site/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Could not save settings.");
        return;
      }

      setProfile(data);
      setMessage("Site updated. Visitors will see your personalized profile.");
      router.refresh();
      router.push("/");
    } catch {
      setError("Could not save settings.");
    } finally {
      setLoading(false);
    }
  }

  function update(field: keyof SiteProfile, value: string) {
    setProfile((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="ownerName" className="mb-1 block text-sm text-mountain-300">
          Your name
        </label>
        <input
          id="ownerName"
          required
          value={profile.ownerName}
          onChange={(e) => update("ownerName", e.target.value)}
          className="w-full rounded-lg border border-mountain-700 bg-mountain-950 px-4 py-2.5 text-mountain-100 focus:border-summit-500 focus:outline-none focus:ring-1 focus:ring-summit-500"
        />
      </div>

      <div>
        <label htmlFor="siteTitle" className="mb-1 block text-sm text-mountain-300">
          Site title
        </label>
        <input
          id="siteTitle"
          required
          value={profile.siteTitle}
          onChange={(e) => update("siteTitle", e.target.value)}
          className="w-full rounded-lg border border-mountain-700 bg-mountain-950 px-4 py-2.5 text-mountain-100 focus:border-summit-500 focus:outline-none focus:ring-1 focus:ring-summit-500"
        />
      </div>

      <div>
        <label htmlFor="tagline" className="mb-1 block text-sm text-mountain-300">
          Tagline
        </label>
        <input
          id="tagline"
          required
          value={profile.tagline}
          onChange={(e) => update("tagline", e.target.value)}
          className="w-full rounded-lg border border-mountain-700 bg-mountain-950 px-4 py-2.5 text-mountain-100 focus:border-summit-500 focus:outline-none focus:ring-1 focus:ring-summit-500"
        />
      </div>

      <div>
        <label htmlFor="bio" className="mb-1 block text-sm text-mountain-300">
          About you
        </label>
        <textarea
          id="bio"
          rows={4}
          required
          value={profile.bio}
          onChange={(e) => update("bio", e.target.value)}
          placeholder="Tell visitors about your climbing..."
          className="w-full rounded-lg border border-mountain-700 bg-mountain-950 px-4 py-2.5 text-mountain-100 focus:border-summit-500 focus:outline-none focus:ring-1 focus:ring-summit-500"
        />
      </div>

      <div>
        <label htmlFor="footer" className="mb-1 block text-sm text-mountain-300">
          Footer text
        </label>
        <input
          id="footer"
          value={profile.footer}
          onChange={(e) => update("footer", e.target.value)}
          className="w-full rounded-lg border border-mountain-700 bg-mountain-950 px-4 py-2.5 text-mountain-100 focus:border-summit-500 focus:outline-none focus:ring-1 focus:ring-summit-500"
        />
      </div>

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      {message && (
        <p className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-2 text-sm text-green-200">
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-summit-500 px-6 py-3 font-medium text-mountain-950 transition hover:bg-summit-400 disabled:opacity-60"
      >
        {loading ? "Saving…" : "Save site settings"}
      </button>
    </form>
  );
}
