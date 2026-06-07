import { NextRequest, NextResponse } from "next/server";
import {
  createSessionToken,
  getAdminConfigError,
  getAdminPassword,
  sessionCookieOptions,
  SESSION_COOKIE,
  verifyAdminPassword,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  if (!getAdminPassword()) {
    return NextResponse.json({ error: getAdminConfigError() }, { status: 503 });
  }

  let password = "";
  try {
    const body = await request.json();
    password = String(body.password ?? "");
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!verifyAdminPassword(password)) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(
    SESSION_COOKIE,
    createSessionToken(),
    sessionCookieOptions()
  );
  return response;
}
