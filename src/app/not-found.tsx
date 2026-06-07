import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-20 text-center">
      <h1 className="font-display text-3xl text-mountain-100">Climb not found</h1>
      <p className="mt-2 text-mountain-400">
        This route may have been removed or the link is wrong.
      </p>
      <Link href="/" className="mt-6 inline-block text-summit-400 underline">
        Back to all climbs
      </Link>
    </div>
  );
}
