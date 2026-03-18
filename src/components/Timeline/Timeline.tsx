"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";

import type { Drama, Dynasty, DynastyId } from "@/types";
import { CategoryFilter } from "@/components/Filter/CategoryFilter";
import { useFilter } from "@/hooks/useFilter";
import { DramaRow } from "@/components/DramaNode/DramaRow";
import { useHoverCard } from "@/hooks/useHoverCard";
import { HoverCard } from "@/components/DramaNode/HoverCard";

/* ─── Layout constants ─── */

const LINE_X = 32;
const CONTENT_LEFT = LINE_X + 48;
const INDENT = 160;
const INDENTED_LINE_X = LINE_X + INDENT;
const INDENTED_CONTENT = INDENTED_LINE_X + 48;

/* ─── Dynasty tree ─── */

type DynastyNode = {
  dynasty: Dynasty;
  children: DynastyNode[];
  isParallel: boolean;
};

function buildTree(dynasties: Dynasty[]): DynastyNode[] {
  const childrenMap = new Map<string, Dynasty[]>();
  const roots: Dynasty[] = [];

  for (const d of dynasties) {
    if (d.parent_id == null) {
      roots.push(d);
    } else {
      const list = childrenMap.get(d.parent_id) ?? [];
      list.push(d);
      childrenMap.set(d.parent_id, list);
    }
  }

  function build(dynasty: Dynasty): DynastyNode {
    const children = (childrenMap.get(dynasty.id) ?? [])
      .sort((a, b) => a.display_order - b.display_order)
      .map((c) => build(c));
    const tracks = new Set(children.map((c) => c.dynasty.track));
    const isParallel = tracks.size > 1;
    return { dynasty, children, isParallel };
  }

  return roots.sort((a, b) => a.display_order - b.display_order).map(build);
}

function collectDescendantIds(node: DynastyNode): DynastyId[] {
  return [node.dynasty.id, ...node.children.flatMap(collectDescendantIds)];
}

function sortChildrenByTrack(children: DynastyNode[]): DynastyNode[] {
  return [...children].sort((a, b) => {
    if (a.dynasty.track === "main") return -1;
    if (b.dynasty.track === "main") return 1;
    return a.dynasty.track.localeCompare(b.dynasty.track);
  });
}

/* ─── Helpers ─── */

function formatYear(year: number) {
  if (year < 0) return `前${Math.abs(year)}`;
  return String(year);
}

/* ─── Root ─── */

