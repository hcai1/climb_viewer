import ClimbCard from "@/components/ClimbCard";
import StorageSetupBanner from "@/components/StorageSetupBanner";
import { getStorageBackend, listClimbs, seedSampleClimb } from "@/lib/storage";
import { getSiteProfile } from "@/lib/site-profile-storage";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const profile = await getSiteProfile();
  await seedSampleClimb();
  const climbs = await listClimbs();
  const storage = getStorageBackend();

  return (
    <div>
      <section className="mb-12">
        <p className="text-sm uppercase tracking-widest text-summit-500">
          {profile.ownerName}
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-tight text-mountain-100 sm:text-5xl">
          {profile.tagline}
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-mountain-300">{profile.bio}</p>
      </section>

      {storage === "none" && <StorageSetupBanner />}

      <section>
        <h2 className="mb-6 font-display text-2xl text-mountain-100">Climbs</h2>

        {climbs.length === 0 ? (
          <div className="rounded-2xl border border-mountain-700/60 bg-mountain-900/40 p-12 text-center">
            <p className="text-mountain-300">No climbs published yet.</p>
            <Link
              href="/login"
              className="mt-4 inline-block text-sm text-mountain-500"
            >
              Owner sign in to upload
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {climbs.map((climb) => (
              <ClimbCard key={climb.id} climb={climb} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
