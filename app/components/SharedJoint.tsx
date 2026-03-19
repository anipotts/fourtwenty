"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import JointImage from "./JointImage";
import SmokeCanvas from "./SmokeCanvas";
import { useServerStream } from "../hooks/useServerStream";
import { useHitSound } from "../hooks/useHitSound";

export default function SharedJoint() {
  const { state, hit: serverHit } = useServerStream();
  const { play: playHitSound } = useHitSound(0.12);
  const [flare, setFlare] = useState(false);
  const [burst, setBurst] = useState(false);
  const prevLastHit = useRef(state.lastHit);

  useEffect(() => {
    if (state.lastHit > prevLastHit.current) {
      setFlare(true);
      setTimeout(() => setFlare(false), 400);
    }
    prevLastHit.current = state.lastHit;
  }, [state.lastHit]);

  const hit = useCallback(() => {
    serverHit();
    playHitSound();
    setFlare(true);
    setBurst(true);
    setTimeout(() => setFlare(false), 400);
    setTimeout(() => setBurst(false), 150);
  }, [serverHit, playHitSound]);

  return (
    <div className="flex flex-col items-center">
      {/* Smoke above cherry */}
      <div className="relative" style={{ width: 140, height: 40 }}>
        <SmokeCanvas
          width={140}
          height={40}
          emitX={70}
          emitY={32}
          burst={burst}
          className="absolute inset-0"
        />
      </div>

      {/* Real joint photo with Canvas overlay */}
      <div className="-mt-2">
        <JointImage
          length={state.length}
          flare={flare}
          displayHeight={350}
          onClick={hit}
        />
      </div>

      {/* Hit counter */}
      <span className="mt-3 text-leaf/30 text-xs tabular-nums">
        {state.hits.toLocaleString()} hits
      </span>
    </div>
  );
}
