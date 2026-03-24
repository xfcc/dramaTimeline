"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

import type { Drama, Dynasty, DynastyId } from "@/types";

const DRAWER_WIDTH = 480;

function formatRatingCount(count: number | null) {
  if (count == null) return null;
  if (count >= 10000) return `${(count / 10000).toFixed(1)}万人`;
  return `${count}人`;
}

function formatYear(year: number) {
  if (year < 0) return `前${Math.abs(year)}年`;
  return `${year}年`;
}

function categoryLabel(category: Drama["category"]) {
  return category === "serious" ? "严肃正剧" : "史事演义";
}

export function DetailDrawer({
  drama,
  dynasties,
  onClose,
}: {
  drama: Drama;
  dynasties: Dynasty[];
  onClose: () => void;
}) {
  const dynastyMap = new Map<DynastyId, string>(
    dynasties.map((d) => [d.id, d.name]),
  );
  const dynastyName = dynastyMap.get(drama.dynasty_id) ?? "";

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const ratingText =
    drama.douban_rating == null
      ? "暂无评分"
      : `${drama.douban_rating.toFixed(1)}（${formatRatingCount(drama.douban_rating_count) ?? "—"}）`;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]"
        aria-hidden
        onClick={onClose}
      />

      {/* Panel */}
      <motion.aside
        initial={{ x: DRAWER_WIDTH }}
        animate={{ x: 0 }}
        exit={{ x: DRAWER_WIDTH }}
        transition={{ type: "spring", stiffness: 400, damping: 36 }}
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-[min(100vw,480px)] flex-col border-l border-white/10 bg-[color:var(--bg-primary)] shadow-[-8px_0_32px_rgba(0,0,0,0.4)]"
        style={{ width: DRAWER_WIDTH }}
        role="dialog"
        aria-modal
        aria-label={`剧集详情：${drama.title}`}
      >
        <div className="flex flex-1 flex-col overflow-y-auto">
          {/* Close button */}
          <div className="sticky top-0 z-10 flex justify-end border-b border-white/8 bg-[color:var(--bg-primary)]/90 p-3 backdrop-blur-sm">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-[color:var(--fg-muted)] hover:bg-white/10 hover:text-[color:var(--fg-primary)]"
              aria-label="关闭"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="flex flex-col gap-6 p-6">
            {/* Poster 2:3 */}
            <div className="flex justify-center">
              <div
                className="relative overflow-hidden rounded-lg bg-white/10"
                style={{
                  width: 240,
                  aspectRatio: "2/3",
                }}
              >
                {drama.poster_url ? (
                  <img
                    src={drama.poster_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[color:var(--fg-muted)]/40">
                    <svg
                      className="h-16 w-16"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.2}
                        d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
                      />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* Title */}
            <h2 className="font-[family-name:var(--font-noto-serif)] text-2xl font-semibold tracking-wide text-[color:var(--fg-primary)]">
              {drama.title}
            </h2>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-2 text-sm text-[color:var(--fg-muted)]">
              <span>
                {drama.episode_count}集 · {drama.release_year}年
              </span>
              <span className="text-white/40">·</span>
              <span
                className="rounded-md border border-white/15 px-2 py-0.5 text-xs text-[color:var(--timeline-gold)]"
                aria-label="分类"
              >
                {categoryLabel(drama.category)}
              </span>
            </div>

            {/* Rating block */}
            <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
              <div className="text-[11px] uppercase tracking-wider text-[color:var(--fg-muted)]">
                豆瓣
              </div>
              <div className="mt-1 text-lg font-medium text-[color:var(--fg-primary)]">
                {ratingText}
              </div>
            </div>

            <div className="h-px bg-white/10" />

            {/* Historical anchor */}
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wider text-[color:var(--fg-muted)]">
                时间锚点
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-[color:var(--fg-primary)]">
                {drama.historical_anchor}
              </p>
            </div>

            {/* Core tension */}
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wider text-[color:var(--fg-muted)]">
                核心张力
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-[color:var(--fg-primary)]">
                {drama.core_tension}
              </p>
            </div>

            {/* Theme dynasty */}
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wider text-[color:var(--fg-muted)]">
                主题朝代
              </div>
              <p className="mt-1.5 text-sm text-[color:var(--fg-primary)]">
                {dynastyName || "—"}
              </p>
            </div>

            {/* Timeline span */}
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wider text-[color:var(--fg-muted)]">
                剧情年代
              </div>
              <p className="mt-1.5 text-sm text-[color:var(--fg-primary)]">
                {formatYear(drama.story_start_year)} –{" "}
                {formatYear(drama.story_end_year)}
              </p>
            </div>

            {/* Platforms */}
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wider text-[color:var(--fg-muted)]">
                在哪看
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {drama.platforms.length ? (
                  drama.platforms.map((p) => (
                    <a
                      key={`${drama.id}-${p.name}`}
                      href={p.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-[color:var(--fg-primary)] hover:bg-white/10"
                    >
                      {p.name}
                    </a>
                  ))
                ) : (
                  <span className="text-sm text-[color:var(--fg-muted)]">—</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.aside>
    </>
  );
}

export function DetailDrawerPortal({
  state,
  dynasties,
  onClose,
}: {
  state: { open: false } | { open: true; drama: Drama };
  dynasties: Dynasty[];
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {state.open ? (
        <DetailDrawer
          key={state.drama.id}
          drama={state.drama}
          dynasties={dynasties}
          onClose={onClose}
        />
      ) : null}
    </AnimatePresence>
  );
}
