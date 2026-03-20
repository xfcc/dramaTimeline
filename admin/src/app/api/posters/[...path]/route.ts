import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import path from "node:path";

const POSTER_DIR = path.resolve(process.cwd(), "..", "public", "posters");

const MIME: Record<string, string> = {
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
};

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { path: segments } = await ctx.params;
  const filePath = path.join(POSTER_DIR, ...segments);

  // Prevent directory traversal
  if (!filePath.startsWith(POSTER_DIR)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const buffer = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME[ext] ?? "application/octet-stream";

    return new Response(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-cache",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
