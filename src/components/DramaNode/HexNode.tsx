"use client";

import { motion } from "framer-motion";

import type { Drama } from "@/types";

function ratingTier(rating: number | null) {
  if (rating == null) return "var(--rating-gray)";
  if (rating >= 9) return "var(--rating-gold)";
  if (rating >= 8) return "var(--rating-silver)";
  return "var(--rating-gray)";
}

function shortTitle(title: string) {
  const trimmed = title.replace(/\s+/g, "");
  if (trimmed.length <= 6) return trimmed;
  return `${trimmed.slice(0, 6)}…`;
}

export function HexNode({
  drama,
  onHover,
  onLeave,
}: {
  drama: Drama;
  onHover?: (drama: Drama, anchorEl: Element) => void;
  onLeave?: () => void;
}) {
  const borderColor = ratingTier(drama.douban_rating);
  const isCrossDynasty = drama.dynasty_ids.length > 1;

  return (
    <motion.button
      type="button"
      layout
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      onMouseEnter={(e) => onHover?.(drama, e.currentTarget)}
      onMouseLeave={() => onLeave?.()}
      className="relative grid h-[92px] w-[84px] place-items-center bg-white/5 text-center text-xs text-[color:var(--fg-primary)]"
      style={{
        clipPath:
          "polygon(25% 6%, 75% 6%, 98% 50%, 75% 94%, 25% 94%, 2% 50%)",
        border: `1px solid ${borderColor}`,
      }}
    >
      {isCrossDynasty ? (
        <span className="absolute right-2 top-2 rounded bg-white/10 px-1 py-[2px] text-[10px] text-[color:var(--fg-muted)]">
          跨
        </span>
      ) : null}
      <span className="px-2 leading-tight">{shortTitle(drama.title)}</span>
    </motion.button>
  );
}

