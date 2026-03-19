"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import JointCanvas from "./JointCanvas";
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
      {/* Smoke particles above the joint */}
      <div className="relative" style={{ width: 160, height: 50 }}>
        <SmokeCanvas
          width={160}
          height={50}
          emitX={80}
          emitY={42}
          burst={burst}
          className="absolute inset-0"
        />
      </div>

      {/* The joint — Canvas 2D, pixel-level rendering */}
      <div className="-mt-2">
        <JointCanvas
          length={state.length}
          flare={flare}
          width={100}
          height={320}
          onClick={hit}
        />
      </div>

      {/* Hit counter */}
      <span className="mt-2 text-leaf/30 text-xs tabular-nums">
        {state.hits.toLocaleString()} hits
      </span>
    </div>
  );
}
