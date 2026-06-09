import { XMLParser } from "fast-xml-parser";
import type { ClimbBounds, ClimbStats, TrackPoint } from "./types";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  removeNSPrefix: true,
  isArray: (name) =>
    ["trkpt", "trkseg", "trk", "rte", "rtept"].includes(name),
});

function asArray<T>(value: T | T[] | undefined): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function parseNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Horizontal segment length between track points (matches Strava GPS distance). */
export function segmentDistanceKm(prev: TrackPoint, curr: TrackPoint): number {
  return haversineKm(prev.lat, prev.lon, curr.lat, curr.lon);
}

function extractCumulativeDistanceM(extensions: unknown): number | null {
  return extractExtensionNumber(extensions, [
    "distance",
    "Distance",
    "TrackPointExtension.distance",
    "gpxtpx:TrackPointExtension.gpxtpx:distance",
  ]);
}

function maxRecordedDistanceM(points: TrackPoint[]): number | null {
  let maxM: number | null = null;

  for (const point of points) {
    if (point.cumulativeDistanceM == null) continue;
    maxM =
      maxM == null
        ? point.cumulativeDistanceM
        : Math.max(maxM, point.cumulativeDistanceM);
  }

  return maxM;
}

function interpolateElevations(points: TrackPoint[]): number[] {
  const values = points.map((p) => p.ele);
  let lastKnown: number | null = null;

  for (let i = 0; i < values.length; i++) {
    if (values[i] != null) {
      lastKnown = values[i]!;
      continue;
    }

    let next: number | null = null;
    for (let j = i + 1; j < values.length; j++) {
      if (values[j] != null) {
        next = values[j]!;
        break;
      }
    }

    if (lastKnown != null && next != null) {
      values[i] = (lastKnown + next) / 2;
    } else if (lastKnown != null) {
      values[i] = lastKnown;
    } else if (next != null) {
      values[i] = next;
    }
  }

  return values.filter((v): v is number => v != null);
}

function smoothElevations(values: number[], windowSize = 7): number[] {
  if (values.length <= 2) return values;

  const half = Math.floor(windowSize / 2);
  return values.map((_, index) => {
    let sum = 0;
    let count = 0;

    for (
      let i = Math.max(0, index - half);
      i <= Math.min(values.length - 1, index + half);
      i++
    ) {
      sum += values[i];
      count++;
    }

    return sum / count;
  });
}

/** Strava: 0.5 m threshold with barometric data, 3 m for GPS elevation. */
function detectBarometricAltimeter(points: TrackPoint[]): boolean {
  const deltas: number[] = [];

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1].ele;
    const curr = points[i].ele;
    if (prev != null && curr != null) deltas.push(Math.abs(curr - prev));
  }

  if (deltas.length < 10) return false;

  const withElevation = points.filter((p) => p.ele != null).length / points.length;
  if (withElevation < 0.85) return false;

  const sorted = [...deltas].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];

  return median <= 3.5;
}

function elevationGainWithThreshold(
  elevations: number[],
  thresholdM: number
): number {
  if (elevations.length < 2) return 0;

  let gain = 0;
  let valley = elevations[0];

  for (let i = 1; i < elevations.length; i++) {
    const ele = elevations[i];

    if (ele < valley) {
      valley = ele;
      continue;
    }

    const climb = ele - valley;
    if (climb >= thresholdM) {
      gain += climb;
      valley = ele;
    }
  }

  return gain;
}

function elevationLossWithThreshold(
  elevations: number[],
  thresholdM: number
): number {
  if (elevations.length < 2) return 0;

  let loss = 0;
  let peak = elevations[0];

  for (let i = 1; i < elevations.length; i++) {
    const ele = elevations[i];

    if (ele > peak) {
      peak = ele;
      continue;
    }

    const drop = peak - ele;
    if (drop >= thresholdM) {
      loss += drop;
      peak = ele;
    }
  }

  return loss;
}

function sumTrackDistanceKm(points: TrackPoint[]): number {
  let distanceKm = 0;

  for (let i = 1; i < points.length; i++) {
    distanceKm += segmentDistanceKm(points[i - 1], points[i]);
  }

  return distanceKm;
}

