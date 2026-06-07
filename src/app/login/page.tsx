import { Suspense } from "react";
import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md">
      <h1 className="font-display text-3xl text-mountain-100">Owner sign in</h1>
      <p className="mt-2 text-mountain-300">
        Only you can upload GPX files. Viewers can browse climbs without signing
        in.
      </p>
      <div className="mt-8 rounded-2xl border border-mountain-700/60 bg-mountain-900/40 p-6">
        <Suspense fallback={<p className="text-sm text-mountain-400">Loading…</p>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
