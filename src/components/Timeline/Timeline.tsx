"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

import type { Drama, Dynasty, DynastyId } from "@/types";
import { CategoryFilter } from "@/components/Filter/CategoryFilter";
import { useFilter } from "@/hooks/useFilter";
import { useDetailDrawer } from "@/hooks/useDetailDrawer";
import { DetailDrawerPortal } from "@/components/DetailDrawer/DetailDrawer";
import { DramaCard } from "@/components/DramaNode/DramaRow";

/* ─── Layout: left = timeline axis, right = drama area ─── */

const LEFT_COL_WIDTH = 280;
const LINE_X = 32;
const LABEL_LEFT = LINE_X + 48;
const INDENT = 140;
const INDENTED_LINE_X = LINE_X + INDENT;

/* ─── Dynasty tree ─── */

type DynastyNode = {
  dynasty: Dynasty;
  children: DynastyNode[];
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
    return { dynasty, children };
  }

  return roots.sort((a, b) => a.display_order - b.display_order).map(build);
}

function collectDescendantIds(node: DynastyNode): DynastyId[] {
  return [node.dynasty.id, ...node.children.flatMap(collectDescendantIds)];
}

function formatYear(year: number) {
  if (year < 0) return `前${Math.abs(year)}`;
  return String(year);
}

/* ─── Row type for two-column layout ─── */

type TimelineRow = {
  key: string;
  left: React.ReactNode;
  right: React.ReactNode;
};

/* ─── Root ─── */

export function Timeline({
  dynasties,
  dramas,
}: {
  dynasties: Dynasty[];
  dramas: Drama[];
}) {
  const tree = useMemo(() => buildTree(dynasties), [dynasties]);
  const filter = useFilter("serious");
  const drawer = useDetailDrawer();

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

  const rows = useMemo(
    () =>
      buildTimelineRows(tree, dramas, filter.filterDrama, {
        formatYear,
        onDramaClick: drawer.open,
      }),
    [tree, dramas, filter.filterDrama, drawer.open],
  );

  return (
    <section
      className="min-h-screen"
      style={{ width: "fit-content", minWidth: "100vw" }}
    >
      <div
        className="py-12"
        style={{ paddingLeft: "clamp(80px, 10vw, 200px)", paddingRight: 40 }}
      >
        <header className="mb-16 max-w-4xl">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h1 className="font-[family-name:var(--font-noto-serif)] text-3xl tracking-wide text-[color:var(--fg-primary)]">
                华夏剧典
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

        <DetailDrawerPortal
          state={drawer.state}
          dynasties={dynasties}
          onClose={drawer.close}
        />

        <div ref={containerRef} className="relative pb-6">
          {/* Axis outside grid: fixed height = content height so line is visible while scrolling */}
          <div
            className="pointer-events-none absolute left-0 top-0 z-10"
            style={{
              width: LEFT_COL_WIDTH,
              height: lineHeight > 0 ? lineHeight : "100%",
            }}
          >
            <div
              className="absolute top-0 w-px"
              style={{
                left: LINE_X,
                height: "100%",
                background:
                  "color-mix(in oklab, var(--timeline-gold) 45%, transparent)",
              }}
            />
            <motion.div
              className="absolute left-0 top-0 w-px origin-top"
              style={{
                left: LINE_X,
                height: beamHeight,
                opacity: beamOpacity,
                background:
                  "linear-gradient(to bottom, transparent, var(--timeline-gold) 10%, var(--timeline-gold) 90%, transparent)",
              }}
            />
          </div>

          <div
            className="grid"
            style={{
              gridTemplateColumns: `${LEFT_COL_WIDTH}px 1fr`,
              gridAutoRows: "minmax(60px, auto)",
              alignItems: "start",
            }}
          >
            {/* Row pairs: left cell (col 1) + right cell (col 2); content z-20 so above axis */}
            {rows.map((r, i) => [
              <div
                key={`${r.key}-left`}
                className="relative z-0"
                style={{ gridColumn: 1, gridRow: i + 1 }}
              >
                {r.left}
              </div>,
              <div
                key={`${r.key}-right`}
                className="min-w-0 pl-6"
                style={{ gridColumn: 2, gridRow: i + 1 }}
              >
                <div className={i === rows.length - 1 ? "" : "pb-6"}>{r.right}</div>
              </div>,
            ])}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Build flat rows for two-column grid ─── */

function buildTimelineRows(
  tree: DynastyNode[],
  dramas: Drama[],
  filterFn: (d: Drama) => boolean,
  ctx: {
    formatYear: (y: number) => string;
    onDramaClick: (drama: Drama) => void;
  },
): TimelineRow[] {
  const out: TimelineRow[] = [];

  for (const node of tree) {
    const allIds = new Set(collectDescendantIds(node));
    const dynastyDramas = dramas
      .filter((d) => allIds.has(d.dynasty_id))
      .filter(filterFn);
    out.push({
      key: `simple-${node.dynasty.id}`,
      left: (
        <LeftCellMain dynasty={node.dynasty} formatYear={ctx.formatYear} />
      ),
      right: (
        <RightCellDramas
          dramas={dynastyDramas}
          onDramaClick={ctx.onDramaClick}
        />
      ),
    });
  }

  return out;
}

/* ─── Left cell: main axis dot + label ─── */

function LeftCellMain({
  dynasty,
  formatYear,
  labelExtra,
}: {
  dynasty: Dynasty;
  formatYear: (y: number) => string;
  labelExtra?: string;
}) {
  return (
    <div className="relative z-20 pt-1" style={{ paddingLeft: LABEL_LEFT }}>
      <div
        className="absolute top-2.5 h-3.5 w-3.5 rounded-full border-2"
        style={{
          left: LINE_X - 7,
          backgroundColor: dynasty.color,
          borderColor:
            "color-mix(in oklab, var(--timeline-gold) 60%, transparent)",
        }}
      />
      <div className="sticky top-20">
        <h3
          className="font-[family-name:var(--font-noto-serif)] text-lg tracking-wide md:text-xl"
          style={{ color: dynasty.color }}
        >
          {dynasty.name}
        </h3>
        <p className="mt-1 text-xs text-[color:var(--fg-muted)]">
          {formatYear(dynasty.start_year)} – {formatYear(dynasty.end_year)}
          {labelExtra ? (
            <span className="ml-2 text-[color:var(--timeline-gold)]/60">
              {labelExtra}
            </span>
          ) : null}
        </p>
      </div>
    </div>
  );
}

/* ─── Right cell: drama list (aligned column) ─── */

function RightCellDramas({
  dramas,
  title,
  onDramaClick,
}: {
  dramas: Drama[];
  title?: string;
  onDramaClick: (drama: Drama) => void;
}) {
  return (
    <div className="min-w-0 max-w-2xl pt-0.5">
      {title && dramas.length > 0 ? (
        <p className="mb-2 text-[11px] font-medium tracking-wider uppercase text-[color:var(--fg-muted)]">
          {title}
        </p>
      ) : null}
      {dramas.length > 0 ? (
        <div className="flex flex-wrap gap-4">
          {dramas.map((drama) => (
            <DramaCard
              key={drama.id}
              drama={drama}
              onClick={onDramaClick}
            />
          ))}
        </div>
      ) : (
        <div className="w-[280px] rounded-lg border border-dashed border-white/10 py-4 text-center text-xs text-[color:var(--fg-muted)]/60">
          暂无收录剧集
        </div>
      )}
    </div>
  );
}