function extractHeartRate(extensions: unknown): number | null {
  if (!extensions || typeof extensions !== "object") return null;
  const ext = extensions as Record<string, unknown>;

  const trackExt = ext.TrackPointExtension as Record<string, unknown> | undefined;
  const gpxtpxExt = ext["gpxtpx:TrackPointExtension"] as
    | Record<string, unknown>
    | undefined;

  const candidates = [
    ext.hr,
    trackExt?.hr,
    gpxtpxExt?.hr,
    gpxtpxExt?.["gpxtpx:hr"],
  ];

  for (const c of candidates) {
    const n = parseNumber(c);
    if (n != null) return n;
  }

  return null;
}

function extractExtensionNumber(
  extensions: unknown,
  keys: string[]
): number | null {
  if (!extensions || typeof extensions !== "object") return null;
  const ext = extensions as Record<string, unknown>;

  for (const key of keys) {
    const parts = key.split(".");
    let current: unknown = ext;
    for (const part of parts) {
      if (!current || typeof current !== "object") {
        current = null;
        break;
      }
      current = (current as Record<string, unknown>)[part];
    }
    const n = parseNumber(current);
    if (n != null) return n;
  }

  return null;
}

function parseGpxPoint(pt: Record<string, unknown>): TrackPoint | null {
  const lat = parseNumber(pt.lat);
  const lon = parseNumber(pt.lon);
  if (lat == null || lon == null) return null;

  return {
    lat,
    lon,
    ele: parseNumber(pt.ele),
    time: typeof pt.time === "string" ? pt.time : null,
    heartRate: extractHeartRate(pt.extensions),
    cumulativeDistanceM: extractCumulativeDistanceM(pt.extensions),
    speed: extractExtensionNumber(pt.extensions, [
      "speed",
      "TrackPointExtension.speed",
    ]),
    cadence: extractExtensionNumber(pt.extensions, [
      "cad",
      "TrackPointExtension.cad",
      "gpxtpx:TrackPointExtension.gpxtpx:cad",
    ]),
    temperature: extractExtensionNumber(pt.extensions, [
      "atemp",
      "TrackPointExtension.atemp",
      "gpxtpx:TrackPointExtension.gpxtpx:atemp",
    ]),
  };
}

export function parseGpx(gpxContent: string): TrackPoint[] {
  const doc = parser.parse(gpxContent);
  const gpx = doc.gpx ?? doc;
  const points: TrackPoint[] = [];

  for (const track of asArray(gpx.trk)) {
    for (const segment of asArray(track.trkseg)) {
      for (const pt of asArray(segment.trkpt)) {
        const parsed = parseGpxPoint(pt as Record<string, unknown>);
        if (parsed) points.push(parsed);
      }
    }
  }

  if (points.length === 0) {
    for (const route of asArray(gpx.rte)) {
      for (const pt of asArray(route.rtept)) {
        const parsed = parseGpxPoint(pt as Record<string, unknown>);
        if (parsed) points.push(parsed);
      }
    }
  }

  return points;
}

/** Recompute stored stats from track points (e.g. after algorithm updates). */
export function refreshClimbStats<T extends { points: TrackPoint[]; stats: ClimbStats }>(
  climb: T
): T {
  if (climb.points.length < 2) return climb;
  return { ...climb, stats: computeStats(climb.points) };
}

