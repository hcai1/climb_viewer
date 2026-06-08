import Link from "next/link";
import { notFound } from "next/navigation";
import ClimbMap3D from "@/components/ClimbMap3D";
import DeleteClimbButton from "@/components/DeleteClimbButton";
import StatGrid from "@/components/StatGrid";
import StatsCharts from "@/components/StatsCharts";
import { isAdmin } from "@/lib/auth";
import { getClimb } from "@/lib/storage";

export const dynamic = "force-dynamic";

type PageProps = { params: { id: string } };

export default async function ClimbDetailPage({ params }: PageProps) {
  const { id } = params;
  const climb = await getClimb(id);
  const authed = isAdmin();

  if (!climb) notFound();

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/"
          className="text-sm text-mountain-400 transition hover:text-summit-400"
        >
          ← All climbs
        </Link>
        <p className="mt-4 text-xs uppercase tracking-widest text-mountain-500">
          {new Date(climb.date).toLocaleDateString(undefined, {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
        <div className="mt-1 flex flex-wrap items-start justify-between gap-4">
          <h1 className="font-display text-4xl text-mountain-100">{climb.name}</h1>
          {authed && (
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/climbs/${climb.id}/edit`}
                className="rounded-lg border border-mountain-700 px-4 py-2 text-sm text-mountain-200 transition hover:border-summit-500 hover:text-summit-400"
              >
                Edit
              </Link>
              <DeleteClimbButton climbId={climb.id} climbName={climb.name} />
            </div>
          )}
        </div>
        {climb.description && (
          <p className="mt-3 max-w-3xl text-mountain-300">{climb.description}</p>
        )}
      </div>

      <StatGrid stats={climb.stats} />

      <section>
        <h2 className="mb-4 font-display text-2xl text-mountain-100">3D Route</h2>
        <div className="h-[480px]">
          <ClimbMap3D points={climb.points} bounds={climb.bounds} />
        </div>
        <p className="mt-2 text-xs text-mountain-500">
          Drag to rotate · Scroll to zoom · Green marker = start · Red = summit
        </p>
      </section>

      <section className="rounded-2xl border border-mountain-700/60 bg-mountain-900/40 p-6">
        <h2 className="mb-6 font-display text-2xl text-mountain-100">
          Activity Stats
        </h2>
        <StatsCharts points={climb.points} />
      </section>
    </div>
  );
}
