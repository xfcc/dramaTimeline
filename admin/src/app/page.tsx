import Link from "next/link";

import { getDynasties, getDramas } from "@/lib/data";

export default async function DashboardPage() {
  const [dynasties, dramas] = await Promise.all([getDynasties(), getDramas()]);

  const seriousCount = dramas.filter((d) => d.category === "serious").length;
  const romanceCount = dramas.filter((d) => d.category === "romance").length;
  const noPosterCount = dramas.filter((d) => !d.poster_url).length;
  const topRated = [...dramas]
    .filter((d) => d.douban_rating != null)
    .sort((a, b) => (b.douban_rating ?? 0) - (a.douban_rating ?? 0))
    .slice(0, 5);

  const dynastyMap = new Map(dynasties.map((d) => [d.id, d.name]));

  const dramasByDynasty = new Map<string, number>();
  for (const d of dramas) {
    dramasByDynasty.set(
      d.dynasty_id,
      (dramasByDynasty.get(d.dynasty_id) ?? 0) + 1,
    );
  }

  const stats = [
    { label: "总剧集数", value: dramas.length, color: "text-blue-400" },
    { label: "严肃正剧", value: seriousCount, color: "text-emerald-400" },
    { label: "史事演义", value: romanceCount, color: "text-pink-400" },
    { label: "总朝代数", value: dynasties.length, color: "text-amber-400" },
    { label: "缺少海报", value: noPosterCount, color: "text-red-400" },
  ];

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold tracking-tight">仪表盘</h1>
      <p className="mt-1 text-sm text-zinc-500">数据概览</p>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-5 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5"
          >
            <div className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              {s.label}
            </div>
            <div className={`mt-2 text-2xl font-semibold ${s.color}`}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-2 gap-6">
        {/* Top rated */}
        <div className="rounded-xl border border-zinc-800 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-200">
              评分最高的剧集
            </h2>
            <Link
              href="/dramas"
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              查看全部
            </Link>
          </div>
          <div className="space-y-3">
            {topRated.map((d, i) => (
              <div
                key={d.id}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="w-5 text-right text-xs text-zinc-500">
                    {i + 1}
                  </span>
                  <span className="text-zinc-200">{d.title}</span>
                </div>
                <span className="font-medium text-amber-400">
                  {d.douban_rating?.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Dynasty distribution */}
        <div className="rounded-xl border border-zinc-800 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-200">
              各朝代剧集分布
            </h2>
            <Link
              href="/dynasties"
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              查看全部
            </Link>
          </div>
          <div className="space-y-2">
            {dynasties
              .filter((d) => !d.parent_id)
              .sort((a, b) => a.display_order - b.display_order)
              .map((d) => {
                const count = dramasByDynasty.get(d.id) ?? 0;
                const childIds = dynasties
                  .filter((c) => c.parent_id === d.id)
                  .map((c) => c.id);
                const totalCount =
                  count +
                  childIds.reduce(
                    (sum, id) => sum + (dramasByDynasty.get(id) ?? 0),
                    0,
                  );
                return (
                  <div
                    key={d.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-zinc-300">{d.name}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-zinc-800">
                        <div
                          className="h-full rounded-full bg-blue-500/60"
                          style={{
                            width: `${Math.min(100, (totalCount / Math.max(1, dramas.length)) * 100 * 5)}%`,
                          }}
                        />
                      </div>
                      <span className="w-6 text-right text-xs text-zinc-500">
                        {totalCount}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
