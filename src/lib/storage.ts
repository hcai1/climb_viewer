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
import type { Climb, ClimbListItem, ClimbSummary } from "./types";

const DATA_DIR = path.join(process.cwd(), "data", "climbs");

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
  await ensureDataDir();
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
  await ensureDataDir();
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

  await fs.writeFile(climbFilePath(sample.id), JSON.stringify(sample, null, 2));
  return sample;
}

export function storageBackend() {
  return blobStorageEnabled() ? "blob" : "file";
}

export async function listClimbs(): Promise<ClimbListItem[]> {
  if (blobStorageEnabled()) return blobListClimbs();
  return fileListClimbs();
}

export async function getClimb(id: string): Promise<Climb | null> {
  if (blobStorageEnabled()) return blobGetClimb(id);
  return fileGetClimb(id);
}

export async function saveClimb(
  data: Omit<ClimbSummary, "id" | "createdAt"> & { points: Climb["points"] }
): Promise<Climb> {
  if (blobStorageEnabled()) {
    return blobSaveClimb(data, uuidv4(), new Date().toISOString());
  }
  return fileSaveClimb(data);
}

export async function deleteClimb(id: string): Promise<boolean> {
  if (blobStorageEnabled()) return blobDeleteClimb(id);
  return fileDeleteClimb(id);
}

export async function seedSampleClimb(): Promise<Climb | null> {
  if (blobStorageEnabled()) {
    if (await blobHasClimbs()) return null;
    const sample = await loadSampleClimb();
    if (!sample) return null;
    return blobSeedClimb(sample);
  }

  return fileSeedSampleClimb();
}
