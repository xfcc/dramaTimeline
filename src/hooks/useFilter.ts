"use client";

import { useState } from "react";

import type { Drama, DramaCategory } from "@/types";

export type CategoryFilterValue = DramaCategory;

export function useFilter(initial: CategoryFilterValue = "serious") {
  const [value, setValue] = useState<CategoryFilterValue>(initial);

  const filterDrama = (drama: Drama) => drama.category === value;

  return { value, setValue, filterDrama };
}

