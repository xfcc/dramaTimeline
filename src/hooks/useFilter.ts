"use client";

import { useState } from "react";

import type { Drama, DramaCategory } from "@/types";

export type CategoryFilterValue = "all" | DramaCategory;

export function useFilter(initial: CategoryFilterValue = "all") {
  const [value, setValue] = useState<CategoryFilterValue>(initial);

  const filterDrama = (drama: Drama) => value === "all" || drama.category === value;

  return { value, setValue, filterDrama };
}

