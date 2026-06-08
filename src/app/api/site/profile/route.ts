import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import type { SiteProfile } from "@/lib/site-config";
import { getSiteProfile, saveSiteProfile } from "@/lib/site-profile-storage";

export const dynamic = "force-dynamic";

export async function GET() {
  const profile = await getSiteProfile();
  return NextResponse.json(profile);
}

export async function PUT(request: NextRequest) {
  const authError = requireAdmin();
  if (authError) return authError;

  try {
    const body = (await request.json()) as Partial<SiteProfile>;

    const profile = await saveSiteProfile({
      ownerName: String(body.ownerName ?? ""),
      siteTitle: String(body.siteTitle ?? ""),
      tagline: String(body.tagline ?? ""),
      bio: String(body.bio ?? ""),
      footer: String(body.footer ?? ""),
    });

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Failed to save site profile:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to save site settings.",
      },
      { status: 500 }
    );
  }
}
