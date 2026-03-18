"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { Drama } from "@/types";

type AnchorRect = Pick<DOMRect, "left" | "top" | "width" | "height">;

export type HoverCardState =
  | { open: false }
  | {
      open: true;
      drama: Drama;
      anchorRect: AnchorRect;
    };

export function useHoverCard(delayMs = 200) {
  const [state, setState] = useState<HoverCardState>({ open: false });
  const timerRef = useRef<number | null>(null);
  const closeTimerRef = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current != null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const open = useCallback(
    (drama: Drama, anchorEl: Element) => {
      clearTimer();
      clearCloseTimer();
      const rect = anchorEl.getBoundingClientRect();
      timerRef.current = window.setTimeout(() => {
        setState({
          open: true,
          drama,
          anchorRect: {
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
          },
        });
      }, delayMs);
    },
    [clearCloseTimer, clearTimer, delayMs],
  );

  const close = useCallback(() => {
    clearTimer();
    clearCloseTimer();
    setState({ open: false });
  }, [clearCloseTimer, clearTimer]);

  const scheduleClose = useCallback(
    (delay = 120) => {
      clearTimer();
      clearCloseTimer();
      closeTimerRef.current = window.setTimeout(() => {
        setState({ open: false });
      }, delay);
    },
    [clearCloseTimer, clearTimer],
  );

  const cancelClose = useCallback(() => {
    clearCloseTimer();
  }, [clearCloseTimer]);

  useEffect(() => {
    return () => {
      clearTimer();
      clearCloseTimer();
    };
  }, [clearCloseTimer, clearTimer]);

  const api = useMemo(
    () => ({ state, open, close, scheduleClose, cancelClose }),
    [state, open, close, scheduleClose, cancelClose],
  );
  return api;
}

