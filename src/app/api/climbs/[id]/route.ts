import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { deleteClimb, getClimb } from "@/lib/storage";

type RouteContext = { params: { id: string } };

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
