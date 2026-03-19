"use client";

import { useEffect, useState } from "react";

/**
 * Fetches server time once and returns the offset (serverTime - localTime).
 * This offset can be used to sync animations with other clients.
 */
export function useServerTime(): number {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const fetchTime = async () => {
      try {
        const before = Date.now();
        const res = await fetch("/api/time");
        const after = Date.now();
        const { serverTime } = await res.json();

        // Account for network latency (use midpoint)
        const localMidpoint = (before + after) / 2;
        setOffset(serverTime - localMidpoint);
      } catch {
        // Use local clock if server is unreachable
        setOffset(0);
      }
    };

    fetchTime();
  }, []);

  return offset;
}