export function Timeline({
  dynasties,
  dramas,
}: {
  dynasties: Dynasty[];
  dramas: Drama[];
}) {
  const tree = useMemo(() => buildTree(dynasties), [dynasties]);
  const filter = useFilter("all");
  const hover = useHoverCard(200);

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
      if (containerRef.current)
        setLineHeight(containerRef.current.scrollHeight);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  return (
    <section
      className="min-h-screen"
      style={{ width: "fit-content", minWidth: "100vw" }}
    >
      <div
        className="py-12"
        style={{ paddingLeft: "clamp(80px, 10vw, 200px)", paddingRight: 40 }}
      >
        {/* Header */}
        <header className="mb-16 max-w-4xl">
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

        {/* HoverCard */}
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
          {/* Main vertical line */}
          <div
            className="absolute top-0"
            style={{
              left: LINE_X,
              height: lineHeight > 0 ? lineHeight : "100%",
            }}
          >
            <div className="absolute inset-0 w-px bg-[color:var(--timeline-gold)]/20" />
            <motion.div
              className="absolute left-0 top-0 w-px origin-top"
              style={{
                height: beamHeight,
                opacity: beamOpacity,
                background:
                  "linear-gradient(to bottom, transparent, var(--timeline-gold) 10%, var(--timeline-gold) 90%, transparent)",
              }}
            />
            <motion.div
              className="absolute -left-1 top-0 h-3 w-3 rounded-full"
              style={{
                y: beamHeight,
                opacity: beamOpacity,
                background: "var(--timeline-gold)",
                boxShadow:
                  "0 0 10px 3px color-mix(in oklab, var(--timeline-gold) 50%, transparent)",
              }}
            />
          </div>

          {/* Entries */}
          {tree.map((node) => (
            <EntryNode
              key={node.dynasty.id}
              node={node}
              dramas={dramas}
              filterFn={filter.filterDrama}
              onDramaHover={hover.open}
              onDramaLeave={() => hover.scheduleClose(120)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Entry dispatcher ─── */

function EntryNode({
  node,
  dramas,
  filterFn,
  onDramaHover,
  onDramaLeave,
}: {
  node: DynastyNode;
  dramas: Drama[];
  filterFn: (drama: Drama) => boolean;
  onDramaHover: (drama: Drama, el: Element) => void;
  onDramaLeave: () => void;
}) {
  if (node.isParallel) {
    return (
      <ParallelSection
        node={node}
        dramas={dramas}
        filterFn={filterFn}
        onDramaHover={onDramaHover}
        onDramaLeave={onDramaLeave}
      />
    );
  }

  const allIds = new Set(collectDescendantIds(node));
  const dynastyDramas = dramas
    .filter((d) => d.dynasty_ids.some((id) => allIds.has(id)))
    .filter(filterFn);

  return (
    <SimpleEntry
      dynasty={node.dynasty}
      dramas={dynastyDramas}
      onDramaHover={onDramaHover}
      onDramaLeave={onDramaLeave}
    />
  );
}

/* ─── Simple entry (single track, on main line) ─── */

function SimpleEntry({
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
  return (
    <div className="relative pb-10" style={{ paddingLeft: CONTENT_LEFT }}>
      {/* Dot on main line */}
      <div
        className="absolute top-1.5 h-3.5 w-3.5 rounded-full border-2"
        style={{
          left: LINE_X - 7,
          backgroundColor: dynasty.color,
          borderColor:
            "color-mix(in oklab, var(--timeline-gold) 60%, transparent)",
        }}
      />

      <div className="flex max-w-3xl gap-8 md:gap-12">
        <div className="sticky top-20 w-36 shrink-0 self-start md:w-44">
          <h3
            className="font-[family-name:var(--font-noto-serif)] text-lg tracking-wide md:text-xl"
            style={{ color: dynasty.color }}
          >
            {dynasty.name}
          </h3>
          <p className="mt-1 text-xs text-[color:var(--fg-muted)]">
            {formatYear(dynasty.start_year)} – {formatYear(dynasty.end_year)}
          </p>
        </div>

        <div className="min-w-0 flex-1 pt-0.5">
          {dramas.length > 0 ? (
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
    </div>
  );
}

/* ─── Parallel section (tree-style indented branches) ─── */

function ParallelSection({
  node,
  dramas,
  filterFn,
  onDramaHover,
  onDramaLeave,
}: {
  node: DynastyNode;
  dramas: Drama[];
  filterFn: (drama: Drama) => boolean;
  onDramaHover: (drama: Drama, el: Element) => void;
  onDramaLeave: () => void;
}) {
  const { dynasty, children } = node;
  const sorted = useMemo(() => sortChildrenByTrack(children), [children]);

  const { crossDramas, columnDramasMap } = useMemo(() => {
    const allDescIds = new Set(collectDescendantIds(node));
    const childIdSets = sorted.map((child) => ({
      node: child,
      ids: new Set(collectDescendantIds(child)),
    }));

    const cross: Drama[] = [];
    const colMap = new Map<DynastyId, Drama[]>();
    sorted.forEach((c) => colMap.set(c.dynasty.id, []));

    const relevant = dramas
      .filter((d) => d.dynasty_ids.some((id) => allDescIds.has(id)))
      .filter(filterFn);

    for (const drama of relevant) {
      if (drama.dynasty_ids.includes(dynasty.id)) {
        cross.push(drama);
        continue;
      }
      const matched = childIdSets.filter(({ ids }) =>
        drama.dynasty_ids.some((id) => ids.has(id)),
      );
      if (matched.length > 1) {
        cross.push(drama);
      } else if (matched.length === 1) {
        colMap.get(matched[0].node.dynasty.id)!.push(drama);
      }
    }

    return { crossDramas: cross, columnDramasMap: colMap };
  }, [node, dynasty.id, sorted, dramas, filterFn]);

  return (
    <div className="relative">
      {/* ── Parent marker on main line ── */}
      <div className="relative pb-4" style={{ paddingLeft: CONTENT_LEFT }}>
        <div
          className="absolute top-1.5 h-3.5 w-3.5 rounded-full border-2"
          style={{
            left: LINE_X - 7,
            backgroundColor: dynasty.color,
            borderColor:
              "color-mix(in oklab, var(--timeline-gold) 60%, transparent)",
          }}
        />
        <h3
          className="font-[family-name:var(--font-noto-serif)] text-lg tracking-wide md:text-xl"
          style={{ color: dynasty.color }}
        >
          {dynasty.name}
        </h3>
        <p className="mt-1 text-xs text-[color:var(--fg-muted)]">
          {formatYear(dynasty.start_year)} – {formatYear(dynasty.end_year)}
          <span className="ml-2 text-[color:var(--timeline-gold)]/60">
            并行政权
          </span>
        </p>
      </div>

      {/* ── Cross-regime dramas ── */}
      {crossDramas.length > 0 && (
        <div className="pb-4" style={{ paddingLeft: CONTENT_LEFT }}>
          <p className="mb-2 text-[11px] font-medium tracking-wider uppercase text-[color:var(--fg-muted)]">
            跨政权群像
          </p>
          <div className="flex max-w-md flex-col gap-2">
            {crossDramas.map((drama) => (
              <DramaRow
                key={drama.id}
                drama={drama}
                onHover={onDramaHover}
                onLeave={onDramaLeave}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Indented child branches ── */}
      {sorted.map((child, i) => (
        <IndentedEntry
          key={child.dynasty.id}
          dynasty={child.dynasty}
          dramas={columnDramasMap.get(child.dynasty.id) ?? []}
          isLast={i === sorted.length - 1}
          onDramaHover={onDramaHover}
          onDramaLeave={onDramaLeave}
        />
      ))}

      {/* Bottom spacing after all branches */}
      <div className="h-6" />
    </div>
  );
}

/* ─── Indented entry (one branch in a parallel section) ─── */

function IndentedEntry({
  dynasty,
  dramas,
  isLast,
  onDramaHover,
  onDramaLeave,
}: {
  dynasty: Dynasty;
  dramas: Drama[];
  isLast: boolean;
  onDramaHover: (drama: Drama, el: Element) => void;
  onDramaLeave: () => void;
}) {
  return (
    <div
      className="relative pb-6"
      style={{ paddingLeft: INDENTED_CONTENT, minHeight: 72 }}
    >
      {/* ── Horizontal branch from main line ── */}
      <div
        className="absolute"
        style={{
          left: LINE_X,
          top: 8,
          width: INDENT,
          height: 1,
          background:
            "color-mix(in oklab, var(--timeline-gold) 20%, transparent)",
        }}
      />

      {/* ── Junction dot on main line ── */}
      <div
        className="absolute rounded-full"
        style={{
          left: LINE_X - 3,
          top: 5,
          width: 7,
          height: 7,
          background:
            "color-mix(in oklab, var(--timeline-gold) 35%, transparent)",
        }}
      />

      {/* ── Indented vertical axis ── */}
      <div
        className="absolute w-px"
        style={{
          left: INDENTED_LINE_X,
          top: 8,
          height: isLast ? "calc(100% - 24px)" : "100%",
          background:
            "color-mix(in oklab, var(--timeline-gold) 15%, transparent)",
        }}
      />

      {/* ── Dot on indented axis ── */}
      <div
        className="absolute h-3 w-3 rounded-full border-2"
        style={{
          left: INDENTED_LINE_X - 6,
          top: 2,
          backgroundColor: dynasty.color,
          borderColor:
            "color-mix(in oklab, var(--timeline-gold) 50%, transparent)",
        }}
      />

      {/* ── Content ── */}
      <div className="max-w-md">
        <h4
          className="font-[family-name:var(--font-noto-serif)] text-sm tracking-wide"
          style={{ color: dynasty.color }}
        >
          {dynasty.name}
        </h4>
        <p className="mt-0.5 text-[11px] text-[color:var(--fg-muted)]">
          {formatYear(dynasty.start_year)} – {formatYear(dynasty.end_year)}
        </p>

        <div className="mt-3">
          {dramas.length > 0 ? (
            <div className="flex flex-col gap-2">
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
            <div className="rounded border border-dashed border-white/8 py-3 text-center text-[11px] text-[color:var(--fg-muted)]/40">
              暂无收录
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
