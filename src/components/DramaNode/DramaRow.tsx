"use client";

import { motion } from "framer-motion";

import type { Drama } from "@/types";

const POSTER_W = 120;
const POSTER_H = 180;

function formatRating(rating: number | null) {
  if (rating == null) return null;
  return rating.toFixed(1);
}

export function DramaCard({
  drama,
  onClick,
}: {
  drama: Drama;
  onClick?: (drama: Drama) => void;
}) {
  const rating = formatRating(drama.douban_rating);

  return (
    <motion.button
      type="button"
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      onClick={() => onClick?.(drama)}
      className="group flex w-[120px] flex-col text-left"
    >
      {/* Poster */}
      <div
        className="relative overflow-hidden rounded-lg bg-white/8 shadow-[0_4px_16px_rgba(0,0,0,0.3)] transition-shadow group-hover:shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
        style={{ width: POSTER_W, height: POSTER_H }}
      >
        {drama.poster_url ? (
          <img
            src={drama.poster_url}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[color:var(--fg-muted)]/25">
            <svg
              className="h-10 w-10"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
              />
            </svg>
          </div>
        )}

        {/* Rating badge */}
        {rating ? (
          <div className="absolute right-1.5 top-1.5 rounded bg-black/60 px-1.5 py-0.5 text-xs font-medium text-[color:var(--timeline-gold)] backdrop-blur-sm">
            {rating}
          </div>
        ) : null}
      </div>

      {/* Title */}
      <p className="mt-2 line-clamp-2 text-xs font-medium leading-snug text-[color:var(--fg-primary)] group-hover:text-[color:var(--timeline-gold)]">
        {drama.title}
      </p>

      {/* Year */}
      <p className="mt-0.5 text-[10px] text-[color:var(--fg-muted)]">
        {drama.release_year}
      </p>
    </motion.button>
  );
}
