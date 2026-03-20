import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { Drama, Dynasty } from "@/types";

const DATA_DIR = path.resolve(process.cwd(), "..", "data");

async function readJson<T>(filename: string): Promise<T> {
  const raw = await readFile(path.join(DATA_DIR, filename), "utf-8");
  return JSON.parse(raw) as T;
}

async function writeJson<T>(filename: string, data: T): Promise<void> {
  const filePath = path.join(DATA_DIR, filename);
  await writeFile(filePath, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

export async function getDynasties(): Promise<Dynasty[]> {
  return readJson<Dynasty[]>("dynasties.json");
}

export async function saveDynasties(dynasties: Dynasty[]): Promise<void> {
  return writeJson("dynasties.json", dynasties);
}

export async function getDramas(): Promise<Drama[]> {
  return readJson<Drama[]>("dramas.json");
}

export async function saveDramas(dramas: Drama[]): Promise<void> {
  return writeJson("dramas.json", dramas);
}
