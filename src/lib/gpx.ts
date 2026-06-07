import { XMLParser } from "fast-xml-parser";
import type { ClimbBounds, ClimbStats, TrackPoint } from "./types";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  removeNSPrefix: true,
  isArray: (name) => ["trkpt", "trkseg", "trk"].includes(name),
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

export function parseGpx(gpxContent: string): TrackPoint[] {
  const doc = parser.parse(gpxContent);
  const gpx = doc.gpx ?? doc;
  const tracks = asArray(gpx.trk);
  const points: TrackPoint[] = [];

  for (const track of tracks) {
    const segments = asArray(track.trkseg);
    for (const segment of segments) {
      for (const pt of asArray(segment.trkpt)) {
        const lat = parseNumber(pt.lat);
        const lon = parseNumber(pt.lon);
        if (lat == null || lon == null) continue;

        points.push({
          lat,
          lon,
          ele: parseNumber(pt.ele),
          time: typeof pt.time === "string" ? pt.time : null,
          heartRate: extractHeartRate(pt.extensions),
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
        });
      }
    }
  }

  return points;
}

export function computeStats(points: TrackPoint[]): ClimbStats {
  let distanceKm = 0;
  let elevationGainM = 0;
  let elevationLossM = 0;
  let maxElevationM: number | null = null;
  let minElevationM: number | null = null;

  const heartRates: number[] = [];
  const speeds: number[] = [];

  for (let i = 0; i < points.length; i++) {
    const p = points[i];

    if (p.ele != null) {
      maxElevationM =
        maxElevationM == null ? p.ele : Math.max(maxElevationM, p.ele);
      minElevationM =
        minElevationM == null ? p.ele : Math.min(minElevationM, p.ele);
    }

    if (p.heartRate != null) heartRates.push(p.heartRate);
    if (p.speed != null) speeds.push(p.speed);

    if (i === 0) continue;

    const prev = points[i - 1];
    distanceKm += haversineKm(prev.lat, prev.lon, p.lat, p.lon);

    if (prev.ele != null && p.ele != null) {
      const delta = p.ele - prev.ele;
      if (delta > 0) elevationGainM += delta;
      else elevationLossM += Math.abs(delta);
    }
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
    const d =
      prev.distanceKm +
      haversineKm(prev.lat, prev.lon, p.lat, p.lon);
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
