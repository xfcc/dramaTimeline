import { NextResponse } from "next/server";

import { getDramas, getDynasties, saveDramas } from "@/lib/data";
import { validateDramaCrossFields } from "@/lib/quality";
import { dramaSchema } from "@/lib/validation";

export async function GET() {
  const dramas = await getDramas();
  return NextResponse.json(dramas);
}

export async function POST(request: Request) {
  const body = await request.json();
  const result = dramaSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "校验失败", errors: result.error.issues },
      { status: 400 },
    );
  }

  const dramas = await getDramas();
  const dynasties = await getDynasties();

  if (dramas.some((d) => d.id === result.data.id)) {
    return NextResponse.json(
      { error: `ID "${result.data.id}" 已存在` },
      { status: 409 },
    );
  }

  const crossErrors = validateDramaCrossFields(result.data, dynasties);
  if (crossErrors.length > 0) {
    return NextResponse.json(
      {
        error: "校验失败",
        errors: crossErrors.map((message) => ({
          path: ["dynasty_id"],
          message,
        })),
      },
      { status: 400 },
    );
  }

  dramas.push(result.data);
  await saveDramas(dramas);

  return NextResponse.json(result.data, { status: 201 });
}
