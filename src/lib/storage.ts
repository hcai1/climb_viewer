import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import type { Climb, ClimbListItem, ClimbSummary } from "./types";

const DATA_DIR = path.join(process.cwd(), "data", "climbs");

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

function climbPath(id: string) {
  return path.join(DATA_DIR, `${id}.json`);
}

function toListItem(climb: Climb): ClimbListItem {
  const { points: _points, ...summary } = climb;
  return summary;
}

export async function listClimbs(): Promise<ClimbListItem[]> {
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

export async function getClimb(id: string): Promise<Climb | null> {
  await ensureDataDir();
  try {
    const raw = await fs.readFile(climbPath(id), "utf-8");
    return JSON.parse(raw) as Climb;
  } catch {
    return null;
  }
}

export async function saveClimb(
  data: Omit<ClimbSummary, "id" | "createdAt"> & { points: Climb["points"] }
): Promise<Climb> {
  await ensureDataDir();

  const climb: Climb = {
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    ...data,
  };

  await fs.writeFile(climbPath(climb.id), JSON.stringify(climb, null, 2));
  return climb;
}

export async function deleteClimb(id: string): Promise<boolean> {
  try {
    await fs.unlink(climbPath(id));
    return true;
  } catch {
    return false;
  }
}

export async function seedSampleClimb(): Promise<Climb | null> {
  const climbs = await listClimbs();
  if (climbs.length > 0) return null;

  const samplePath = path.join(process.cwd(), "data", "sample-climb.json");
  try {
    const raw = await fs.readFile(samplePath, "utf-8");
    const sample = JSON.parse(raw) as Climb;
    await fs.writeFile(climbPath(sample.id), JSON.stringify(sample, null, 2));
    return sample;
  } catch {
    return null;
  }
}
