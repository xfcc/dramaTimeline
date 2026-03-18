"use client";

import { motion } from "framer-motion";

import type { Drama, Dynasty } from "@/types";
import { DynastyNode } from "@/components/Timeline/DynastyNode";

export function ParallelTracks({
  parent,
  tracks,
  dramas,
  filterDrama,
  activeDynastyId,
  onToggle,
}: {
  parent: Dynasty;
  tracks: Dynasty[];
  dramas: Drama[];
  filterDrama: (d: Drama) => boolean;
  activeDynastyId: Dynasty["id"] | null;
  onToggle: (id: Dynasty["id"]) => void;
}) {
  const ordered = [...tracks].sort((a, b) => a.display_order - b.display_order);

  return (
    <div className="relative">
      <div className="pointer-events-none absolute left-0 right-0 top-10 h-[180px]">
        <svg className="h-full w-full" viewBox="0 0 520 180" preserveAspectRatio="none">
          <motion.path
            d="M40,40 C160,40 160,40 240,40"
            stroke="color-mix(in oklab, var(--timeline-gold) 70%, transparent)"
            strokeWidth="1"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          />
          <motion.path
            d="M240,40 C300,40 300,20 360,20"
            stroke="color-mix(in oklab, var(--timeline-gold) 70%, transparent)"
            strokeWidth="1"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.9, ease: "easeOut", delay: 0.1 }}
          />
          <motion.path
            d="M240,40 C300,40 300,40 360,40"
            stroke="color-mix(in oklab, var(--timeline-gold) 70%, transparent)"
            strokeWidth="1"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.9, ease: "easeOut", delay: 0.1 }}
          />
          <motion.path
            d="M240,40 C300,40 300,60 360,60"
            stroke="color-mix(in oklab, var(--timeline-gold) 70%, transparent)"
            strokeWidth="1"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.9, ease: "easeOut", delay: 0.1 }}
          />
        </svg>
      </div>

      <div className="relative flex items-start gap-6">
        <div className="pt-0">
          <div className="w-[140px] rounded-xl border border-white/10 bg-white/0 px-4 py-3 backdrop-blur-md">
            <div className="font-[family-name:var(--font-noto-serif)] text-lg tracking-wide">
              {parent.name}
            </div>
            <div className="mt-1 text-xs text-[color:var(--fg-muted)]">
              {parent.start_year}–{parent.end_year}
            </div>
            <div className="mt-2 text-[11px] text-[color:var(--fg-muted)]">
              并行政权
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 pt-0">
          {ordered.map((d) => (
            <DynastyNode
              key={d.id}
              dynasty={d}
              dramas={dramas}
              filterDrama={filterDrama}
              isActive={activeDynastyId === d.id}
              onToggle={onToggle}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

