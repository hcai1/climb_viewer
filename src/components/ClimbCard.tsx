import Link from "next/link";
import type { ClimbListItem } from "@/lib/types";
import {
  formatDistance,
  formatDuration,
  formatElevation,
} from "@/lib/gpx";

interface ClimbCardProps {
  climb: ClimbListItem;
}

export default function ClimbCard({ climb }: ClimbCardProps) {
  const { stats } = climb;

  return (
    <Link
      href={`/climbs/${climb.id}`}
      className="group relative overflow-hidden rounded-2xl border border-mountain-700/60 bg-gradient-to-br from-mountain-900/90 to-mountain-950 p-6 transition hover:border-summit-500/50 hover:shadow-lg hover:shadow-summit-500/10"
    >
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-summit-500/5 blur-2xl transition group-hover:bg-summit-500/10" />

      <div className="relative">
        <p className="text-xs uppercase tracking-widest text-mountain-500">
          {new Date(climb.date).toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
        <h2 className="mt-1 font-display text-2xl text-mountain-100 transition group-hover:text-summit-400">
          {climb.name}
        </h2>
        {climb.description && (
          <p className="mt-2 line-clamp-2 text-sm text-mountain-300">
            {climb.description}
          </p>
        )}

        <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <dt className="text-xs text-mountain-500">Distance</dt>
            <dd className="text-sm font-medium text-mountain-100">
              {formatDistance(stats.distanceKm)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-mountain-500">Elevation gain</dt>
            <dd className="text-sm font-medium text-mountain-100">
              {formatElevation(stats.elevationGainM)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-mountain-500">Max elevation</dt>
            <dd className="text-sm font-medium text-mountain-100">
              {formatElevation(stats.maxElevationM)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-mountain-500">Duration</dt>
            <dd className="text-sm font-medium text-mountain-100">
              {formatDuration(stats.durationSeconds)}
            </dd>
          </div>
        </dl>
      </div>
    </Link>
  );
}
