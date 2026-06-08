import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import {
  blobDeleteClimb,
  blobGetClimb,
  blobHasClimbs,
  blobListClimbs,
  blobSaveClimb,
  blobSeedClimb,
  blobStorageEnabled,
} from "./blob-storage";
import { shouldSeedSampleClimb } from "./site-profile-storage";
import type { Climb, ClimbListItem, ClimbSummary } from "./types";

const DATA_DIR = path.join(process.cwd(), "data", "climbs");

export type StorageBackend = "blob" | "file" | "none";

export function getStorageBackend(): StorageBackend {
  if (blobStorageEnabled()) return "blob";
  if (process.env.VERCEL) return "none";
  return "file";
}

/** @deprecated use getStorageBackend */
export function storageBackend(): StorageBackend {
  return getStorageBackend();
}

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

function climbFilePath(id: string) {
  return path.join(DATA_DIR, `${id}.json`);
}

function toListItem(climb: Climb): ClimbListItem {
  const { points: _points, ...summary } = climb;
  return summary;
}

async function loadSampleClimb(): Promise<Climb | null> {
  const samplePath = path.join(process.cwd(), "data", "sample-climb.json");
  try {
    const raw = await fs.readFile(samplePath, "utf-8");
    return JSON.parse(raw) as Climb;
  } catch {
    return null;
  }
}

async function fileListClimbs(): Promise<ClimbListItem[]> {
  try {
    await ensureDataDir();
  } catch (error) {
    console.error("Failed to access local climb storage:", error);
    return [];
  }

  let files: string[];
  try {
    files = await fs.readdir(DATA_DIR);
  } catch {
    return [];
  }

  const climbs: ClimbListItem[] = [];

  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    try {
      const raw = await fs.readFile(path.join(DATA_DIR, file), "utf-8");
      const climb = JSON.parse(raw) as Climb;
      climbs.push(toListItem(climb));
    } catch {
      // skip invalid files
    }
  }

  return climbs.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

async function fileGetClimb(id: string): Promise<Climb | null> {
  try {
    const raw = await fs.readFile(climbFilePath(id), "utf-8");
    return JSON.parse(raw) as Climb;
  } catch {
    return null;
  }
}

async function fileSaveClimb(
  data: Omit<ClimbSummary, "id" | "createdAt"> & { points: Climb["points"] }
): Promise<Climb> {
  await ensureDataDir();

  const climb: Climb = {
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    ...data,
  };

  await fs.writeFile(climbFilePath(climb.id), JSON.stringify(climb, null, 2));
  return climb;
}

async function fileDeleteClimb(id: string): Promise<boolean> {
  try {
    await fs.unlink(climbFilePath(id));
    return true;
  } catch {
    return false;
  }
}

async function fileSeedSampleClimb(): Promise<Climb | null> {
  const climbs = await fileListClimbs();
  if (climbs.length > 0) return null;

  const sample = await loadSampleClimb();
  if (!sample) return null;

  try {
    await ensureDataDir();
    await fs.writeFile(climbFilePath(sample.id), JSON.stringify(sample, null, 2));
    return sample;
  } catch (error) {
    console.error("Failed to seed sample climb locally:", error);
    return null;
  }
}

export async function listClimbs(): Promise<ClimbListItem[]> {
  const backend = getStorageBackend();

  if (backend === "blob") {
    return blobListClimbs();
  }

  if (backend === "file") {
    return fileListClimbs();
  }

  return [];
}

export async function getClimb(id: string): Promise<Climb | null> {
  const backend = getStorageBackend();

  if (backend === "blob") {
    return blobGetClimb(id);
  }

  if (backend === "file") {
    return fileGetClimb(id);
  }

  return null;
}

export async function saveClimb(
  data: Omit<ClimbSummary, "id" | "createdAt"> & { points: Climb["points"] }
): Promise<Climb> {
  const backend = getStorageBackend();

  if (backend === "blob") {
    try {
      return await blobSaveClimb(data, uuidv4(), new Date().toISOString());
    } catch (error) {
      console.error("Failed to save climb to blob storage:", error);
      throw new Error(
        "Failed to save climb. Check that Vercel Blob storage is connected."
      );
    }
  }

  if (backend === "file") {
    return fileSaveClimb(data);
  }

  throw new Error(
    "Climb storage is not configured. Connect Vercel Blob storage to this project."
  );
}

export async function deleteClimb(id: string): Promise<boolean> {
  const backend = getStorageBackend();

  if (backend === "blob") {
    return blobDeleteClimb(id);
  }

  if (backend === "file") {
    return fileDeleteClimb(id);
  }

  return false;
}

export async function seedSampleClimb(): Promise<Climb | null> {
  if (!shouldSeedSampleClimb()) return null;

  const backend = getStorageBackend();

  if (backend === "none") {
    return null;
  }

  if (backend === "blob") {
    try {
      if (await blobHasClimbs()) return null;
      const sample = await loadSampleClimb();
      if (!sample) return null;
      return blobSeedClimb(sample);
    } catch (error) {
      console.error("Failed to seed sample climb:", error);
      return null;
    }
  }

  return fileSeedSampleClimb();
}
