"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-[#0a1628] px-6 text-[#d4e4e8]">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold">Something went wrong</h1>
          <p className="mt-3 text-sm text-[#8fb4b8]">
            {error.message || "A server error occurred while loading this page."}
          </p>
          {error.digest && (
            <p className="mt-2 text-xs text-[#4a7c8c]">Digest: {error.digest}</p>
          )}
          <button
            type="button"
            onClick={reset}
            className="mt-6 rounded-lg bg-[#f59e0b] px-5 py-2.5 text-sm font-medium text-[#0a1628]"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
