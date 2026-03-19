"use client";

import type { CategoryFilterValue } from "@/hooks/useFilter";

function OptionButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "relative px-3 py-1 text-sm transition-colors",
        active ? "text-[color:var(--fg-primary)]" : "text-[color:var(--fg-muted)] hover:text-[color:var(--fg-primary)]",
      ].join(" ")}
    >
      {label}
      {active ? (
        <span className="absolute -bottom-1 left-2 right-2 h-px bg-[color:var(--timeline-gold)]" />
      ) : null}
    </button>
  );
}

export function CategoryFilter({
  value,
  onChange,
}: {
  value: CategoryFilterValue;
  onChange: (v: CategoryFilterValue) => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2 py-1 backdrop-blur-md">
      <OptionButton
        label="严肃正剧"
        active={value === "serious"}
        onClick={() => onChange("serious")}
      />
      <div className="h-4 w-px bg-white/10" />
      <OptionButton
        label="史事演义"
        active={value === "romance"}
        onClick={() => onChange("romance")}
      />
    </div>
  );
}

