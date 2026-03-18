"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

import type { Drama, Dynasty } from "@/types";
import { CategoryFilter } from "@/components/Filter/CategoryFilter";
import { useFilter } from "@/hooks/useFilter";
import { DramaRow } from "@/components/DramaNode/DramaRow";
import { useHoverCard } from "@/hooks/useHoverCard";
import { HoverCard } from "@/components/DramaNode/HoverCard";
import { AnimatePresence } from "framer-motion";

function formatYear(year: number) {
  if (year < 0) return `前${Math.abs(year)}`;
  return String(year);
}

export function Timeline({
  dynasties,
  dramas,
}: {
  dynasties: Dynasty[];
  dramas: Drama[];
}) {
  const orderedDynasties = useMemo(
    () => [...dynasties].sort((a, b) => a.display_order - b.display_order),
    [dynasties],
  );

  const filter = useFilter("all");
  const hover = useHoverCard(200);

  const timelineEntries = useMemo(() => {
    const tkParent = orderedDynasties.find((d) => d.id === "threeKingdoms") ?? null;
    const tkChildren = orderedDynasties.filter((d) => d.parent_id === "threeKingdoms");
    const top = orderedDynasties.filter((d) => d.parent_id === null && d.id !== "threeKingdoms");

    const list: Dynasty[] = [...top];
    if (tkParent) {
      list.push(tkParent, ...tkChildren);
    }
    list.sort((a, b) => a.start_year - b.start_year);
    return list;
  }, [orderedDynasties]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [lineHeight, setLineHeight] = useState(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 10%", "end 50%"],
  });

  const beamHeight = useTransform(scrollYProgress, [0, 1], [0, lineHeight]);
  const beamOpacity = useTransform(scrollYProgress, [0, 0.1], [0, 1]);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(() => {
      if (containerRef.current) {
        setLineHeight(containerRef.current.scrollHeight);
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  return (
    <section className="min-h-screen w-full">
      <div className="mx-auto w-full max-w-5xl px-6 py-12 md:px-10">
        {/* Header */}
        <header className="mb-16">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h1 className="font-[family-name:var(--font-noto-serif)] text-3xl tracking-wide text-[color:var(--fg-primary)]">
                国产历史剧全景时间轴
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-[color:var(--fg-muted)]">
                以朝代为锚点，纵览从战国到民国的历史剧图谱。
              </p>
            </div>
            <div className="pt-1">
              <CategoryFilter value={filter.value} onChange={filter.setValue} />
            </div>
          </div>
        </header>

        {/* HoverCard portal */}
        <AnimatePresence>
          {hover.state.open ? (
            <HoverCard
              key={hover.state.drama.id}
              drama={hover.state.drama}
              anchorRect={hover.state.anchorRect}
              onMouseEnter={hover.cancelClose}
              onMouseLeave={() => hover.scheduleClose(120)}
            />
          ) : null}
        </AnimatePresence>

        {/* Timeline */}
        <div ref={containerRef} className="relative pb-20">
          {/* Vertical line */}
          <div
            className="absolute left-6 top-0 md:left-8"
            style={{ height: lineHeight > 0 ? lineHeight : "100%" }}
          >
            {/* Background track */}
            <div className="absolute inset-0 w-px bg-[color:var(--timeline-gold)]/20" />

            {/* Scroll beam */}
            <motion.div
              className="absolute left-0 top-0 w-px origin-top"
              style={{
                height: beamHeight,
                opacity: beamOpacity,
                background:
                  "linear-gradient(to bottom, transparent, var(--timeline-gold) 10%, var(--timeline-gold) 90%, transparent)",
              }}
            />

            {/* Glow */}
            <motion.div
              className="absolute -left-1 top-0 h-3 w-3 rounded-full"
              style={{
                y: beamHeight,
                opacity: beamOpacity,
                background: "var(--timeline-gold)",
                boxShadow: "0 0 10px 3px color-mix(in oklab, var(--timeline-gold) 50%, transparent)",
              }}
            />
          </div>

          {/* Entries */}
          <div className="space-y-0">
            {timelineEntries.map((dynasty) => {
              const dynastyDramas = dramas
                .filter((d) => d.dynasty_ids.includes(dynasty.id))
                .filter(filter.filterDrama);

              return (
                <TimelineEntry
                  key={dynasty.id}
                  dynasty={dynasty}
                  dramas={dynastyDramas}
                  onDramaHover={hover.open}
                  onDramaLeave={() => hover.scheduleClose(120)}
                />
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function TimelineEntry({
  dynasty,
  dramas,
  onDramaHover,
  onDramaLeave,
}: {
  dynasty: Dynasty;
  dramas: Drama[];
  onDramaHover: (drama: Drama, el: Element) => void;
  onDramaLeave: () => void;
}) {
  const hasDramas = dramas.length > 0;

  return (
    <div className="relative flex gap-8 pb-10 pl-14 md:gap-12 md:pl-20">
      {/* Dot on the line */}
      <div
        className="absolute left-[18px] top-1.5 h-3.5 w-3.5 rounded-full border-2 md:left-[26px]"
        style={{
          backgroundColor: dynasty.color,
          borderColor: "color-mix(in oklab, var(--timeline-gold) 60%, transparent)",
        }}
      />

      {/* Left: sticky dynasty title */}
      <div className="sticky top-20 w-36 shrink-0 self-start pt-0 md:w-44">
        <h3
          className="font-[family-name:var(--font-noto-serif)] text-lg tracking-wide md:text-xl"
          style={{ color: dynasty.color }}
        >
          {dynasty.name}
        </h3>
        <p className="mt-1 text-xs text-[color:var(--fg-muted)]">
          {formatYear(dynasty.start_year)} – {formatYear(dynasty.end_year)}
        </p>
        {dynasty.parent_id ? (
          <p className="mt-1 text-[11px] text-[color:var(--fg-muted)]/60">
            并行政权
          </p>
        ) : null}
      </div>

      {/* Right: drama cards */}
      <div className="min-w-0 flex-1 pt-0.5">
        {hasDramas ? (
          <div className="flex flex-col gap-3">
            {dramas.map((drama) => (
              <DramaRow
                key={drama.id}
                drama={drama}
                onHover={onDramaHover}
                onLeave={onDramaLeave}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-white/10 py-4 text-center text-xs text-[color:var(--fg-muted)]/60">
            暂无收录剧集
          </div>
        )}
      </div>
    </div>
  );
}
