"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import WebGLJoint from "./WebGLJoint";
import { useServerStream } from "../hooks/useServerStream";
import { useLighterSound } from "../hooks/useLighterSound";

export default function SharedJoint() {
  const [flash, setFlash] = useState(false);
  const [flare, setFlare] = useState(false);
  const flashTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const flareTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const prevPhaseRef = useRef<string>("unlit");

  const triggerCelebration = useCallback(() => {
    setFlash(true);
    flashTimers.current.push(setTimeout(() => setFlash(false), 400));
  }, []);

  const { state, hit: serverHit } = useServerStream(triggerCelebration);
  const { play: playLighter } = useLighterSound(0.18);

  // Play lighter sound on unlit → lit (first hit of a new cycle)
  useEffect(() => {
    if (prevPhaseRef.current === "unlit" && state.phase === "lit") {
      playLighter();
    }
    prevPhaseRef.current = state.phase;
  }, [state.phase, playLighter]);

  useEffect(() => {
    const timers = flashTimers.current;
    const flares = flareTimers.current;
    return () => {
      timers.forEach(clearTimeout);
      flares.forEach(clearTimeout);
    };
  }, []);

  const hit = useCallback(() => {
    // Ignore input during rolling animation (matches server)
    if (state.phase === "rolling") return;
    serverHit();
    setFlare(true);
    flareTimers.current.push(setTimeout(() => setFlare(false), 420));
  }, [serverHit, state.phase]);

  return (
    <div className="absolute inset-0">
      <WebGLJoint
        length={state.length}
        phase={state.phase}
        rollingStartedAt={state.rollingStartedAt}
        flare={flare}
        onClick={hit}
      />

      {/* 420-hit celebration flash */}
      <div
        className={`pointer-events-none absolute inset-0 transition-opacity duration-300 ${
          flash ? "opacity-40" : "opacity-0"
        }`}
        style={{
          background:
            "radial-gradient(circle at center, rgba(255,180,60,0.55), rgba(255,80,20,0.25) 40%, transparent 75%)",
          mixBlendMode: "screen",
        }}
      />

      {/* Hits counter + phase label + credit */}
      <div className="absolute bottom-16 left-0 right-0 flex flex-col items-center pointer-events-none z-10">
        <span className="text-leaf/40 text-xs tabular-nums">
          {state.hits.toLocaleString()} hits
        </span>
        <span className="text-leaf/20 text-[10px] mt-1 tracking-wide uppercase">
          {state.phase === "rolling"
            ? "rolling…"
            : state.phase === "unlit"
              ? "tap to light"
              : state.phase === "roach"
                ? "roach · keep hitting"
                : "burning"}
        </span>
      </div>
    </div>
  );
}
