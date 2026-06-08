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

async function readBlobProfile(): Promise<SiteProfile | null> {
  if (!blobStorageEnabled()) return null;

  try {
    const result = await get(PROFILE_BLOB_PATH, { access: blobAccess() });
    if (!result || result.statusCode !== 200 || !result.stream) return null;

    const text = await new Response(result.stream).text();
    return JSON.parse(text) as SiteProfile;
  } catch {
    return null;
  }
}

async function writeBlobProfile(profile: SiteProfile) {
  const body = JSON.stringify(profile, null, 2);
  const access = blobAccess();

  try {
    await put(PROFILE_BLOB_PATH, body, {
      access,
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (access === "private" && message.toLowerCase().includes("access")) {
      await put(PROFILE_BLOB_PATH, body, {
        access: "public",
        contentType: "application/json",
        addRandomSuffix: false,
        allowOverwrite: true,
      });
      return;
    }
    throw error;
  }
}

async function readFileProfile(): Promise<SiteProfile | null> {
  try {
    const raw = await fs.readFile(PROFILE_FILE_PATH, "utf-8");
    return JSON.parse(raw) as SiteProfile;
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
    return mergeSiteProfile(await readBlobProfile(), defaults);
  }

  if (process.env.VERCEL) {
    return defaults;
  }

  return mergeSiteProfile(await readFileProfile(), defaults);
}

export async function saveSiteProfile(profile: SiteProfile): Promise<SiteProfile> {
  const merged = mergeSiteProfile(profile, getDefaultSiteProfile());

  if (blobStorageEnabled()) {
    await writeBlobProfile(merged);
    return merged;
  }

  if (process.env.VERCEL) {
    throw new Error(
      "Connect Vercel Blob storage before saving site settings."
    );
  }

  await writeFileProfile(merged);
  return merged;
}

export function shouldSeedSampleClimb(): boolean {
  if (process.env.SEED_SAMPLE_CLIMB === "false") return false;
  if (process.env.NEXT_PUBLIC_SITE_OWNER_NAME?.trim()) return false;
  return true;
}
