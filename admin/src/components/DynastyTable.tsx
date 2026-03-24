"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import type { Dynasty, Drama } from "@/types";

function formatYear(year: number) {
  return year < 0 ? `前${Math.abs(year)}` : `${year}`;
}

export function DynastyTable({
  dynasties,
  dramas,
}: {
  dynasties: Dynasty[];
  dramas: Drama[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const dramaCountMap = new Map<string, number>();
  for (const d of dramas) {
    dramaCountMap.set(d.dynasty_id, (dramaCountMap.get(d.dynasty_id) ?? 0) + 1);
  }

  const sorted = [...dynasties].sort(
    (a, b) => a.display_order - b.display_order,
  );

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`确定要删除朝代「${name}」吗？`)) return;

    setError(null);
    setDeletingId(id);

    try {
      const res = await fetch(`/api/dynasties/${id}`, { method: "DELETE" });
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
    <div>
      {error && (
        <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
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
                名称
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                时间范围
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                展示
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                父级
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                排序
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                剧集数
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((d) => {
              const parentName = d.parent_id
                ? dynasties.find((p) => p.id === d.parent_id)?.name
                : null;
              const dramaCount = dramaCountMap.get(d.id) ?? 0;

              return (
                <tr
                  key={d.id}
                  className="border-b border-zinc-800/50 transition-colors hover:bg-zinc-800/30"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {d.parent_id && (
                        <span className="text-zinc-600">└</span>
                      )}
                      <span className="font-medium text-zinc-200">
                        {d.name}
                      </span>
                    </div>
                    <div className="mt-0.5 text-xs text-zinc-500">{d.id}</div>
                  </td>
                  <td className="px-4 py-3 text-zinc-300">
                    {formatYear(d.start_year)} – {formatYear(d.end_year)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                      主轴
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {parentName ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {d.display_order}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{dramaCount}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/dynasties/${d.id}/edit`}
                        className="rounded-md px-2.5 py-1 text-xs text-blue-400 transition-colors hover:bg-blue-500/10"
                      >
                        编辑
                      </Link>
                      <button
                        onClick={() => handleDelete(d.id, d.name)}
                        disabled={deletingId === d.id}
                        className="rounded-md px-2.5 py-1 text-xs text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50"
                      >
                        {deletingId === d.id ? "删除中…" : "删除"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
