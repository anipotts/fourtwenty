"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useScrollProgress } from "../hooks/useScrollProgress";
import CannabisLeaf from "./CannabisLeaf";

interface RollingPaperProps {
  onComplete: () => void;
  dark?: boolean;
}

export default function RollingPaper({ onComplete, dark = false }: RollingPaperProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const progress = useScrollProgress(scrollRef);
  const [lit, setLit] = useState(false);
  const hasCompleted = useRef(false);

  const handleComplete = useCallback(() => {
    if (hasCompleted.current) return;
    hasCompleted.current = true;
    setLit(true);
    setTimeout(onComplete, 800);
  }, [onComplete]);

  useEffect(() => {
    if (progress > 0.9 && !hasCompleted.current) {
      handleComplete();
    }
  }, [progress, handleComplete]);

  const textColor = dark ? "text-emerald-400" : "text-leaf-dark";
  const textMuted = dark ? "text-emerald-500/40" : "text-leaf/40";

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-700 ${
        lit ? "opacity-0 pointer-events-none" : "opacity-100"
      } ${dark ? "bg-black" : "bg-cream"}`}
    >
      <div
        ref={scrollRef}
        className="h-full w-full overflow-y-auto overflow-x-hidden scrollbar-none"
      >
        {/* Section 1: Matches the gate screen layout */}
        <section className="min-h-screen flex flex-col items-center justify-center px-6">
          <CannabisLeaf
            className={`w-16 h-16 mb-8 animate-float ${
              dark ? "text-emerald-400" : "text-leaf"
            }`}
          />
          <p className={`text-lg font-medium text-center ${textColor}`}>
            Scroll to roll
          </p>
          <span className={`text-xs mt-2 ${textMuted}`}>↓</span>
        </section>

        {/* Section 2 */}
        <section className="min-h-screen flex flex-col items-center justify-center px-6">
          <p className={`text-4xl font-bold text-center ${textColor}`}>
            4/20
          </p>
          <p className={`text-lg mt-2 ${textMuted}`}>
            NYC &middot; 2026
          </p>
        </section>

        {/* Section 3 */}
        <section className="min-h-screen flex flex-col items-center justify-center px-6">
          <p className={`text-xs tracking-[0.2em] uppercase ${textMuted}`}>
            By scrolling, you confirm you&apos;re 21+
          </p>
        </section>

        {/* Extra scroll space */}
        <div className="h-[50vh]" />
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
        <div className={`h-0.5 w-24 rounded-full overflow-hidden ${dark ? "bg-emerald-900/30" : "bg-leaf/20"}`}>
          <div
            className={`h-full rounded-full transition-all duration-150 ${dark ? "bg-emerald-500/70" : "bg-leaf/60"}`}
            style={{ width: `${Math.min(progress * 100, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
