"use client";

import { useCallback, useRef, useEffect } from "react";

export function useLighterSound(volume = 0.2) {
  const ctxRef = useRef<AudioContext | null>(null);

  const getContext = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
    if (ctxRef.current.state === "suspended") {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  const play = useCallback(() => {
    const ctx = getContext();
    const now = ctx.currentTime;

    // === Part 1: The flick/strike — sharp metallic click ===
    const clickDuration = 0.04;
    const clickBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * clickDuration), ctx.sampleRate);
    const clickData = clickBuffer.getChannelData(0);
    for (let i = 0; i < clickData.length; i++) {
      // Sharp impulse with rapid decay
      const t = i / clickData.length;
      clickData[i] = (Math.random() * 2 - 1) * Math.exp(-t * 30) * 0.8;
    }

    const clickSource = ctx.createBufferSource();
    clickSource.buffer = clickBuffer;

    const clickFilter = ctx.createBiquadFilter();
    clickFilter.type = "highpass";
    clickFilter.frequency.value = 2000;
    clickFilter.Q.value = 2;

    const clickGain = ctx.createGain();
    clickGain.gain.setValueAtTime(volume * 1.5, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + clickDuration);

    clickSource.connect(clickFilter);
    clickFilter.connect(clickGain);
    clickGain.connect(ctx.destination);
    clickSource.start(now);
    clickSource.stop(now + clickDuration);

    // === Part 2: The flame ignition — whooshy hiss ===
    const flameDuration = 0.25;
    const flameDelay = 0.03;
    const flameBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * flameDuration), ctx.sampleRate);
    const flameData = flameBuffer.getChannelData(0);
    for (let i = 0; i < flameData.length; i++) {
      flameData[i] = (Math.random() * 2 - 1) * 0.4;
    }

    const flameSource = ctx.createBufferSource();
    flameSource.buffer = flameBuffer;

    const flameBandpass = ctx.createBiquadFilter();
    flameBandpass.type = "bandpass";
    flameBandpass.frequency.setValueAtTime(3000, now + flameDelay);
    flameBandpass.frequency.linearRampToValueAtTime(1200, now + flameDelay + flameDuration);
    flameBandpass.Q.value = 0.6;

    const flameGain = ctx.createGain();
    flameGain.gain.setValueAtTime(0, now + flameDelay);
    flameGain.gain.linearRampToValueAtTime(volume * 0.6, now + flameDelay + 0.03);
    flameGain.gain.setValueAtTime(volume * 0.5, now + flameDelay + 0.08);
    flameGain.gain.exponentialRampToValueAtTime(0.001, now + flameDelay + flameDuration);

    flameSource.connect(flameBandpass);
    flameBandpass.connect(flameGain);
    flameGain.connect(ctx.destination);
    flameSource.start(now + flameDelay);
    flameSource.stop(now + flameDelay + flameDuration);
  }, [getContext, volume]);

  useEffect(() => {
    return () => {
      if (ctxRef.current) {
        ctxRef.current.close();
        ctxRef.current = null;
      }
    };
  }, []);

  return { play };
}
