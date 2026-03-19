"use client";

import { useState, useEffect, useCallback } from "react";

interface VaultLockProps {
  dark?: boolean;
}

function getNextFourTwenty(): { target: Date; isNow: boolean } {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();

  if ((h === 4 || h === 16) && m === 20) {
    return { target: now, isNow: true };
  }

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

export default function VaultLock({ dark = true }: VaultLockProps) {
  const [unlocked, setUnlocked] = useState(false);
  const [countdown, setCountdown] = useState("");

  const checkTime = useCallback(() => {
    const { target, isNow } = getNextFourTwenty();
    setUnlocked(isNow);
    if (isNow) {
      const remaining = 60_000 - new Date().getSeconds() * 1000;
      setCountdown(formatCountdown(remaining));
    } else {
      setCountdown(formatCountdown(target.getTime() - Date.now()));
    }
  }, []);

  useEffect(() => {
    checkTime();
    const interval = setInterval(checkTime, 1000);
    return () => clearInterval(interval);
  }, [checkTime]);

  const muted = dark ? "text-emerald-600/30" : "text-leaf/30";
  const accent = dark ? "text-emerald-400/60" : "text-leaf/60";

  if (unlocked) {
    return (
      <div className="mt-8 text-center animate-scale-in">
        <p className={`text-sm ${accent}`}>April 20, 2026</p>
        <p className={`text-xs mt-2 ${muted}`}>
          Details dropping soon.
        </p>
        <span className={`text-[10px] mt-3 block tabular-nums ${muted}`}>
          {countdown} remaining
        </span>
      </div>
    );
  }

  return (
    <div className="mt-8 flex flex-col items-center gap-2">
      <span className={`text-2xl font-mono tabular-nums tracking-wider ${accent}`}>
        {countdown}
      </span>
      <span className={`text-[10px] tracking-[0.2em] uppercase ${muted}`}>
        unlocks at 4:20
      </span>
    </div>
  );
}
