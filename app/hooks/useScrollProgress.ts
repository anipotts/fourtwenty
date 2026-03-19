"use client";

import { useState, useEffect, useCallback, RefObject } from "react";

export function useScrollProgress(ref: RefObject<HTMLElement | null>): number {
  const [progress, setProgress] = useState(0);

  const handleScroll = useCallback(() => {
    const el = ref.current;
    if (!el) return;

    const isHorizontal = el.scrollWidth > el.clientWidth + 10;

    if (isHorizontal) {
      const max = el.scrollWidth - el.clientWidth;
      setProgress(max > 0 ? el.scrollLeft / max : 0);
    } else {
      const max = el.scrollHeight - el.clientHeight;
      setProgress(max > 0 ? el.scrollTop / max : 0);
    }
  }, [ref]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [ref, handleScroll]);

  return progress;
}
