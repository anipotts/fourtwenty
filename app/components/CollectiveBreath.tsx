"use client";

import { useEffect, useRef, useState } from "react";
import { getBreathPhase } from "../lib/breath-cycle";

interface CollectiveBreathProps {
  /** Number of active visitors (from SSE stream) */
  visitors?: number;
  /** Server time offset in ms (serverTime - localTime) */
  serverOffset?: number;
}

export default function CollectiveBreath({
  visitors = 1,
  serverOffset = 0,
}: CollectiveBreathProps) {
  const [phase, setPhase] = useState(0.5);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const tick = () => {
      const syncedNow = Date.now() + serverOffset;
      setPhase(getBreathPhase(syncedNow));
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [serverOffset]);

  const scale = 0.85 + phase * 0.3; // 0.85 → 1.15
  const opacity = 0.2 + phase * 0.3; // 0.2 → 0.5

  return (
    <div className="fixed inset-0 z-0 flex items-center justify-center pointer-events-none">
      {/* Breathing circle */}
      <div
        className="rounded-full transition-none"
        style={{
          width: "min(70vw, 70vh)",
          height: "min(70vw, 70vh)",
          transform: `scale(${scale})`,
          opacity,
          background:
            "radial-gradient(circle, rgba(52, 211, 153, 0.15) 0%, rgba(52, 211, 153, 0.05) 50%, transparent 70%)",
        }}
      />

      {/* Visitor count */}
      <div className="absolute flex flex-col items-center gap-1">
        <span className="text-emerald-500/30 text-sm tabular-nums">
          {visitors.toLocaleString()}
        </span>
        <span className="text-emerald-600/20 text-[10px] tracking-widest uppercase">
          {visitors === 1 ? "breathing" : "breathing together"}
        </span>
      </div>
    </div>
  );
}