export function computeStats(points: TrackPoint[]): ClimbStats {
  let maxElevationM: number | null = null;
  let minElevationM: number | null = null;

  const heartRates: number[] = [];
  const speeds: number[] = [];

  for (const p of points) {
    if (p.ele != null) {
      maxElevationM =
        maxElevationM == null ? p.ele : Math.max(maxElevationM, p.ele);
      minElevationM =
        minElevationM == null ? p.ele : Math.min(minElevationM, p.ele);
    }

    if (p.heartRate != null) heartRates.push(p.heartRate);
    if (p.speed != null) speeds.push(p.speed);
  }

  const recordedDistanceM = maxRecordedDistanceM(points);
  const distanceKm =
    recordedDistanceM != null && recordedDistanceM > 0
      ? recordedDistanceM / 1000
      : sumTrackDistanceKm(points);

  const interpolated = interpolateElevations(points);
  const barometric = detectBarometricAltimeter(points);
  const elevationThresholdM = barometric ? 0.5 : 3;
  const smoothed =
    interpolated.length >= 3
      ? smoothElevations(interpolated)
      : interpolated;

  let elevationGainM = 0;
  let elevationLossM = 0;

  if (smoothed.length >= 2) {
    elevationGainM = elevationGainWithThreshold(smoothed, elevationThresholdM);
    elevationLossM = elevationLossWithThreshold(smoothed, elevationThresholdM);
  }

  const startTime = points.find((p) => p.time)?.time ?? null;
  const endTime = [...points].reverse().find((p) => p.time)?.time ?? null;

  let durationSeconds: number | null = null;
  if (startTime && endTime) {
    durationSeconds =
      (new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000;
    if (durationSeconds < 0) durationSeconds = null;
  }

  const avgHeartRate =
    heartRates.length > 0
      ? Math.round(heartRates.reduce((a, b) => a + b, 0) / heartRates.length)
      : null;
  const maxHeartRate =
    heartRates.length > 0 ? Math.max(...heartRates) : null;

  const avgSpeedKmh =
    speeds.length > 0
      ? (speeds.reduce((a, b) => a + b, 0) / speeds.length) * 3.6
      : durationSeconds && durationSeconds > 0
        ? (distanceKm / durationSeconds) * 3600
        : null;

  const maxSpeedKmh =
    speeds.length > 0 ? Math.max(...speeds) * 3.6 : null;

  return {
    distanceKm: Math.round(distanceKm * 100) / 100,
    elevationGainM: Math.round(elevationGainM),
    elevationLossM: Math.round(elevationLossM),
    maxElevationM: maxElevationM != null ? Math.round(maxElevationM) : null,
    minElevationM: minElevationM != null ? Math.round(minElevationM) : null,
    durationSeconds:
      durationSeconds != null ? Math.round(durationSeconds) : null,
    avgHeartRate,
    maxHeartRate,
    avgSpeedKmh:
      avgSpeedKmh != null ? Math.round(avgSpeedKmh * 10) / 10 : null,
    maxSpeedKmh: maxSpeedKmh != null ? Math.round(maxSpeedKmh * 10) / 10 : null,
  };
}

export function computeBounds(points: TrackPoint[]): ClimbBounds {
  const lats = points.map((p) => p.lat);
  const lons = points.map((p) => p.lon);

  return {
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
    minLon: Math.min(...lons),
    maxLon: Math.max(...lons),
  };
}

export function formatDuration(seconds: number | null): string {
  if (seconds == null || seconds <= 0) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function formatDistance(km: number): string {
  if (km >= 10) return `${km.toFixed(1)} km`;
  return `${km.toFixed(2)} km`;
}

export function formatElevation(m: number | null): string {
  if (m == null) return "—";
  return `${Math.round(m).toLocaleString()} m`;
}

export function buildRouteGeoJson(points: TrackPoint[]) {
  const coordinates = points.map((p) => {
    if (p.ele != null) return [p.lon, p.lat, p.ele];
    return [p.lon, p.lat];
  });

  return {
    type: "Feature" as const,
    properties: {},
    geometry: {
      type: "LineString" as const,
      coordinates,
    },
  };
}

export function buildPointGeoJson(points: TrackPoint[]) {
  return {
    type: "FeatureCollection" as const,
    features: points
      .filter((p) => p.ele != null)
      .map((p, i) => ({
        type: "Feature" as const,
        properties: { index: i },
        geometry: {
          type: "Point" as const,
          coordinates: [p.lon, p.lat, p.ele!],
        },
      })),
  };
}

export function samplePointsForChart(
  points: TrackPoint[],
  maxSamples = 500
): Array<TrackPoint & { distanceKm: number }> {
  if (points.length === 0) return [];

  const withDistance: Array<TrackPoint & { distanceKm: number }> = [
    { ...points[0], distanceKm: 0 },
  ];

  for (let i = 1; i < points.length; i++) {
    const prev = withDistance[i - 1];
    const p = points[i];
    const d = prev.distanceKm + segmentDistanceKm(prev, p);
    withDistance.push({ ...p, distanceKm: d });
  }

  if (withDistance.length <= maxSamples) return withDistance;

  const step = withDistance.length / maxSamples;
  const sampled: Array<TrackPoint & { distanceKm: number }> = [];

  for (let i = 0; i < maxSamples; i++) {
    sampled.push(withDistance[Math.floor(i * step)]);
  }

  const last = withDistance[withDistance.length - 1];
  if (sampled[sampled.length - 1] !== last) sampled.push(last);

  return sampled;
}
