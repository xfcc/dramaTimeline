"use client";

import { motion } from "framer-motion";

import type { Drama } from "@/types";

function formatRating(rating: number | null) {
  if (rating == null) return "—";
  return rating.toFixed(1);
}

export function DramaRow({
  drama,
  onHover,
  onLeave,
}: {
  drama: Drama;
  onHover?: (drama: Drama, anchorEl: Element) => void;
  onLeave?: () => void;
}) {
  return (
    <motion.button
      type="button"
      layout
      whileHover={{ y: -1 }}
      transition={{ type: "spring", stiffness: 420, damping: 30 }}
      onMouseEnter={(e) => onHover?.(drama, e.currentTarget)}
      onMouseLeave={() => onLeave?.()}
      className="group w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left hover:bg-white/8"
    >
      <div className="flex items-baseline justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm text-[color:var(--fg-primary)]">
            {drama.title}
          </div>
          <div className="mt-1 truncate text-xs text-[color:var(--fg-muted)]">
            {drama.historical_anchor}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-[11px] text-[color:var(--fg-muted)]">豆瓣</div>
          <div className="text-sm text-[color:var(--fg-primary)]">
            {formatRating(drama.douban_rating)}
          </div>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px] text-[color:var(--fg-muted)]">
        <div>
          {drama.story_start_year}–{drama.story_end_year}
        </div>
        <div>
          {drama.episode_count}集 · {drama.release_year}
        </div>
      </div>

      <div className="mt-2 h-px w-full bg-white/10 transition-colors group-hover:bg-white/15" />
      <div className="mt-2 line-clamp-2 text-xs leading-snug text-[color:var(--fg-primary)]/90">
        {drama.core_tension}
      </div>
    </motion.button>
  );
}

