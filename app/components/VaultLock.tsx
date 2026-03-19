"use client";

import { useState, useEffect, useCallback } from "react";

const UNLOCK_DURATION_MS = 60_000; // 60 seconds

function getNextFourTwenty(): { target: Date; isNow: boolean } {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();

  // Check if we're currently in a 4:20 window (4:20:00 - 4:20:59)
  if ((h === 4 || h === 16) && m === 20) {
    return { target: now, isNow: true };
  }

  // Find next 4:20
  const today420AM = new Date(now);
  today420AM.setHours(4, 20, 0, 0);

  const today420PM = new Date(now);
  today420PM.setHours(16, 20, 0, 0);

  const tomorrow420AM = new Date(now);
  tomorrow420AM.setDate(tomorrow420AM.getDate() + 1);
  tomorrow420AM.setHours(4, 20, 0, 0);

  const candidates = [today420AM, today420PM, tomorrow420AM].filter(
    (d) => d.getTime() > now.getTime()
  );

  return { target: candidates[0], isNow: false };
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return "0:00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export default function VaultLock() {
  const [unlocked, setUnlocked] = useState(false);
  const [countdown, setCountdown] = useState("");
  const [unlockProgress, setUnlockProgress] = useState(0); // 0..1 for the 60s window

  const checkTime = useCallback(() => {
    const { target, isNow } = getNextFourTwenty();

    if (isNow) {
      setUnlocked(true);
      const now = new Date();
      const secondsIn = now.getSeconds();
      setUnlockProgress(secondsIn / 60);

      // Auto-lock when the minute is over
      const remaining = UNLOCK_DURATION_MS - secondsIn * 1000;
      setCountdown(formatCountdown(remaining));
    } else {
      setUnlocked(false);
      setUnlockProgress(0);
      const ms = target.getTime() - Date.now();
      setCountdown(formatCountdown(ms));
    }
  }, []);

  useEffect(() => {
    checkTime();
    const interval = setInterval(checkTime, 1000);
    return () => clearInterval(interval);
  }, [checkTime]);

  return (
    <div className="relative w-full max-w-sm mx-auto mt-12">
      {!unlocked ? (
        /* Locked state — keyhole with glow */
        <div className="flex flex-col items-center gap-6 animate-fade-in">
          {/* Keyhole */}
          <div className="relative w-20 h-28 flex items-center justify-center">
            {/* Glow behind keyhole */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="w-16 h-16 rounded-full animate-pulse"
                style={{
                  background:
                    "radial-gradient(circle, rgba(52,211,153,0.3) 0%, transparent 70%)",
                }}
              />
            </div>

            {/* Keyhole shape */}
            <svg viewBox="0 0 60 90" className="w-12 h-18 relative z-10">
              {/* Circle part */}
              <circle
                cx="30"
                cy="30"
                r="14"
                fill="none"
                stroke="rgba(52,211,153,0.4)"
                strokeWidth="2"
              />
              {/* Inner glow */}
              <circle cx="30" cy="30" r="8" fill="rgba(52,211,153,0.15)" />
              {/* Slot part */}
              <path
                d="M24 38 L30 75 L36 38 Z"
                fill="none"
                stroke="rgba(52,211,153,0.3)"
                strokeWidth="1.5"
              />
              <path
                d="M26 40 L30 70 L34 40 Z"
                fill="rgba(52,211,153,0.1)"
              />
            </svg>
          </div>

          {/* Countdown */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-emerald-500/50 text-[10px] tracking-[0.3em] uppercase">
              Next unlock
            </span>
            <span className="text-emerald-400/70 text-2xl font-mono tabular-nums tracking-wider">
              {countdown}
            </span>
            <span className="text-emerald-600/30 text-[10px]">
              Opens at 4:20 AM &amp; PM
            </span>
          </div>
        </div>
      ) : (
        /* Unlocked state — event details revealed */
        <div className="flex flex-col items-center gap-6 animate-scale-in">
          {/* Unlock progress bar (60s countdown) */}
          <div className="w-full max-w-[200px] h-0.5 rounded-full bg-emerald-900/30 overflow-hidden">
            <div
              className="h-full bg-emerald-400/60 transition-all duration-1000 ease-linear"
              style={{ width: `${(1 - unlockProgress) * 100}%` }}
            />
          </div>

          {/* Event details */}
          <div className="text-center space-y-3">
            <p className="text-emerald-300 text-2xl sm:text-3xl font-bold">
              4/20 in NYC
            </p>
            <p className="text-emerald-400/60 text-sm">
              April 20, 2026
            </p>
            <p className="text-emerald-500/40 text-xs leading-relaxed max-w-[250px]">
              Details dropping soon. Keep hitting the joint. Keep breathing. Keep coming back at 4:20.
            </p>
          </div>

          {/* Time remaining */}
          <span className="text-orange-400/40 text-[10px] tabular-nums">
            {countdown} remaining
          </span>
        </div>
      )}
    </div>
  );
}
