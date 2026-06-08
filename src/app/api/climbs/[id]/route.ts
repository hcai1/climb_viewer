import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { computeBounds, computeStats, parseGpx } from "@/lib/gpx";
import { deleteClimb, getClimb, updateClimb } from "@/lib/storage";

export const dynamic = "force-dynamic";

type RouteContext = { params: { id: string } };

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Failed to update climb.";
}

export async function GET(
  _request: NextRequest,
  { params }: RouteContext
) {
  const { id } = params;
  const climb = await getClimb(id);

  if (!climb) {
    return NextResponse.json({ error: "Climb not found." }, { status: 404 });
  }

  return NextResponse.json(climb);
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext
) {
  const authError = requireAdmin();
  if (authError) return authError;

  const { id } = params;
  const existing = await getClimb(id);

  if (!existing) {
    return NextResponse.json({ error: "Climb not found." }, { status: 404 });
  }

  try {
    const formData = await request.formData();
    const name = String(formData.get("name") ?? existing.name).trim();
    const description = String(
      formData.get("description") ?? existing.description
    ).trim();
    const date = String(formData.get("date") ?? existing.date).trim();
    const file = formData.get("gpx");

    if (!name) {
      return NextResponse.json(
        { error: "Climb name is required." },
        { status: 400 }
      );
    }

    let points = existing.points;
    let stats = existing.stats;
    let bounds = existing.bounds;
    let pointCount = existing.pointCount;

    if (file instanceof File && file.size > 0) {
      const content = await file.text();
      let parsed;

      try {
        parsed = parseGpx(content);
      } catch {
        return NextResponse.json(
          { error: "Could not parse GPX file. Check that it is valid XML." },
          { status: 400 }
        );
      }

      if (parsed.length < 2) {
        return NextResponse.json(
          { error: "GPX file must contain at least 2 track or route points." },
          { status: 400 }
        );
      }

      points = parsed;
      stats = computeStats(points);
      bounds = computeBounds(points);
      pointCount = points.length;
    }

    const climb = await updateClimb({
      ...existing,
      name,
      description,
      date: date || existing.date,
      stats,
      bounds,
      pointCount,
      points,
    });

    return NextResponse.json(climb);
  } catch (error) {
    console.error("Update climb failed:", error);
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: RouteContext
) {
  const authError = requireAdmin();
  if (authError) return authError;

  const { id } = params;
  const deleted = await deleteClimb(id);

  if (!deleted) {
    return NextResponse.json({ error: "Climb not found." }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
