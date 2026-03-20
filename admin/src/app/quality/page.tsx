import Link from "next/link";

import { getDramas, getDynasties } from "@/lib/data";
import { collectDramaQualityIssues } from "@/lib/quality";

const kindLabel: Record<string, string> = {
  invalid_dynasty_ref: "朝代引用异常",
  story_out_of_dynasty_range: "剧情年代越界",
  missing_poster: "缺少海报",
  rating_without_count: "评分人数缺失",
  count_without_rating: "评分缺失",
  invalid_platform_url: "平台链接异常",
};

export default async function QualityPage() {
  const [dramas, dynasties] = await Promise.all([getDramas(), getDynasties()]);
  const issues = collectDramaQualityIssues(dramas, dynasties);

  const errors = issues.filter((i) => i.level === "error");
  const warnings = issues.filter((i) => i.level === "warning");

  const issueCountByKind = new Map<string, number>();
  for (const issue of issues) {
    issueCountByKind.set(issue.kind, (issueCountByKind.get(issue.kind) ?? 0) + 1);
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">数据质量扫描</h1>
        <p className="mt-1 text-sm text-zinc-500">
          快速发现剧集数据中的高风险问题与待优化项
        </p>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="text-xs uppercase tracking-wider text-zinc-500">总问题数</div>
          <div className="mt-2 text-2xl font-semibold text-zinc-100">{issues.length}</div>
        </div>
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <div className="text-xs uppercase tracking-wider text-red-300/70">错误</div>
          <div className="mt-2 text-2xl font-semibold text-red-400">{errors.length}</div>
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <div className="text-xs uppercase tracking-wider text-amber-300/70">警告</div>
          <div className="mt-2 text-2xl font-semibold text-amber-400">{warnings.length}</div>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-zinc-800 p-5">
        <h2 className="mb-3 text-sm font-semibold text-zinc-200">问题类型分布</h2>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {Array.from(issueCountByKind.entries()).map(([kind, count]) => (
            <div key={kind} className="flex items-center justify-between rounded-lg bg-zinc-900/60 px-3 py-2">
              <span className="text-zinc-300">{kindLabel[kind] ?? kind}</span>
              <span className="font-medium text-zinc-100">{count}</span>
            </div>
          ))}
          {issueCountByKind.size === 0 && (
            <div className="col-span-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-4 text-center text-sm text-emerald-400">
              未发现问题，数据状态良好
            </div>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/50">
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-zinc-500">级别</th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-zinc-500">类型</th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-zinc-500">剧集</th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-zinc-500">详情</th>
              <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-zinc-500">处理</th>
            </tr>
          </thead>
          <tbody>
            {issues.map((issue, idx) => (
              <tr key={`${issue.dramaId}-${issue.kind}-${idx}`} className="border-b border-zinc-800/50 hover:bg-zinc-900/30">
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      issue.level === "error"
                        ? "bg-red-500/10 text-red-400"
                        : "bg-amber-500/10 text-amber-400"
                    }`}
                  >
                    {issue.level === "error" ? "错误" : "警告"}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-300">{kindLabel[issue.kind] ?? issue.kind}</td>
                <td className="px-4 py-3">
                  <div className="text-zinc-200">{issue.dramaTitle}</div>
                  <div className="text-xs text-zinc-500">{issue.dramaId}</div>
                </td>
                <td className="px-4 py-3 text-zinc-400">{issue.message}</td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/dramas/${issue.dramaId}/edit`}
                    className="rounded-md px-2.5 py-1 text-xs text-blue-400 transition-colors hover:bg-blue-500/10"
                  >
                    去修复
                  </Link>
                </td>
              </tr>
            ))}
            {issues.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-zinc-500">
                  当前没有发现质量问题
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
