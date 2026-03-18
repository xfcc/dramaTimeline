"use client";

import { motion } from "framer-motion";

import type { Drama, Dynasty } from "@/types";
import { DynastyExpanded } from "@/components/Timeline/DynastyExpanded";

function formatYear(year: number) {
  if (year < 0) return `前${Math.abs(year)}`;
  return String(year);
}

export function DynastyNode({
  dynasty,
  dramas,
  filterDrama,
  isActive,
  onToggle,
}: {
  dynasty: Dynasty;
  dramas: Drama[];
  filterDrama: (d: Drama) => boolean;
  isActive: boolean;
  onToggle: (dynastyId: Dynasty["id"]) => void;
}) {
  const dynastyDramas = dramas.filter((d) => d.dynasty_ids.includes(dynasty.id));
  const filteredCount = dynastyDramas.filter(filterDrama).length;

  return (
    <motion.button
      type="button"
      layout
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      onClick={() => onToggle(dynasty.id)}
      data-dynasty-id={dynasty.id}
      className={[
        "group relative flex flex-col items-start rounded-xl border border-white/10 bg-white/0 px-4 py-3 text-left backdrop-blur-md transition-colors hover:bg-white/5",
        filteredCount === 0 ? "opacity-40" : "opacity-100",
        isActive ? "w-[520px]" : "w-[140px]",
      ].join(" ")}
      style={{ borderColor: `color-mix(in oklab, ${dynasty.color} 40%, transparent)` }}
    >
      <div
        className="absolute -top-[10px] left-4 h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: dynasty.color }}
      />

      <div className="flex w-full items-baseline justify-between">
        <div className="font-[family-name:var(--font-noto-serif)] text-lg tracking-wide">
          {dynasty.name}
        </div>
        <div className="text-xs text-[color:var(--fg-muted)]">{filteredCount}</div>
      </div>

      <div className="mt-1 text-xs text-[color:var(--fg-muted)]">
        {formatYear(dynasty.start_year)}–{formatYear(dynasty.end_year)}
      </div>
      <div className="mt-2 h-px w-full bg-white/10 transition-colors group-hover:bg-white/20" />

      {isActive ? (
        <DynastyExpanded
          dynasty={dynasty}
          dramas={dynastyDramas.filter(filterDrama)}
        />
      ) : null}
    </motion.button>
  );
}

