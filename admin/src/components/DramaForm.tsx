"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { Drama, Dynasty, Platform } from "@/types";
import { ImageCropper } from "@/components/ImageCropper";

const inputClass =
  "w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50";
const labelClass = "mb-1.5 block text-sm font-medium text-zinc-300";
const errorClass = "mt-1 text-xs text-red-400";

export function DramaForm({
  initialData,
  dynasties,
}: {
  initialData?: Drama;
  dynasties: Dynasty[];
}) {
  const router = useRouter();
  const isEdit = !!initialData;

  const [form, setForm] = useState({
    id: initialData?.id ?? "",
    title: initialData?.title ?? "",
    category: initialData?.category ?? ("serious" as const),
    douban_rating: initialData?.douban_rating,
    douban_rating_count: initialData?.douban_rating_count,
    episode_count: initialData?.episode_count ?? 1,
    release_year: initialData?.release_year ?? new Date().getFullYear(),
    story_start_year: initialData?.story_start_year ?? 0,
    story_end_year: initialData?.story_end_year ?? 0,
    dynasty_id: initialData?.dynasty_id ?? "",
    historical_anchor: initialData?.historical_anchor ?? "",
    core_tension: initialData?.core_tension ?? "",
    poster_url: initialData?.poster_url ?? "",
  });

  const [platforms, setPlatforms] = useState<Platform[]>(
    initialData?.platforms ?? [],
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const set = (field: string, value: string | number | null) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const addPlatform = () => {
    setPlatforms((prev) => [...prev, { name: "", url: "" }]);
  };

  const removePlatform = (index: number) => {
    setPlatforms((prev) => prev.filter((_, i) => i !== index));
  };

  const updatePlatform = (
    index: number,
    field: keyof Platform,
    value: string,
  ) => {
    setPlatforms((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setApiError(null);

    const payload = {
      ...form,
      poster_url: form.poster_url || null,
      douban_rating: form.douban_rating ?? null,
      douban_rating_count: form.douban_rating_count ?? null,
      platforms: platforms.filter((p) => p.name && p.url),
    };

    try {
      const url = isEdit ? `/api/dramas/${form.id}` : "/api/dramas";
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

      router.push("/dramas");
      router.refresh();
    } catch {
      setApiError("网络错误，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  const sortedDynasties = [...dynasties].sort(
    (a, b) => a.display_order - b.display_order,
  );

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
      {apiError && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {apiError}
        </div>
      )}

      {/* 基础信息 */}
      <fieldset className="space-y-4 rounded-xl border border-zinc-800 p-5">
        <legend className="px-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
          基础信息
        </legend>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>ID</label>
            <input
              type="text"
              value={form.id}
              onChange={(e) => set("id", e.target.value)}
              disabled={isEdit}
              placeholder="如 daqindiguozhiliebian"
              className={inputClass}
            />
            {errors.id && <p className={errorClass}>{errors.id}</p>}
          </div>
          <div>
            <label className={labelClass}>剧名</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="如 大秦帝国之裂变"
              className={inputClass}
            />
            {errors.title && <p className={errorClass}>{errors.title}</p>}
          </div>
          <div>
            <label className={labelClass}>分类</label>
            <select
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              className={inputClass}
            >
              <option value="serious">严肃正剧</option>
              <option value="romance">史事演义</option>
            </select>
          </div>
        </div>
      </fieldset>

      {/* 评分信息 */}
      <fieldset className="space-y-4 rounded-xl border border-zinc-800 p-5">
        <legend className="px-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
          豆瓣评分
        </legend>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>评分（0-10）</label>
            <input
              type="number"
              value={form.douban_rating ?? ""}
              onChange={(e) =>
                set(
                  "douban_rating",
                  e.target.value === "" ? null : Number(e.target.value),
                )
              }
              min={0}
              max={10}
              step={0.1}
              placeholder="如 9.3"
              className={inputClass}
            />
            {errors.douban_rating && (
              <p className={errorClass}>{errors.douban_rating}</p>
            )}
          </div>
          <div>
            <label className={labelClass}>评分人数</label>
            <input
              type="number"
              value={form.douban_rating_count ?? ""}
              onChange={(e) =>
                set(
                  "douban_rating_count",
                  e.target.value === "" ? null : Number(e.target.value),
                )
              }
              min={0}
              placeholder="如 95000"
              className={inputClass}
            />
            {errors.douban_rating_count && (
              <p className={errorClass}>{errors.douban_rating_count}</p>
            )}
          </div>
        </div>
      </fieldset>

      {/* 时间信息 */}
      <fieldset className="space-y-4 rounded-xl border border-zinc-800 p-5">
        <legend className="px-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
          时间信息
        </legend>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className={labelClass}>上映年份</label>
            <input
              type="number"
              value={form.release_year}
              onChange={(e) => set("release_year", Number(e.target.value))}
              className={inputClass}
            />
            {errors.release_year && (
              <p className={errorClass}>{errors.release_year}</p>
            )}
          </div>
          <div>
            <label className={labelClass}>集数</label>
            <input
              type="number"
              value={form.episode_count}
              onChange={(e) => set("episode_count", Number(e.target.value))}
              min={1}
              className={inputClass}
            />
            {errors.episode_count && (
              <p className={errorClass}>{errors.episode_count}</p>
            )}
          </div>
          <div>
            <label className={labelClass}>故事起始年</label>
            <input
              type="number"
              value={form.story_start_year}
              onChange={(e) => set("story_start_year", Number(e.target.value))}
              className={inputClass}
            />
            <p className="mt-1 text-xs text-zinc-500">负数为公元前</p>
            {errors.story_start_year && (
              <p className={errorClass}>{errors.story_start_year}</p>
            )}
          </div>
          <div>
            <label className={labelClass}>故事结束年</label>
            <input
              type="number"
              value={form.story_end_year}
              onChange={(e) => set("story_end_year", Number(e.target.value))}
              className={inputClass}
            />
            {errors.story_end_year && (
              <p className={errorClass}>{errors.story_end_year}</p>
            )}
          </div>
        </div>
      </fieldset>

      {/* 历史关联 */}
      <fieldset className="space-y-4 rounded-xl border border-zinc-800 p-5">
        <legend className="px-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
          历史关联
        </legend>
        <div>
          <label className={labelClass}>所属朝代</label>
          <select
            value={form.dynasty_id}
            onChange={(e) => set("dynasty_id", e.target.value)}
            className={inputClass}
          >
            <option value="">请选择朝代</option>
            {sortedDynasties.map((d) => (
              <option key={d.id} value={d.id}>
                {d.parent_id ? "　" : ""}
                {d.name}
              </option>
            ))}
          </select>
          {errors.dynasty_id && (
            <p className={errorClass}>{errors.dynasty_id}</p>
          )}
        </div>
        <div>
          <label className={labelClass}>时间锚点</label>
          <textarea
            value={form.historical_anchor}
            onChange={(e) => set("historical_anchor", e.target.value)}
            placeholder="如 秦孝公商鞅变法（-361 至 -338）"
            rows={2}
            className={inputClass}
          />
          {errors.historical_anchor && (
            <p className={errorClass}>{errors.historical_anchor}</p>
          )}
        </div>
        <div>
          <label className={labelClass}>核心张力</label>
          <textarea
            value={form.core_tension}
            onChange={(e) => set("core_tension", e.target.value)}
            placeholder="如 一场以生命为赌注的制度革命"
            rows={2}
            className={inputClass}
          />
          {errors.core_tension && (
            <p className={errorClass}>{errors.core_tension}</p>
          )}
        </div>
      </fieldset>

      {/* 海报管理 */}
      <fieldset className="space-y-4 rounded-xl border border-zinc-800 p-5">
        <legend className="px-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
          海报管理
        </legend>
        {isEdit ? (
          <ImageCropper
            dramaId={form.id}
            currentPosterUrl={form.poster_url || null}
            onPosterChange={(url) => set("poster_url", url ?? "")}
          />
        ) : (
          <div className="rounded-lg border border-zinc-700/50 bg-zinc-800/30 px-4 py-6 text-center">
            <p className="text-sm text-zinc-500">
              请先保存剧集，然后再上传海报
            </p>
          </div>
        )}
      </fieldset>

      {/* 播放平台 */}
      <fieldset className="space-y-4 rounded-xl border border-zinc-800 p-5">
        <legend className="px-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
          播放平台
        </legend>
        <div>
          <div className="mb-2 flex items-center justify-end">
            <button
              type="button"
              onClick={addPlatform}
              className="rounded-md border border-zinc-700 px-2.5 py-1 text-xs text-zinc-300 transition-colors hover:bg-zinc-800"
            >
              + 添加平台
            </button>
          </div>

          {platforms.length === 0 && (
            <p className="text-sm text-zinc-500">暂无平台信息</p>
          )}

          <div className="space-y-2">
            {platforms.map((p, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={p.name}
                  onChange={(e) => updatePlatform(i, "name", e.target.value)}
                  placeholder="平台名称"
                  className={inputClass}
                />
                <input
                  type="text"
                  value={p.url}
                  onChange={(e) => updatePlatform(i, "url", e.target.value)}
                  placeholder="链接地址"
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => removePlatform(i)}
                  className="shrink-0 rounded-md p-2 text-zinc-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18 18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      </fieldset>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
        >
          {submitting ? "保存中…" : isEdit ? "保存修改" : "创建剧集"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/dramas")}
          className="rounded-lg border border-zinc-700 px-5 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
        >
          取消
        </button>
      </div>
    </form>
  );
}
