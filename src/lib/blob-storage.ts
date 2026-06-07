import { del, list, put } from "@vercel/blob";
import type { Climb, ClimbListItem, ClimbSummary } from "./types";

const MANIFEST_PATH = "climbs/manifest.json";

function climbPath(id: string) {
  return `climbs/${id}.json`;
}

function useBlobStorage() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

async function readBlobJson<T>(pathname: string): Promise<T | null> {
  const { blobs } = await list({ prefix: pathname, limit: 10 });
  const blob = blobs.find((entry) => entry.pathname === pathname);
  if (!blob) return null;

  const response = await fetch(blob.url, { cache: "no-store" });
  if (!response.ok) return null;

  return response.json() as Promise<T>;
}

async function writeBlobJson(pathname: string, data: unknown) {
  await put(pathname, JSON.stringify(data), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
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

export function blobStorageEnabled() {
  return useBlobStorage();
}

export async function blobListClimbs(): Promise<ClimbListItem[]> {
  if (!useBlobStorage()) return [];
  return readManifest();
}

export async function blobGetClimb(id: string): Promise<Climb | null> {
  if (!useBlobStorage()) return null;
  return readBlobJson<Climb>(climbPath(id));
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
  if (!useBlobStorage()) return false;

  const { blobs } = await list({ prefix: climbPath(id), limit: 1 });
  const blob = blobs.find((entry) => entry.pathname === climbPath(id));
  if (!blob) return false;

  await del(blob.url);

  const manifest = await readManifest();
  const next = manifest.filter((item) => item.id !== id);
  await writeManifest(next);

  return true;
}

export async function blobSeedClimb(climb: Climb): Promise<Climb> {
  await writeBlobJson(climbPath(climb.id), climb);
  await writeManifest([toListItem(climb)]);
  return climb;
}

export async function blobHasClimbs(): Promise<boolean> {
  const manifest = await readManifest();
  return manifest.length > 0;
}
