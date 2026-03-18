"use client";

import { motion } from "framer-motion";

import type { Drama } from "@/types";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function formatRatingCount(count: number | null) {
  if (count == null) return null;
  if (count >= 10000) return `${(count / 10000).toFixed(1)}万人`;
  return `${count}人`;
}

export function HoverCard({
  drama,
  anchorRect,
  onMouseEnter,
  onMouseLeave,
}: {
  drama: Drama;
  anchorRect: { left: number; top: number; width: number; height: number };
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  // Basic viewport-aware positioning (no reflow measurement in MVP).
  const cardWidth = 320;
  const cardHeight = 220;
  const gap = 12;

  const viewportW = typeof window === "undefined" ? 1200 : window.innerWidth;
  const viewportH = typeof window === "undefined" ? 800 : window.innerHeight;

  const preferRight = anchorRect.left + anchorRect.width + gap + cardWidth <= viewportW;
  const left = preferRight
    ? anchorRect.left + anchorRect.width + gap
    : anchorRect.left - gap - cardWidth;

  const top = clamp(
    anchorRect.top - 20,
    12,
    Math.max(12, viewportH - 12 - cardHeight),
  );

  const ratingText =
    drama.douban_rating == null
      ? "暂无评分"
      : `${drama.douban_rating.toFixed(1)}（${formatRatingCount(drama.douban_rating_count) ?? "—"}）`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, y: 6 }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      className="fixed z-50"
      style={{ left, top, width: cardWidth }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="rounded-xl border border-white/12 bg-black/35 p-4 shadow-[0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur-md">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="font-[family-name:var(--font-noto-serif)] text-base tracking-wide">
              {drama.title}
            </div>
            <div className="mt-1 text-xs text-[color:var(--fg-muted)]">
              {drama.episode_count}集 · {drama.release_year}年
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-xs text-[color:var(--fg-muted)]">豆瓣</div>
            <div className="text-sm text-[color:var(--fg-primary)]">{ratingText}</div>
          </div>
        </div>

        <div className="mt-3 space-y-2">
          <div>
            <div className="text-[11px] text-[color:var(--fg-muted)]">时间锚点</div>
            <div className="text-sm leading-snug text-[color:var(--fg-primary)]">
              {drama.historical_anchor}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-[color:var(--fg-muted)]">核心张力</div>
            <div className="text-sm leading-snug text-[color:var(--fg-primary)]">
              {drama.core_tension}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="text-[11px] text-[color:var(--fg-muted)]">在哪看</div>
          <div className="mt-1 flex flex-wrap gap-2">
            {drama.platforms.length ? (
              drama.platforms.map((p) => (
                <a
                  key={`${drama.id}-${p.name}`}
                  href={p.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-[color:var(--fg-primary)] hover:bg-white/10"
                >
                  {p.name}
                </a>
              ))
            ) : (
              <span className="text-xs text-[color:var(--fg-muted)]">—</span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

