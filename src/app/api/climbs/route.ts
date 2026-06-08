import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { computeBounds, computeStats, parseGpx } from "@/lib/gpx";
import { getStorageBackend, listClimbs, saveClimb, seedSampleClimb } from "@/lib/storage";

export const maxDuration = 60;

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Failed to process GPX file.";
}

export async function GET() {
  await seedSampleClimb();
  const climbs = await listClimbs();
  return NextResponse.json(climbs);
}

export async function POST(request: NextRequest) {
  const authError = requireAdmin();
  if (authError) return authError;

  if (getStorageBackend() === "none") {
    return NextResponse.json(
      {
        error:
          "Climb storage is not configured. Connect Vercel Blob storage to this project and redeploy.",
      },
      { status: 503 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("gpx");
    const name = String(formData.get("name") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const date = String(formData.get("date") ?? "").trim();

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "A GPX file is required." },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { error: "Climb name is required." },
        { status: 400 }
      );
    }

    const content = await file.text();

    let points;
    try {
      points = parseGpx(content);
    } catch {
      return NextResponse.json(
        { error: "Could not parse GPX file. Check that it is valid XML." },
        { status: 400 }
      );
    }

    if (points.length < 2) {
      return NextResponse.json(
        {
          error:
            "GPX file must contain at least 2 track or route points. Export a full activity track from your GPS app.",
        },
        { status: 400 }
      );
    }

    const stats = computeStats(points);
    const bounds = computeBounds(points);

    const climb = await saveClimb({
      name,
      description,
      date: date || new Date().toISOString().slice(0, 10),
      stats,
      bounds,
      pointCount: points.length,
      points,
    });

    return NextResponse.json(climb, { status: 201 });
  } catch (error) {
    console.error("Upload failed:", error);
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}
