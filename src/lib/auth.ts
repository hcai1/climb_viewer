import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const SESSION_COOKIE = "peak_paths_session";
const SESSION_MS = 30 * 24 * 60 * 60 * 1000;

function getSessionSecret(): string {
  return (
    process.env.SESSION_SECRET ||
    process.env.ADMIN_PASSWORD ||
    "change-me-in-production"
  );
}

export function getAdminPassword(): string | null {
  const password = process.env.ADMIN_PASSWORD?.trim();
  return password || null;
}

export function getAdminConfigError(): string {
  if (getAdminPassword()) return "";

  if (process.env.VERCEL) {
    return (
      "Admin password is not configured on Vercel. Open your project in the Vercel dashboard → Settings → Environment Variables, add ADMIN_PASSWORD (and SESSION_SECRET), then redeploy."
    );
  }

  return "Admin password is not configured. Add ADMIN_PASSWORD to .env.local and restart the dev server.";
}

function sign(payload: string): string {
  return createHmac("sha256", getSessionSecret())
    .update(payload)
    .digest("base64url");
}

export function createSessionToken(): string {
  const payload = Buffer.from(
    JSON.stringify({ role: "admin", exp: Date.now() + SESSION_MS })
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;

  const dot = token.lastIndexOf(".");
  if (dot <= 0) return false;

  const payload = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  const expected = sign(payload);

  try {
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  } catch {
    return false;
  }

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return data.role === "admin" && typeof data.exp === "number" && data.exp > Date.now();
  } catch {
    return false;
  }
}

export function isAdmin(): boolean {
  const token = cookies().get(SESSION_COOKIE)?.value;
  return verifySessionToken(token);
}

export function requireAdmin(): NextResponse | null {
  if (!getAdminPassword()) {
    return NextResponse.json(
      { error: getAdminConfigError() },
      { status: 503 }
    );
  }

  if (!isAdmin()) {
    return NextResponse.json(
      { error: "Sign in required to upload climbs." },
      { status: 401 }
    );
  }

  return null;
}

export function sessionCookieOptions(maxAge = SESSION_MS / 1000) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export function verifyAdminPassword(password: string): boolean {
  const expected = getAdminPassword();
  if (!expected) return false;

  try {
    const a = Buffer.from(password);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
