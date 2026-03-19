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
  const prevLastHit = useRef(state.lastHit);
  const prevLength = useRef(state.length);

  useEffect(() => {
    if (state.lastHit > prevLastHit.current) {
      setFlare(true);
      setTimeout(() => setFlare(false), 400);
    }
    prevLastHit.current = state.lastHit;
  }, [state.lastHit]);

  useEffect(() => {
    if (state.length > prevLength.current + 0.5) {
      playLighter();
    }
    prevLength.current = state.length;
  }, [state.length, playLighter]);

  const hit = useCallback(() => {
    serverHit();
    setFlare(true);
    setBurst(true);
    setTimeout(() => setFlare(false), 400);
    setTimeout(() => setBurst(false), 150);
  }, [serverHit]);

  // Smoke position tracks the burn line
  const burnPct = 6 + (100 - 6 - 16) * (1 - Math.max(state.length, 0.01));

  return (
    <div className="flex flex-col items-center relative">
      {/* Smoke — positioned at the burn point */}
      <div
        className="absolute left-1/2 -translate-x-1/2 pointer-events-none z-10"
        style={{
          top: `calc(${burnPct}% - 60px)`,
          width: 160,
          height: 60,
        }}
      >
        <SmokeCanvas
          width={160}
          height={60}
          emitX={80}
          emitY={52}
          burst={burst}
        />
      </div>

      {/* Joint */}
      <JointImage
        length={state.length}
        flare={flare}
        className="h-[350px] sm:h-[400px]"
        onClick={hit}
      />

      {/* Hit counter */}
      <span className="mt-3 text-leaf/30 text-xs tabular-nums">
        {state.hits.toLocaleString()} hits
      </span>
    </div>
  );
}
