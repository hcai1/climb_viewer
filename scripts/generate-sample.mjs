/**
 * Run once: node scripts/generate-sample.mjs
 * Generates data/sample-climb.json with a demo Mount Washington route.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const start = { lat: 44.257, lon: -71.441, ele: 610 };
const end = { lat: 44.2705, lon: -71.3034, ele: 1917 };
const count = 72;

const points = [];

for (let i = 0; i < count; i++) {
  const t = i / (count - 1);
  const lat = start.lat + (end.lat - start.lat) * t + Math.sin(t * 8) * 0.002;
  const lon = start.lon + (end.lon - start.lon) * t + Math.cos(t * 6) * 0.003;
  const ele =
    start.ele +
    (end.ele - start.ele) * Math.pow(t, 1.15) +
    Math.sin(t * 12) * 15;

  const baseHr = 95 + t * 75;
  const heartRate = Math.round(baseHr + Math.sin(t * 20) * 12);

  const startTime = new Date("2024-09-14T06:30:00Z");
  startTime.setMinutes(startTime.getMinutes() + i * 6);

  points.push({
    lat: Math.round(lat * 1e6) / 1e6,
    lon: Math.round(lon * 1e6) / 1e6,
    ele: Math.round(ele),
    time: startTime.toISOString(),
    heartRate,
    speed: Math.round((1.2 + t * 0.4 + Math.random() * 0.2) * 100) / 100,
    cadence: Math.round(70 + t * 15 + Math.random() * 10),
    temperature: Math.round(8 - t * 12 + Math.random() * 2),
  });
}

function haversineKm(lat1, lon1, lat2, lon2) {
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

let distanceKm = 0;
let gain = 0;
const heartRates = points.map((p) => p.heartRate);

for (let i = 1; i < points.length; i++) {
  distanceKm += haversineKm(
    points[i - 1].lat,
    points[i - 1].lon,
    points[i].lat,
    points[i].lon
  );
  const d = points[i].ele - points[i - 1].ele;
  if (d > 0) gain += d;
}

const lats = points.map((p) => p.lat);
const lons = points.map((p) => p.lon);
const eles = points.map((p) => p.ele);

const sample = {
  id: "sample-mount-washington",
  name: "Mount Washington via Tuckerman Ravine",
  description:
    "Sample climb — a classic New Hampshire summit day with steep alpine terrain and big elevation gain.",
  date: "2024-09-14",
  createdAt: new Date().toISOString(),
  stats: {
    distanceKm: Math.round(distanceKm * 100) / 100,
    elevationGainM: Math.round(gain),
    elevationLossM: 0,
    maxElevationM: Math.max(...eles),
    minElevationM: Math.min(...eles),
    durationSeconds: (count - 1) * 6 * 60,
    avgHeartRate: Math.round(
      heartRates.reduce((a, b) => a + b, 0) / heartRates.length
    ),
    maxHeartRate: Math.max(...heartRates),
    avgSpeedKmh: 2.8,
    maxSpeedKmh: 4.2,
  },
  bounds: {
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
    minLon: Math.min(...lons),
    maxLon: Math.max(...lons),
  },
  pointCount: points.length,
  points,
};

const out = path.join(__dirname, "..", "data", "sample-climb.json");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(sample, null, 2));
console.log("Wrote", out);
