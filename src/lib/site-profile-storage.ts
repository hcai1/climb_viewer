import { get, put } from "@vercel/blob";
import fs from "fs/promises";
import path from "path";
import { blobStorageEnabled } from "./blob-storage";
import {
  getDefaultSiteProfile,
  mergeSiteProfile,
  type SiteProfile,
} from "./site-config";

const PROFILE_BLOB_PATH = "site/profile.json";
const PROFILE_FILE_PATH = path.join(process.cwd(), "data", "site-profile.json");

function blobAccess(): "public" | "private" {
  return process.env.BLOB_ACCESS === "public" ? "public" : "private";
}

function putOptions(access: "public" | "private") {
  return {
    access,
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  } as const;
}

function normalizeProfile(profile: SiteProfile): SiteProfile {
  return {
    ownerName: profile.ownerName.trim(),
    siteTitle: profile.siteTitle.trim(),
    tagline: profile.tagline.trim(),
    bio: profile.bio.trim(),
    footer: profile.footer.trim(),
  };
}

async function readBlobProfile(): Promise<SiteProfile | null> {
  if (!blobStorageEnabled()) return null;

  const modes: Array<"private" | "public"> =
    blobAccess() === "public" ? ["public", "private"] : ["private", "public"];

  for (const access of modes) {
    try {
      const result = await get(PROFILE_BLOB_PATH, { access });
      if (!result || result.statusCode !== 200 || !result.stream) continue;

      const text = await new Response(result.stream).text();
      return normalizeProfile(JSON.parse(text) as SiteProfile);
    } catch (error) {
      console.error(`Failed to read site profile (${access}):`, error);
    }
  }

  return null;
}

async function writeBlobProfile(profile: SiteProfile) {
  const body = JSON.stringify(profile, null, 2);
  const access = blobAccess();

  try {
    await put(PROFILE_BLOB_PATH, body, putOptions(access));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (access === "private" && message.toLowerCase().includes("access")) {
      await put(PROFILE_BLOB_PATH, body, putOptions("public"));
      return;
    }
    throw error;
  }
}

async function readFileProfile(): Promise<SiteProfile | null> {
  try {
    const raw = await fs.readFile(PROFILE_FILE_PATH, "utf-8");
    return normalizeProfile(JSON.parse(raw) as SiteProfile);
  } catch {
    return null;
  }
}

async function writeFileProfile(profile: SiteProfile) {
  await fs.mkdir(path.dirname(PROFILE_FILE_PATH), { recursive: true });
  await fs.writeFile(PROFILE_FILE_PATH, JSON.stringify(profile, null, 2));
}

export async function getSiteProfile(): Promise<SiteProfile> {
  const defaults = getDefaultSiteProfile();

  if (blobStorageEnabled()) {
    const stored = await readBlobProfile();
    if (stored) return mergeSiteProfile(stored, defaults);
    return defaults;
  }

  if (process.env.VERCEL) {
    return defaults;
  }

  const stored = await readFileProfile();
  if (stored) return mergeSiteProfile(stored, defaults);
  return defaults;
}

export async function saveSiteProfile(profile: SiteProfile): Promise<SiteProfile> {
  const cleaned = normalizeProfile(profile);

  if (!cleaned.ownerName || !cleaned.siteTitle || !cleaned.tagline || !cleaned.bio) {
    throw new Error("Name, site title, tagline, and bio are required.");
  }

  if (blobStorageEnabled()) {
    await writeBlobProfile(cleaned);

    const saved = await readBlobProfile();
    if (!saved) {
      throw new Error("Settings were saved but could not be read back. Check Blob storage access.");
    }

    return saved;
  }

  if (process.env.VERCEL) {
    throw new Error(
      "Connect Vercel Blob storage before saving site settings."
    );
  }

  await writeFileProfile(cleaned);
  return cleaned;
}

export function shouldSeedSampleClimb(): boolean {
  if (process.env.SEED_SAMPLE_CLIMB === "false") return false;
  if (process.env.NEXT_PUBLIC_SITE_OWNER_NAME?.trim()) return false;
  return true;
}
