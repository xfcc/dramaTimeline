import { NextResponse } from "next/server";

import { getDynasties, saveDynasties, getDramas } from "@/lib/data";
import { dynastySchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const dynasties = await getDynasties();
  const dynasty = dynasties.find((d) => d.id === id);

  if (!dynasty) {
    return NextResponse.json({ error: "未找到该朝代" }, { status: 404 });
  }

  return NextResponse.json(dynasty);
}

export async function PUT(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = await request.json();
  const result = dynastySchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "校验失败", errors: result.error.issues },
      { status: 400 },
    );
  }

  const dynasties = await getDynasties();
  const index = dynasties.findIndex((d) => d.id === id);

  if (index === -1) {
    return NextResponse.json({ error: "未找到该朝代" }, { status: 404 });
  }

  dynasties[index] = { ...result.data, id };
  await saveDynasties(dynasties);

  return NextResponse.json(dynasties[index]);
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const [dynasties, dramas] = await Promise.all([getDynasties(), getDramas()]);

  const referencingDramas = dramas.filter((d) => d.dynasty_id === id);
  if (referencingDramas.length > 0) {
    return NextResponse.json(
      {
        error: `无法删除：有 ${referencingDramas.length} 部剧集引用此朝代`,
      },
      { status: 409 },
    );
  }

  const childDynasties = dynasties.filter((d) => d.parent_id === id);
  if (childDynasties.length > 0) {
    return NextResponse.json(
      {
        error: `无法删除：有 ${childDynasties.length} 个子朝代引用此朝代`,
      },
      { status: 409 },
    );
  }

  const filtered = dynasties.filter((d) => d.id !== id);
  if (filtered.length === dynasties.length) {
    return NextResponse.json({ error: "未找到该朝代" }, { status: 404 });
  }

  await saveDynasties(filtered);
  return NextResponse.json({ success: true });
}
