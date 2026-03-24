import { NextResponse } from "next/server";

import { getDynasties } from "@/lib/data";

type Suggestion = {
  category: "serious" | "romance";
  dynasty_id: string;
  historical_anchor: string;
  core_tension: string;
  confidence: number;
  reasoning: string;
};

function extractJsonBlock(text: string): string {
  const fenced = text.match(/```json\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return text.slice(firstBrace, lastBrace + 1);
  }
  return text;
}

function validateSuggestion(input: unknown, validDynastyIds: Set<string>) {
  const data = input as Partial<Suggestion>;
  if (data.category !== "serious" && data.category !== "romance") {
    throw new Error("category 无效");
  }
  if (!data.dynasty_id || !validDynastyIds.has(data.dynasty_id)) {
    throw new Error("dynasty_id 无效或不存在");
  }
  if (!data.historical_anchor || data.historical_anchor.trim().length < 4) {
    throw new Error("historical_anchor 过短");
  }
  if (!data.core_tension || data.core_tension.trim().length < 4) {
    throw new Error("core_tension 过短");
  }
  const confidence = Number(data.confidence ?? 0.7);

  return {
    category: data.category,
    dynasty_id: data.dynasty_id,
    historical_anchor: data.historical_anchor.trim(),
    core_tension: data.core_tension.trim(),
    confidence: Number.isFinite(confidence)
      ? Math.min(1, Math.max(0, confidence))
      : 0.7,
    reasoning: (data.reasoning ?? "").toString().trim(),
  } satisfies Suggestion;
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  const primaryModel = process.env.GEMINI_MODEL ?? "gemini-3.0-pro";

  if (!apiKey) {
    return NextResponse.json(
      { error: "缺少 GEMINI_API_KEY，请在本地 .env.local 配置" },
      { status: 500 },
    );
  }

  let body: { title?: string; context?: string };
  try {
    body = (await request.json()) as { title?: string; context?: string };
  } catch {
    return NextResponse.json({ error: "请求体格式错误" }, { status: 400 });
  }

  const title = body.title?.trim();
  const context = body.context?.trim() ?? "";

  if (!title) {
    return NextResponse.json({ error: "请先填写剧名" }, { status: 400 });
  }

  const dynasties = await getDynasties();
  const validDynastyIds = new Set(dynasties.map((d) => d.id));
  const dynastyPrompt = dynasties
    .map((d) => `${d.id} | ${d.name} | ${d.start_year}~${d.end_year}`)
    .join("\n");

  const prompt = [
    "你是历史剧数据标注助手。",
    "请根据剧名与补充信息，给出结构化字段建议。",
    "dynasty_id 的含义是“主题朝代”（用户认知上的归属），不是剧情年份的硬约束归属。",
    "category 的首要判定规则：`serious`=严肃正剧，主情节以真实历史人物、真实历史关系、真实历史事件链为骨架推进，尤其围绕著名历史事件展开，并以较强的正剧化方式重建历史进程；`romance`=史事演义，虽然借用了历史背景、人物或时代节点，但主情节更多是在某个历史切面上重构新故事，或明显偏传奇、戏说、武侠、宫斗、探案、架空等类型化表达。",
    "输出必须是 JSON，不要包含其他文字。",
    "",
    `剧名: ${title}`,
    `补充上下文: ${context || "(无)"}`,
    "",
    "可选朝代（只能从下列 dynasty_id 中选择）：",
    dynastyPrompt,
    "",
    "请返回如下 JSON 结构：",
    '{"category":"serious|romance","dynasty_id":"...","historical_anchor":"...","core_tension":"...","confidence":0.0,"reasoning":"..."}',
    "",
    "约束：",
    "1) category 仅能是 serious 或 romance，并严格依据上面的首要判定规则；如果更像借历史节点讲新故事，则优先归为 romance",
    "2) dynasty_id 必须来自给定列表，且优先按剧集主题归属（主叙事围绕哪个朝代/政权）",
    "3) historical_anchor 与 core_tension 使用中文，简洁、客观、可读",
    "4) confidence 范围 0~1",
  ].join("\n");

  try {
    const modelCandidates = [
      primaryModel,
      "gemini-2.5-pro",
      "gemini-1.5-pro",
    ];
    let data: unknown = null;
    let lastError = "";

    for (const model of modelCandidates) {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.2,
            },
          }),
        },
      );
      if (resp.ok) {
        data = await resp.json();
        break;
      }
      lastError = `${model}: ${resp.status} ${await resp.text()}`;
    }

    if (!data) {
      return NextResponse.json(
        { error: "Gemini 请求失败", detail: lastError.slice(0, 600) },
        { status: 502 },
      );
    }

    const text =
      (data as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> })
        ?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("\n") ?? "";

    if (!text.trim()) {
      return NextResponse.json({ error: "模型未返回有效内容" }, { status: 502 });
    }

    const parsed = JSON.parse(extractJsonBlock(text));
    const suggestion = validateSuggestion(parsed, validDynastyIds);

    return NextResponse.json({ suggestion });
  } catch (error) {
    return NextResponse.json(
      {
        error: "AI 生成失败",
        detail: error instanceof Error ? error.message : "unknown",
      },
      { status: 500 },
    );
  }
}
