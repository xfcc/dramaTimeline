"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { Dynasty } from "@/types";

const TRACK_OPTIONS = ["main", "parallel_1", "parallel_2", "parallel_3"];

const inputClass =
  "w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50";
const labelClass = "mb-1.5 block text-sm font-medium text-zinc-300";
const errorClass = "mt-1 text-xs text-red-400";

export function DynastyForm({
  initialData,
  dynasties,
}: {
  initialData?: Dynasty;
  dynasties: Dynasty[];
}) {
  const router = useRouter();
  const isEdit = !!initialData;

  const [form, setForm] = useState({
    id: initialData?.id ?? "",
    name: initialData?.name ?? "",
    start_year: initialData?.start_year ?? 0,
    end_year: initialData?.end_year ?? 0,
    display_order: initialData?.display_order ?? 0,
    parent_id: initialData?.parent_id ?? "",
    track: initialData?.track ?? "main",
    color: initialData?.color ?? "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const set = (field: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setApiError(null);

    const payload = {
      ...form,
      parent_id: form.parent_id || null,
    };

    try {
      const url = isEdit ? `/api/dynasties/${form.id}` : "/api/dynasties";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        if (data.errors) {
          const fieldErrors: Record<string, string> = {};
          for (const err of data.errors) {
            const key = err.path?.[0];
            if (key) fieldErrors[key] = err.message;
          }
          setErrors(fieldErrors);
        } else {
          setApiError(data.error || "保存失败");
        }
        return;
      }

      router.push("/dynasties");
      router.refresh();
    } catch {
      setApiError("网络错误，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  const parentOptions = dynasties.filter(
    (d) => d.id !== form.id && !d.parent_id,
  );

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {apiError && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {apiError}
        </div>
      )}

      <fieldset className="space-y-4 rounded-xl border border-zinc-800 p-5">
        <legend className="px-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
          基础信息
        </legend>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>ID</label>
            <input
              type="text"
              value={form.id}
              onChange={(e) => set("id", e.target.value)}
              disabled={isEdit}
              placeholder="如 westernHan"
              className={inputClass}
            />
            {errors.id && <p className={errorClass}>{errors.id}</p>}
          </div>
          <div>
            <label className={labelClass}>名称</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="如 西汉"
              className={inputClass}
            />
            {errors.name && <p className={errorClass}>{errors.name}</p>}
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-4 rounded-xl border border-zinc-800 p-5">
        <legend className="px-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
          时间与排序
        </legend>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>起始年份</label>
            <input
              type="number"
              value={form.start_year}
              onChange={(e) => set("start_year", Number(e.target.value))}
              className={inputClass}
            />
            <p className="mt-1 text-xs text-zinc-500">负数表示公元前</p>
            {errors.start_year && (
              <p className={errorClass}>{errors.start_year}</p>
            )}
          </div>
          <div>
            <label className={labelClass}>结束年份</label>
            <input
              type="number"
              value={form.end_year}
              onChange={(e) => set("end_year", Number(e.target.value))}
              className={inputClass}
            />
            {errors.end_year && (
              <p className={errorClass}>{errors.end_year}</p>
            )}
          </div>
          <div>
            <label className={labelClass}>排序值</label>
            <input
              type="number"
              value={form.display_order}
              onChange={(e) => set("display_order", Number(e.target.value))}
              min={0}
              className={inputClass}
            />
            {errors.display_order && (
              <p className={errorClass}>{errors.display_order}</p>
            )}
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-4 rounded-xl border border-zinc-800 p-5">
        <legend className="px-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
          层级与轨道
        </legend>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>父级朝代</label>
            <select
              value={form.parent_id}
              onChange={(e) => set("parent_id", e.target.value)}
              className={inputClass}
            >
              <option value="">无（顶级）</option>
              {parentOptions.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>轨道</label>
            <select
              value={form.track}
              onChange={(e) => set("track", e.target.value)}
              className={inputClass}
            >
              {TRACK_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>颜色</label>
            <input
              type="text"
              value={form.color}
              onChange={(e) => set("color", e.target.value)}
              placeholder="如 var(--dyn-han)"
              className={inputClass}
            />
            {errors.color && <p className={errorClass}>{errors.color}</p>}
          </div>
        </div>
      </fieldset>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
        >
          {submitting ? "保存中…" : isEdit ? "保存修改" : "创建朝代"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/dynasties")}
          className="rounded-lg border border-zinc-700 px-5 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
        >
          取消
        </button>
      </div>
    </form>
  );
}
