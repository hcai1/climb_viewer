import { Suspense } from "react";
import LoginForm from "@/components/LoginForm";
import { getAdminConfigError } from "@/lib/auth";
import { getStorageBackend } from "@/lib/storage";

export default function LoginPage() {
  const configError = getAdminConfigError();
  const backend = getStorageBackend();

  return (
    <div className="mx-auto max-w-md">
      <h1 className="font-display text-3xl text-mountain-100">Owner sign in</h1>
      <p className="mt-2 text-mountain-300">
        Sign in to upload GPX files, delete climbs, and edit site settings.
        Visitors can browse climbs without an account.
      </p>

      {configError ? (
        <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
          {configError}
        </div>
      ) : (
        <>
          {backend === "none" && (
            <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
              Connect <strong>Vercel Blob</strong> storage before uploading climbs.
            </div>
          )}
          <div className="mt-8 rounded-2xl border border-mountain-700/60 bg-mountain-900/40 p-6">
            <Suspense fallback={<p className="text-sm text-mountain-400">Loading…</p>}>
              <LoginForm />
            </Suspense>
          </div>
        </>
      )}
    </div>
  );
}
