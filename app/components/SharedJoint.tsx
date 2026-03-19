"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import JointSVG from "./JointSVG";
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
      {/* Smoke — positioned above the joint cherry */}
      <div className="relative" style={{ width: 160, height: 60 }}>
        <SmokeCanvas
          width={160}
          height={60}
          emitX={80}
          emitY={50}
          burst={burst}
          className="absolute inset-0"
        />
      </div>

      {/* The joint — vertical, centered, big */}
      <button
        onClick={hit}
        className="cursor-pointer -mt-4 hover:scale-105 active:scale-95 transition-transform duration-150"
        aria-label="Hit the joint"
      >
        <JointSVG
          length={state.length}
          flare={flare}
          className="h-64 sm:h-80"
        />
      </button>

      {/* Hit counter — subtle, below */}
      <span className="mt-4 text-leaf/40 text-xs tabular-nums">
        {state.hits.toLocaleString()} hits
      </span>
    </div>
  );
}
