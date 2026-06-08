import { del, get, list, put } from "@vercel/blob";
import type { Climb, ClimbListItem, ClimbSummary } from "./types";

const MANIFEST_PATH = "climbs/manifest.json";

function climbPath(id: string) {
  return `climbs/${id}.json`;
}

/** Detect Blob whether using legacy token or Vercel OIDC (BLOB_STORE_ID). */
export function blobStorageEnabled() {
  return Boolean(
    process.env.BLOB_READ_WRITE_TOKEN?.trim() ||
      process.env.BLOB_STORE_ID?.trim()
  );
}

/** Match your Blob store type in Vercel (new stores default to private). */
function blobAccess(): "public" | "private" {
  return process.env.BLOB_ACCESS === "public" ? "public" : "private";
}

function putOptions() {
  return {
    access: blobAccess(),
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  } as const;
}

async function readBlobJson<T>(pathname: string): Promise<T | null> {
  try {
    const result = await get(pathname, { access: blobAccess() });
    if (result.statusCode !== 200 || !result.stream) return null;

    const text = await new Response(result.stream).text();
    return JSON.parse(text) as T;
  } catch (error) {
    console.error(`Failed to read blob ${pathname}:`, error);
    return null;
  }
}

async function writeBlobJson(pathname: string, data: unknown) {
  const body = JSON.stringify(data);
  const access = blobAccess();

  try {
    await put(pathname, body, putOptions());
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    // Retry with the other access mode if store type doesn't match our default.
    if (access === "private" && message.toLowerCase().includes("access")) {
      await put(pathname, body, { ...putOptions(), access: "public" });
      return;
    }

    throw error;
  }
}

async function readManifest(): Promise<ClimbListItem[]> {
  return (await readBlobJson<ClimbListItem[]>(MANIFEST_PATH)) ?? [];
}

async function writeManifest(items: ClimbListItem[]) {
  await writeBlobJson(
    MANIFEST_PATH,
    items.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  );
}

function toListItem(climb: Climb): ClimbListItem {
  const { points: _points, ...summary } = climb;
  return summary;
}

export async function blobListClimbs(): Promise<ClimbListItem[]> {
  if (!blobStorageEnabled()) return [];
  try {
    return await readManifest();
  } catch (error) {
    console.error("Failed to list climbs from blob storage:", error);
    return [];
  }
}

export async function blobGetClimb(id: string): Promise<Climb | null> {
  if (!blobStorageEnabled()) return null;
  try {
    return await readBlobJson<Climb>(climbPath(id));
  } catch (error) {
    console.error(`Failed to read climb ${id} from blob storage:`, error);
    return null;
  }
}

export async function blobSaveClimb(
  data: Omit<ClimbSummary, "id" | "createdAt"> & { points: Climb["points"] },
  id: string,
  createdAt: string
): Promise<Climb> {
  const climb: Climb = { id, createdAt, ...data };
  await writeBlobJson(climbPath(climb.id), climb);

  const manifest = await readManifest();
  const summary = toListItem(climb);
  const next = [summary, ...manifest.filter((item) => item.id !== climb.id)];
  await writeManifest(next);

  return climb;
}

export async function blobDeleteClimb(id: string): Promise<boolean> {
  if (!blobStorageEnabled()) return false;

  try {
    const pathname = climbPath(id);
    const { blobs } = await list({ prefix: pathname, limit: 10 });
    const blob = blobs.find((entry) => entry.pathname === pathname);

    if (blob) {
      await del(blob.url);
    }

    const manifest = await readManifest();
    const next = manifest.filter((item) => item.id !== id);
    await writeManifest(next);

    return true;
  } catch (error) {
    console.error(`Failed to delete climb ${id} from blob storage:`, error);
    return false;
  }
}

export async function blobSeedClimb(climb: Climb): Promise<Climb | null> {
  try {
    await writeBlobJson(climbPath(climb.id), climb);
    await writeManifest([toListItem(climb)]);
    return climb;
  } catch (error) {
    console.error("Failed to seed sample climb to blob storage:", error);
    return null;
  }
}

export async function blobHasClimbs(): Promise<boolean> {
  try {
    const manifest = await readManifest();
    return manifest.length > 0;
  } catch {
    return false;
  }
}
