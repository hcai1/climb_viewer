"use client";

import { useRouter } from "next/navigation";

export default function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="text-mountain-400 transition hover:text-mountain-200"
    >
      Sign out
    </button>
  );
}
