import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="py-20 text-center">
      <h1 className="font-display text-3xl text-mountain-100">Something went wrong</h1>
      <p className="mx-auto mt-3 max-w-lg text-sm text-mountain-400">
        {error.message || "The page failed to load. Check that Vercel Blob storage and environment variables are configured."}
      </p>
      <div className="mt-6 flex justify-center gap-4">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-summit-500 px-4 py-2 text-sm font-medium text-mountain-950"
        >
          Try again
        </button>
        <Link href="/" className="rounded-lg border border-mountain-700 px-4 py-2 text-sm text-mountain-300">
          Home
        </Link>
      </div>
    </div>
  );
}
