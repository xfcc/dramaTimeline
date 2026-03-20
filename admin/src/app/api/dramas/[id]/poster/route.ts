import { NextResponse } from "next/server";
import { mkdir, unlink } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

import { getDramas, saveDramas } from "@/lib/data";

const POSTER_DIR = path.resolve(process.cwd(), "..", "public", "posters");

const SIZES = [
  { name: "thumb", width: 120, height: 180, quality: 80 },
  { name: "medium", width: 240, height: 360, quality: 85 },
  { name: "large", width: 480, height: 720, quality: 90 },
] as const;

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;

  const dramas = await getDramas();
  if (!dramas.some((d) => d.id === id)) {
    return NextResponse.json({ error: "剧集不存在" }, { status: 404 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "请求格式无效" },
      { status: 400 },
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "未找到图片文件" }, { status: 400 });
  }

  const cropDataRaw = formData.get("cropData");
  if (typeof cropDataRaw !== "string") {
    return NextResponse.json({ error: "缺少裁剪参数" }, { status: 400 });
  }

  let cropData: { x: number; y: number; width: number; height: number };
  try {
    cropData = JSON.parse(cropDataRaw);
  } catch {
    return NextResponse.json(
      { error: "裁剪参数格式无效" },
      { status: 400 },
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());

    const cropped = sharp(buffer).extract({
      left: Math.max(0, Math.round(cropData.x)),
      top: Math.max(0, Math.round(cropData.y)),
      width: Math.round(cropData.width),
      height: Math.round(cropData.height),
    });

    // Save original cropped version
    const originalDir = path.join(POSTER_DIR, "original");
    await mkdir(originalDir, { recursive: true });
    await cropped
      .clone()
      .webp({ quality: 95 })
      .toFile(path.join(originalDir, `${id}.webp`));

    // Generate each target size
    for (const size of SIZES) {
      const dir = path.join(POSTER_DIR, size.name);
      await mkdir(dir, { recursive: true });
      await cropped
        .clone()
        .resize(size.width, size.height, { fit: "cover" })
        .webp({ quality: size.quality })
        .toFile(path.join(dir, `${id}.webp`));
    }

    // Update poster_url in dramas.json
    const posterUrl = `/posters/medium/${id}.webp`;
    const freshDramas = await getDramas();
    const index = freshDramas.findIndex((d) => d.id === id);
    if (index !== -1) {
      freshDramas[index].poster_url = posterUrl;
      await saveDramas(freshDramas);
    }

    return NextResponse.json({
      poster_url: posterUrl,
      sizes: SIZES.map((s) => ({
        name: s.name,
        width: s.width,
        height: s.height,
      })),
    });
  } catch (err) {
    console.error("Poster processing error:", err);
    return NextResponse.json(
      { error: "图片处理失败，请确认文件格式正确" },
      { status: 500 },
    );
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;

  const dirs = ["thumb", "medium", "large", "original"];
  for (const dir of dirs) {
    try {
      await unlink(path.join(POSTER_DIR, dir, `${id}.webp`));
    } catch {
      // File may not exist — that's fine
    }
  }

  const dramas = await getDramas();
  const index = dramas.findIndex((d) => d.id === id);
  if (index !== -1) {
    dramas[index].poster_url = null;
    await saveDramas(dramas);
  }

  return NextResponse.json({ success: true });
}
