"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import JointImage from "./JointImage";
import SmokeCanvas from "./SmokeCanvas";
import { useServerStream } from "../hooks/useServerStream";
import { useLighterSound } from "../hooks/useLighterSound";

export default function SharedJoint() {
  const { state, hit: serverHit } = useServerStream();
  const { play: playLighter } = useLighterSound(0.18);
  const [flare, setFlare] = useState(false);
  const [burst, setBurst] = useState(false);
  const [burnPct, setBurnPct] = useState(6);
  const prevLength = useRef(state.length);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (state.length > prevLength.current + 0.5) playLighter();
    prevLength.current = state.length;
  }, [state.length, playLighter]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => timers.current.forEach(clearTimeout);
  }, []);

  const hit = useCallback(() => {
    serverHit();
    setFlare(true);
    setBurst(true);
    timers.current.push(setTimeout(() => setFlare(false), 400));
    timers.current.push(setTimeout(() => setBurst(false), 150));
  }, [serverHit]);

  return (
    <div className="flex flex-col items-center relative">
      {/* Smoke — synced to animated burn position via onBurnY */}
      <div
        className="absolute left-1/2 -translate-x-1/2 pointer-events-none z-10"
        style={{ top: `calc(${burnPct}% - 50px)`, width: 160, height: 60 }}
      >
        <SmokeCanvas width={160} height={60} emitX={80} emitY={50} burst={burst} />
      </div>

      <JointImage
        length={state.length}
        flare={flare}
        height={400}
        onBurnY={setBurnPct}
        onClick={hit}
      />

      <span className="mt-3 text-leaf/30 text-xs tabular-nums">
        {state.hits.toLocaleString()} hits
      </span>
    </div>
  );
}
