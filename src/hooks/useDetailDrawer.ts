"use client";

import { useCallback, useState } from "react";

import type { Drama } from "@/types";

export type DetailDrawerState =
  | { open: false }
  | { open: true; drama: Drama };

export function useDetailDrawer() {
  const [state, setState] = useState<DetailDrawerState>({ open: false });

  const open = useCallback((drama: Drama) => {
    setState({ open: true, drama });
  }, []);

  const close = useCallback(() => {
    setState({ open: false });
  }, []);

  return { state, open, close };
}
