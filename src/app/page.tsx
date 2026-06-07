import ClimbCard from "@/components/ClimbCard";
import { listClimbs, seedSampleClimb } from "@/lib/storage";
import Link from "next/link";

export default async function HomePage() {
  await seedSampleClimb();
  const climbs = await listClimbs();

  return (
    <div>
      <section className="mb-12">
        <h1 className="font-display text-4xl tracking-tight text-mountain-100 sm:text-5xl">
          Your climbs, in 3D
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-mountain-300">
          Upload GPX tracks from your watch or phone. Share interactive 3D
          mountain views with elevation, heart rate, and route stats.
        </p>
      </section>

      {climbs.length === 0 ? (
        <div className="rounded-2xl border border-mountain-700/60 bg-mountain-900/40 p-12 text-center">
          <p className="text-mountain-300">No climbs yet.</p>
          <Link
            href="/upload"
            className="mt-4 inline-block text-summit-400 underline"
          >
            Upload your first GPX file
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {climbs.map((climb) => (
            <ClimbCard key={climb.id} climb={climb} />
          ))}
        </div>
      )}
    </div>
  );
}
