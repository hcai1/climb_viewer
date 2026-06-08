import Link from "next/link";
import SignOutButton from "@/components/SignOutButton";
import { isAdmin } from "@/lib/auth";

export default function SiteNav() {
  const authed = isAdmin();

  return (
    <nav className="flex items-center gap-4 text-sm">
      <Link href="/" className="text-mountain-300 transition hover:text-mountain-100">
        Climbs
      </Link>
      {authed ? (
        <>
          <Link
            href="/upload"
            className="rounded-lg bg-summit-500/90 px-4 py-2 font-medium text-mountain-950 transition hover:bg-summit-400"
          >
            Upload
          </Link>
          <Link
            href="/settings"
            className="text-mountain-400 transition hover:text-mountain-100"
          >
            Settings
          </Link>
          <SignOutButton />
        </>
      ) : (
        <Link
          href="/login"
          className="text-mountain-500 transition hover:text-mountain-400"
        >
          Sign in
        </Link>
      )}
    </nav>
  );
}
