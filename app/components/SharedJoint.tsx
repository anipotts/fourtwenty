"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import JointImage, { getBurnPct } from "./JointImage";
import SmokeCanvas from "./SmokeCanvas";
import { useServerStream } from "../hooks/useServerStream";
import { useLighterSound } from "../hooks/useLighterSound";

export default function SharedJoint() {
  const { state, hit: serverHit } = useServerStream();
  const { play: playLighter } = useLighterSound(0.18);
  const [flare, setFlare] = useState(false);
  const [burst, setBurst] = useState(false);
  const prevLength = useRef(state.length);

  // Lighter sound on relight
  useEffect(() => {
    if (state.length > prevLength.current + 0.5) playLighter();
    prevLength.current = state.length;
  }, [state.length, playLighter]);

  const hit = useCallback(() => {
    serverHit();
    setFlare(true);
    setBurst(true);
    setTimeout(() => setFlare(false), 400);
    setTimeout(() => setBurst(false), 150);
  }, [serverHit]);

  const burnPct = getBurnPct(state.length);

  return (
    <div className="flex flex-col items-center relative">
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
        onClick={hit}
      />

      <span className="mt-3 text-leaf/30 text-xs tabular-nums">
        {state.hits.toLocaleString()} hits
      </span>
    </div>
  );
}
