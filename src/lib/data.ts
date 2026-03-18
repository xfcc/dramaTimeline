import { readFile } from "node:fs/promises";
import path from "node:path";

import type { Drama, Dynasty } from "@/types";

const DATA_DIR = path.join(process.cwd(), "data");

async function readJsonFile<T>(filename: string): Promise<T> {
  const filePath = path.join(DATA_DIR, filename);
  const raw = await readFile(filePath, "utf-8");
  return JSON.parse(raw) as T;
}

export async function getDynasties(): Promise<Dynasty[]> {
  return await readJsonFile<Dynasty[]>("dynasties.json");
}

export async function getDramas(): Promise<Drama[]> {
  return await readJsonFile<Drama[]>("dramas.json");
}

