"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import type { Drama, Dynasty } from "@/types";

const CATEGORY_LABELS: Record<string, string> = {
  serious: "严肃正剧",
  romance: "史事演义",
};

export function DramaTable({
  dramas,
  dynasties,
}: {
  dramas: Drama[];
  dynasties: Dynasty[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [dynastyFilter, setDynastyFilter] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const dynastyMap = new Map(dynasties.map((d) => [d.id, d.name]));

  const topLevelDynasties = dynasties
    .filter((d) => !d.parent_id)
    .sort((a, b) => a.display_order - b.display_order);

  const filtered = useMemo(() => {
    return dramas.filter((d) => {
      if (search && !d.title.includes(search) && !d.id.includes(search.toLowerCase())) {
        return false;
      }
      if (categoryFilter !== "all" && d.category !== categoryFilter) {
        return false;
      }
      if (dynastyFilter !== "all" && d.dynasty_id !== dynastyFilter) {
        const dynasty = dynasties.find((dy) => dy.id === d.dynasty_id);
        if (dynasty?.parent_id !== dynastyFilter) return false;
      }
      return true;
    });
  }, [dramas, dynasties, search, categoryFilter, dynastyFilter]);

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`确定要删除剧集「${title}」吗？`)) return;

    setError(null);
    setDeletingId(id);

    try {
      const res = await fetch(`/api/dramas/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "删除失败");
        return;
      }
      router.refresh();
    } catch {
      setError("网络错误");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="搜索剧名或 ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 focus:border-blue-500 focus:outline-none"
        >
          <option value="all">全部分类</option>
          <option value="serious">严肃正剧</option>
          <option value="romance">史事演义</option>
        </select>
        <select
          value={dynastyFilter}
          onChange={(e) => setDynastyFilter(e.target.value)}
          className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 focus:border-blue-500 focus:outline-none"
        >
          <option value="all">全部朝代</option>
          {topLevelDynasties.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <span className="text-sm text-zinc-500">
          共 {filtered.length} 部
        </span>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-3 text-red-300 hover:text-red-200"
          >
            ✕
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/50">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                剧名
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                朝代
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                分类
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                豆瓣评分
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                年份
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                集数
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                海报
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => (
              <tr
                key={d.id}
                className="border-b border-zinc-800/50 transition-colors hover:bg-zinc-800/30"
              >
                <td className="px-4 py-3">
                  <div className="font-medium text-zinc-200">{d.title}</div>
                  <div className="mt-0.5 text-xs text-zinc-500">{d.id}</div>
                </td>
                <td className="px-4 py-3 text-zinc-300">
                  {dynastyMap.get(d.dynasty_id) ?? d.dynasty_id}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      d.category === "serious"
                        ? "bg-blue-500/10 text-blue-400"
                        : "bg-pink-500/10 text-pink-400"
                    }`}
                  >
                    {CATEGORY_LABELS[d.category] ?? d.category}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-300">
                  {d.douban_rating?.toFixed(1) ?? "—"}
                </td>
                <td className="px-4 py-3 text-zinc-400">{d.release_year}</td>
                <td className="px-4 py-3 text-zinc-400">{d.episode_count}</td>
                <td className="px-4 py-3">
                  {d.poster_url ? (
                    <span className="text-xs text-green-400">✓</span>
                  ) : (
                    <span className="text-xs text-zinc-600">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/dramas/${d.id}/edit`}
                      className="rounded-md px-2.5 py-1 text-xs text-blue-400 transition-colors hover:bg-blue-500/10"
                    >
                      编辑
                    </Link>
                    <button
                      onClick={() => handleDelete(d.id, d.title)}
                      disabled={deletingId === d.id}
                      className="rounded-md px-2.5 py-1 text-xs text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50"
                    >
                      {deletingId === d.id ? "删除中…" : "删除"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-12 text-center text-zinc-500"
                >
                  没有找到匹配的剧集
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
