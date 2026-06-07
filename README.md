# Peak Paths

Showcase your mountain climbs with interactive 3D terrain, GPX route overlays, elevation profiles, and fitness stats.

## Features

- **GPX upload** — drag and drop `.gpx` files from Garmin, Strava exports, or any GPS app
- **3D mountain view** — Mapbox terrain with your route traced on the landscape (rotate, zoom, pitch)
- **Stats dashboard** — distance, elevation gain, duration, heart rate, speed
- **Charts** — elevation profile and heart rate over distance

## Requirements

- **Node.js 18.17+** for running the dev server (20 LTS recommended) — [nodejs.org](https://nodejs.org/)
- **Mapbox token** (free) — [account.mapbox.com/access-tokens](https://account.mapbox.com/access-tokens/)

## Setup

> **Windows note:** If `npm install` fails silently in PowerShell, double-click `install.cmd` or run:
> ```powershell
> cmd /c npm install
> ```
> Or: `.\install.ps1`

1. Open a terminal in this folder:

```powershell
cd C:\Users\harve\peak-paths
```

2. Install dependencies:

```powershell
npm install
```

If that fails with no output, use one of these instead:

```powershell
.\install.ps1
# or
cmd /c npm install
# or double-click install.cmd in File Explorer
```

3. **Upgrade Node.js** if `npm run dev` says you need v18.17+ (you have 18.16.1). Get **20 LTS** from [nodejs.org](https://nodejs.org/) — pick the **64-bit** installer, not x86.

4. Copy the environment file and add your Mapbox token:

```powershell
copy .env.example .env.local
```

Edit `.env.local`:

```
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_token_here
```

4. Start the dev server:

```powershell
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

A sample **Mount Washington** climb is included and loads automatically on first visit.

## Usage

1. Click **Upload GPX** and add your track file with a name and date.
2. Open any climb card to see the 3D map, summary stats, and charts.
3. Share the climb URL — each climb has its own page at `/climbs/[id]`.

## GPX data supported

- Track points: latitude, longitude, elevation, timestamps
- Garmin extensions: heart rate (`gpxtpx:hr`), cadence, temperature, speed

## Project structure

```
peak-paths/
├── src/app/           # Pages and API routes
├── src/components/    # 3D map, charts, upload form
├── src/lib/           # GPX parser, storage, types
└── data/climbs/       # Uploaded climb JSON (gitignored)
```

## Tech stack

Next.js 14 · React 18 · TypeScript · Tailwind CSS · Mapbox GL JS · Recharts
