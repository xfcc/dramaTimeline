"use client";

import { AnimatePresence, motion } from "framer-motion";

import type { Drama, Dynasty } from "@/types";
import { HoverCard } from "@/components/DramaNode/HoverCard";
import { useHoverCard } from "@/hooks/useHoverCard";
import { DramaRow } from "@/components/DramaNode/DramaRow";

export function DynastyExpanded({
  dynasty,
  dramas,
}: {
  dynasty: Dynasty;
  dramas: Drama[];
}) {
  const hover = useHoverCard(200);

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="mt-3 w-full"
    >
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

      <div className="rounded-lg border border-white/10 bg-white/3 p-3">
        <div className="mb-3 flex items-baseline justify-between gap-4">
          <div className="font-[family-name:var(--font-noto-serif)] text-base tracking-wide">
            {dynasty.name}
          </div>
          <div className="text-xs text-[color:var(--fg-muted)]">{dramas.length} 部</div>
        </div>

        <motion.div
          layout
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: { staggerChildren: 0.02, delayChildren: 0.02 },
            },
          }}
          className="flex flex-col gap-2"
        >
          <AnimatePresence initial={false}>
            {dramas.map((drama) => (
              <motion.div
                key={drama.id}
                layout
                variants={{
                  hidden: { opacity: 0, y: 6 },
                  show: { opacity: 1, y: 0 },
                }}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ type: "spring", stiffness: 320, damping: 26 }}
              >
                <DramaRow
                  drama={drama}
                  onHover={hover.open}
                  onLeave={() => hover.scheduleClose(120)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.div>
  );
}

