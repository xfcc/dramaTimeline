import { NextResponse } from "next/server";

import { getDynasties, saveDynasties } from "@/lib/data";
import { dynastySchema } from "@/lib/validation";

export async function GET() {
  const dynasties = await getDynasties();
  return NextResponse.json(dynasties);
}

export async function POST(request: Request) {
  const body = await request.json();
  const result = dynastySchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "校验失败", errors: result.error.issues },
      { status: 400 },
    );
  }

  const dynasties = await getDynasties();

  if (dynasties.some((d) => d.id === result.data.id)) {
    return NextResponse.json(
      { error: `ID "${result.data.id}" 已存在` },
      { status: 409 },
    );
  }

  dynasties.push(result.data);
  await saveDynasties(dynasties);

  return NextResponse.json(result.data, { status: 201 });
}
