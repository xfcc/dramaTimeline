"use client";

import { motion } from "framer-motion";

import type { Drama } from "@/types";

export function SpanBar({
  drama,
  xStart,
  xEnd,
  y = 6,
  onHover,
  onLeave,
}: {
  drama: Drama;
  xStart: number;
  xEnd: number;
  y?: number;
  onHover?: (drama: Drama, anchorEl: HTMLElement) => void;
  onLeave?: () => void;
}) {
  const left = Math.min(xStart, xEnd);
  const width = Math.max(24, Math.abs(xEnd - xStart));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute"
      style={{ left, top: y, width, height: 10 }}
    >
      <motion.button
        type="button"
        className="h-full w-full rounded-full bg-[color:var(--timeline-gold)]/25 transition-colors hover:bg-[color:var(--timeline-gold)]/55"
        onMouseEnter={(e) => onHover?.(drama, e.currentTarget)}
        onMouseLeave={() => onLeave?.()}
        aria-label={`${drama.title} 时间跨度`}
      />
    </motion.div>
  );
}

