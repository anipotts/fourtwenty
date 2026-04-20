"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import WebGLJoint from "./WebGLJoint";
import { useServerStream } from "../hooks/useServerStream";
import { useLighterSound } from "../hooks/useLighterSound";

export default function SharedJoint() {
  const { state, hit: serverHit } = useServerStream();
  const { play: playLighter } = useLighterSound(0.18);
  const [flare, setFlare] = useState(false);
  const prevLength = useRef(state.length);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (state.length > prevLength.current + 0.5) playLighter();
    prevLength.current = state.length;
  }, [state.length, playLighter]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const hit = useCallback(() => {
    serverHit();
    setFlare(true);
    timers.current.push(setTimeout(() => setFlare(false), 420));
  }, [serverHit]);

  return (
    <div className="absolute inset-0">
      <WebGLJoint length={state.length} flare={flare} onClick={hit} />

      <div className="absolute bottom-16 left-0 right-0 flex flex-col items-center pointer-events-none z-10">
        <span className="text-leaf/40 text-xs tabular-nums">
          {state.hits.toLocaleString()} hits
        </span>
        <span className="text-leaf/25 text-[10px] mt-1">
          3D model: woddson · CC-BY
        </span>
      </div>
    </div>
  );
}
