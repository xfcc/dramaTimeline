import { NextResponse } from "next/server";

import { getDramas, saveDramas } from "@/lib/data";
import { dramaSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const dramas = await getDramas();
  const drama = dramas.find((d) => d.id === id);

  if (!drama) {
    return NextResponse.json({ error: "未找到该剧集" }, { status: 404 });
  }

  return NextResponse.json(drama);
}

export async function PUT(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = await request.json();
  const result = dramaSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "校验失败", errors: result.error.issues },
      { status: 400 },
    );
  }

  const dramas = await getDramas();
  const index = dramas.findIndex((d) => d.id === id);

  if (index === -1) {
    return NextResponse.json({ error: "未找到该剧集" }, { status: 404 });
  }

  dramas[index] = { ...result.data, id };
  await saveDramas(dramas);

  return NextResponse.json(dramas[index]);
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const dramas = await getDramas();
  const filtered = dramas.filter((d) => d.id !== id);

  if (filtered.length === dramas.length) {
    return NextResponse.json({ error: "未找到该剧集" }, { status: 404 });
  }

  await saveDramas(filtered);
  return NextResponse.json({ success: true });
}
