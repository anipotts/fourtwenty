"use client";

import { useCallback, useRef, useEffect } from "react";

export function useHitSound(volume = 0.15) {
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
    const duration = 0.2;

    // --- Breathy inhale noise ---
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    // Bandpass filter — shapes white noise into a breathy inhale character
    const bandpass = ctx.createBiquadFilter();
    bandpass.type = "bandpass";
    bandpass.frequency.setValueAtTime(800, now);
    bandpass.frequency.linearRampToValueAtTime(400, now + duration);
    bandpass.Q.value = 0.8;

    // Highpass to remove low rumble
    const highpass = ctx.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.value = 200;
    highpass.Q.value = 0.5;

    // Envelope — quick attack, sustained body, soft tail
    const envelope = ctx.createGain();
    envelope.gain.setValueAtTime(0, now);
    envelope.gain.linearRampToValueAtTime(volume, now + 0.015);
    envelope.gain.setValueAtTime(volume, now + duration * 0.6);
    envelope.gain.exponentialRampToValueAtTime(0.001, now + duration);

    // --- Subtle tonal undertone (simulates throat resonance) ---
    const tone = ctx.createOscillator();
    tone.type = "sine";
    tone.frequency.setValueAtTime(120, now);
    tone.frequency.linearRampToValueAtTime(80, now + duration);

    const toneGain = ctx.createGain();
    toneGain.gain.setValueAtTime(0, now);
    toneGain.gain.linearRampToValueAtTime(volume * 0.08, now + 0.02);
    toneGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    // Wire noise path
    noise.connect(bandpass);
    bandpass.connect(highpass);
    highpass.connect(envelope);
    envelope.connect(ctx.destination);

    // Wire tone path
    tone.connect(toneGain);
    toneGain.connect(ctx.destination);

    // Play
    noise.start(now);
    noise.stop(now + duration);
    tone.start(now);
    tone.stop(now + duration);
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
