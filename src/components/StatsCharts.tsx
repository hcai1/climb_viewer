"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TrackPoint } from "@/lib/types";
import { samplePointsForChart } from "@/lib/gpx";

interface StatsChartsProps {
  points: TrackPoint[];
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-mountain-700 bg-mountain-950/95 px-3 py-2 text-xs shadow-xl">
      <p className="mb-1 text-mountain-300">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
}

export default function StatsCharts({ points }: StatsChartsProps) {
  const sampled = samplePointsForChart(points);

  const chartData = sampled.map((p) => ({
    distance: p.distanceKm.toFixed(2),
    elevation: p.ele != null ? Math.round(p.ele) : null,
    heartRate: p.heartRate,
    speed: p.speed != null ? Math.round(p.speed * 3.6 * 10) / 10 : null,
    cadence: p.cadence,
    temperature: p.temperature,
  }));

  const hasHeartRate = chartData.some((d) => d.heartRate != null);
  const hasSpeed = chartData.some((d) => d.speed != null);
  const hasElevation = chartData.some((d) => d.elevation != null);

  if (!hasElevation && !hasHeartRate) {
    return (
      <p className="text-sm text-mountain-300">
        No elevation or heart rate data found in this GPX file.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {hasElevation && (
        <div>
          <h3 className="mb-3 font-display text-lg text-mountain-100">
            Elevation Profile
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="eleGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d4a5e" />
              <XAxis
                dataKey="distance"
                stroke="#8fb4b8"
                tick={{ fontSize: 11 }}
                label={{
                  value: "Distance (km)",
                  position: "insideBottom",
                  offset: -2,
                  fill: "#8fb4b8",
                  fontSize: 11,
                }}
              />
              <YAxis
                stroke="#8fb4b8"
                tick={{ fontSize: 11 }}
                label={{
                  value: "Elevation (m)",
                  angle: -90,
                  position: "insideLeft",
                  fill: "#8fb4b8",
                  fontSize: 11,
                }}
              />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="elevation"
                name="Elevation (m)"
                stroke="#f59e0b"
                fill="url(#eleGradient)"
                connectNulls
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {hasHeartRate && (
        <div>
          <h3 className="mb-3 font-display text-lg text-mountain-100">
            Heart Rate
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d4a5e" />
              <XAxis
                dataKey="distance"
                stroke="#8fb4b8"
                tick={{ fontSize: 11 }}
              />
              <YAxis
                stroke="#8fb4b8"
                tick={{ fontSize: 11 }}
                domain={["auto", "auto"]}
              />
              <Tooltip content={<ChartTooltip />} />
              <Line
                type="monotone"
                dataKey="heartRate"
                name="Heart Rate (bpm)"
                stroke="#ef4444"
                dot={false}
                strokeWidth={2}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {hasSpeed && (
        <div>
          <h3 className="mb-3 font-display text-lg text-mountain-100">Speed</h3>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d4a5e" />
              <XAxis
                dataKey="distance"
                stroke="#8fb4b8"
                tick={{ fontSize: 11 }}
              />
              <YAxis stroke="#8fb4b8" tick={{ fontSize: 11 }} />
              <Tooltip content={<ChartTooltip />} />
              <Line
                type="monotone"
                dataKey="speed"
                name="Speed (km/h)"
                stroke="#38bdf8"
                dot={false}
                strokeWidth={2}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
