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
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center">
      <div className="relative" style={{ width: 220, height: 80 }}>
        <SmokeCanvas
          width={220}
          height={80}
          emitX={110 + state.length * 55}
          emitY={65}
          burst={burst}
          className="absolute inset-0"
        />
      </div>

      <button
        onClick={hit}
        className="group cursor-pointer -mt-2 relative"
        aria-label="Hit the joint"
      >
        <JointSVG
          length={state.length}
          flare={flare}
          className="w-44 sm:w-52 transition-transform duration-150 group-hover:scale-105 group-active:scale-95"
        />
      </button>

      <div className="mt-2 flex items-center gap-2">
        <span className="text-leaf-accent/60 text-xs tabular-nums">
          {state.hits.toLocaleString()} hits
        </span>
        {state.hits > 0 ? (
          <span className="text-orange-400/30 text-[10px]">
            &bull; tap to hit
          </span>
        ) : (
          <span className="text-leaf-accent/30 text-[10px] animate-pulse">
            tap to hit
          </span>
        )}
      </div>
    </div>
  );
}
