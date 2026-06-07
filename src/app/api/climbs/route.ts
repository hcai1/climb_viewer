import { NextRequest, NextResponse } from "next/server";
import { computeBounds, computeStats, parseGpx } from "@/lib/gpx";
import { listClimbs, saveClimb, seedSampleClimb } from "@/lib/storage";

export async function GET() {
  await seedSampleClimb();
  const climbs = await listClimbs();
  return NextResponse.json(climbs);
}

export async function POST(request: NextRequest) {
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
    const points = parseGpx(content);

    if (points.length < 2) {
      return NextResponse.json(
        { error: "GPX file must contain at least 2 track points." },
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
    return NextResponse.json(
      { error: "Failed to process GPX file." },
      { status: 500 }
    );
  }
}
