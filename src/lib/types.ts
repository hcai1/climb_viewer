export interface TrackPoint {
  lat: number;
  lon: number;
  ele: number | null;
  time: string | null;
  heartRate: number | null;
  speed: number | null;
  cadence: number | null;
  temperature: number | null;
  /** Cumulative distance from device extensions (meters), when present in GPX. */
  cumulativeDistanceM?: number | null;
}

export interface ClimbStats {
  distanceKm: number;
  elevationGainM: number;
  elevationLossM: number;
  maxElevationM: number | null;
  minElevationM: number | null;
  durationSeconds: number | null;
  avgHeartRate: number | null;
  maxHeartRate: number | null;
  avgSpeedKmh: number | null;
  maxSpeedKmh: number | null;
}

export interface ClimbBounds {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}

export interface ClimbSummary {
  id: string;
  name: string;
  description: string;
  date: string;
  createdAt: string;
  stats: ClimbStats;
  bounds: ClimbBounds;
  pointCount: number;
}

export interface Climb extends ClimbSummary {
  points: TrackPoint[];
}

export interface ClimbListItem extends ClimbSummary {}
