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

  // Detect someone else's hit (cherry flare)
  useEffect(() => {
    if (state.lastHit > prevLastHit.current) {
      setFlare(true);
      setTimeout(() => setFlare(false), 400);
    }
    prevLastHit.current = state.lastHit;
  }, [state.lastHit]);

  // Detect relight (length jumps back to 1)
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

  return (
    <div className="flex flex-col items-center relative">
      {/* Smoke — NO overflow hidden, particles drift freely */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2" style={{ width: 200, height: 80 }}>
        <SmokeCanvas
          width={200}
          height={80}
          emitX={100}
          emitY={70}
          burst={burst}
        />
      </div>

      {/* Real joint photo with Canvas cherry overlay */}
      <JointImage
        length={state.length}
        flare={flare}
        displayHeight={350}
        onClick={hit}
      />

      {/* Hit counter */}
      <span className="mt-3 text-leaf/30 text-xs tabular-nums">
        {state.hits.toLocaleString()} hits
      </span>
    </div>
  );
}
