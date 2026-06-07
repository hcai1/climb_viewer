"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { ClimbBounds, TrackPoint } from "@/lib/types";
import { buildRouteGeoJson } from "@/lib/gpx";

interface ClimbMap3DProps {
  points: TrackPoint[];
  bounds: ClimbBounds;
}

export default function ClimbMap3D({ points, bounds }: ClimbMap3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [tokenMissing, setTokenMissing] = useState(false);

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token || token === "your_mapbox_token_here") {
      setTokenMissing(true);
      return;
    }

    if (!containerRef.current || mapRef.current) return;

    mapboxgl.accessToken = token;

    const centerLon = (bounds.minLon + bounds.maxLon) / 2;
    const centerLat = (bounds.minLat + bounds.maxLat) / 2;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/outdoors-v12",
      center: [centerLon, centerLat],
      zoom: 11,
      pitch: 65,
      bearing: -20,
      antialias: true,
    });

    mapRef.current = map;

    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }));
    map.addControl(new mapboxgl.FullscreenControl());

    map.on("load", () => {
      map.addSource("mapbox-dem", {
        type: "raster-dem",
        url: "mapbox://mapbox.mapbox-terrain-dem-v1",
        tileSize: 512,
        maxzoom: 14,
      });

      map.setTerrain({ source: "mapbox-dem", exaggeration: 1.6 });

      map.addLayer({
        id: "sky",
        type: "sky",
        paint: {
          "sky-type": "atmosphere",
          "sky-atmosphere-sun": [0.0, 90.0],
          "sky-atmosphere-sun-intensity": 12,
        },
      });

      const route = buildRouteGeoJson(points);

      map.addSource("route", {
        type: "geojson",
        lineMetrics: true,
        data: route,
      });

      map.addLayer({
        id: "route-glow",
        type: "line",
        source: "route",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#fbbf24",
          "line-width": 8,
          "line-opacity": 0.35,
          "line-emissive-strength": 1,
        },
      });

      map.addLayer({
        id: "route-line",
        type: "line",
        source: "route",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#f59e0b",
          "line-width": 4,
          "line-emissive-strength": 1,
        },
      });

      const start = points[0];
      const end = points[points.length - 1];

      new mapboxgl.Marker({ color: "#22c55e" })
        .setLngLat([start.lon, start.lat])
        .setPopup(new mapboxgl.Popup().setHTML("<strong>Start</strong>"))
        .addTo(map);

      new mapboxgl.Marker({ color: "#ef4444" })
        .setLngLat([end.lon, end.lat])
        .setPopup(new mapboxgl.Popup().setHTML("<strong>Summit / End</strong>"))
        .addTo(map);

      const padding = 80;
      map.fitBounds(
        [
          [bounds.minLon, bounds.minLat],
          [bounds.maxLon, bounds.maxLat],
        ],
        { padding, pitch: 65, duration: 1500 }
      );
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [points, bounds]);

  if (tokenMissing) {
    return (
      <div className="flex h-full min-h-[420px] flex-col items-center justify-center rounded-2xl border border-amber-500/30 bg-mountain-900/80 p-8 text-center">
        <p className="text-lg font-medium text-summit-400">Mapbox token required</p>
        <p className="mt-2 max-w-md text-sm text-mountain-300">
          Copy <code className="text-summit-400">.env.example</code> to{" "}
          <code className="text-summit-400">.env.local</code> and add your free
          token from{" "}
          <a
            href="https://account.mapbox.com/access-tokens/"
            target="_blank"
            rel="noreferrer"
            className="text-summit-400 underline"
          >
            mapbox.com
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-full min-h-[420px] w-full overflow-hidden rounded-2xl border border-mountain-700/50 shadow-2xl shadow-black/40"
    />
  );
}
