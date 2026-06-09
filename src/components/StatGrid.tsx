import type { ClimbStats } from "@/lib/types";
import {
  formatDistance,
  formatDuration,
  formatElevation,
} from "@/lib/gpx";

interface StatGridProps {
  stats: ClimbStats;
}

function StatItem({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        highlight
          ? "border-summit-500/40 bg-summit-500/10"
          : "border-mountain-700/60 bg-mountain-900/60"
      }`}
    >
      <dt className="text-xs uppercase tracking-wide text-mountain-500">
        {label}
      </dt>
      <dd
        className={`mt-1 text-xl font-semibold ${
          highlight ? "text-summit-400" : "text-mountain-100"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

export default function StatGrid({ stats }: StatGridProps) {
  return (
    <div>
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      <StatItem
        label="Distance"
        value={formatDistance(stats.distanceKm)}
        highlight
      />
      <StatItem
        label="Elevation gain"
        value={formatElevation(stats.elevationGainM)}
        highlight
      />
      <StatItem
        label="Max elevation"
        value={formatElevation(stats.maxElevationM)}
      />
      <StatItem
        label="Min elevation"
        value={formatElevation(stats.minElevationM)}
      />
      <StatItem
        label="Duration"
        value={formatDuration(stats.durationSeconds)}
      />
      <StatItem
        label="Avg heart rate"
        value={
          stats.avgHeartRate != null ? `${stats.avgHeartRate} bpm` : "—"
        }
      />
      <StatItem
        label="Max heart rate"
        value={
          stats.maxHeartRate != null ? `${stats.maxHeartRate} bpm` : "—"
        }
      />
      <StatItem
        label="Avg speed"
        value={
          stats.avgSpeedKmh != null ? `${stats.avgSpeedKmh} km/h` : "—"
        }
      />
    </dl>
    <p className="mt-3 text-xs text-mountain-500">
      Stats are computed from your GPX with Strava-style smoothing. Small
      differences vs Strava are normal — they also apply their own map
      corrections.
    </p>
    </div>
  );
}
