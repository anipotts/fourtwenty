"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import JointSVG from "./JointSVG";
import SmokeCanvas from "./SmokeCanvas";
import { useServerStream } from "../hooks/useServerStream";

export default function SharedJoint() {
  const { state, hit: serverHit } = useServerStream();
  const [flare, setFlare] = useState(false);
  const [burst, setBurst] = useState(false);
  const prevLastHit = useRef(state.lastHit);

  // Detect when someone else hits (lastHit changes but we didn't click)
  useEffect(() => {
    if (state.lastHit > prevLastHit.current) {
      setFlare(true);
      setTimeout(() => setFlare(false), 400);
    }
    prevLastHit.current = state.lastHit;
  }, [state.lastHit]);

  const hit = useCallback(() => {
    serverHit();
    setFlare(true);
    setBurst(true);
    setTimeout(() => setFlare(false), 400);
    setTimeout(() => setBurst(false), 150);
  }, [serverHit]);

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center">
      {/* Smoke particles — emitter tracks cherry position */}
      <div className="relative" style={{ width: 200, height: 80 }}>
        <SmokeCanvas
          width={200}
          height={80}
          emitX={100 + state.length * 55}
          emitY={70}
          burst={burst}
          className="absolute inset-0"
        />
      </div>

      {/* The joint */}
      <button
        onClick={hit}
        className="group cursor-pointer -mt-2 relative"
        aria-label="Hit the joint"
      >
        <JointSVG
          length={state.length}
          flare={flare}
          className="w-40 sm:w-48 transition-transform duration-150 group-hover:scale-105 group-active:scale-95"
        />
      </button>

      {/* Hit counter */}
      <div className="mt-2 flex items-center gap-2">
        <span className="text-emerald-500/60 text-xs tabular-nums">
          {state.hits.toLocaleString()} hits
        </span>
        {state.hits > 0 ? (
          <span className="text-orange-400/40 text-[10px]">
            &bull; tap to hit
          </span>
        ) : (
          <span className="text-emerald-500/40 text-[10px] animate-pulse">
            tap to hit
          </span>
        )}
      </div>
    </div>
  );
}
