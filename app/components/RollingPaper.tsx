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
  const textMuted = dark ? "text-emerald-500/30" : "text-leaf/30";

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-700 ${
        lit ? "opacity-0 pointer-events-none" : "opacity-100"
      } ${dark ? "bg-black" : "bg-cream"}`}
    >
      {/* Horizontal scroll container — hidden scrollbar */}
      <div
        ref={scrollRef}
        className="h-full w-full flex flex-row overflow-x-auto overflow-y-hidden scrollbar-none"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <section className="flex-shrink-0 w-screen h-full flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <CannabisLeaf
              className={`w-12 h-12 animate-float ${dark ? "text-emerald-400" : "text-leaf"}`}
            />
            <span className={`text-sm ${textMuted}`}>→</span>
          </div>
        </section>

        <section className="flex-shrink-0 w-screen h-full flex items-center justify-center">
          <p className={`text-3xl font-bold ${textColor}`}>4/20</p>
        </section>

        <section className="flex-shrink-0 w-screen h-full flex items-center justify-center">
          <p className={`text-lg ${textMuted}`}>NYC &middot; 2026</p>
        </section>

        <section className="flex-shrink-0 w-screen h-full flex items-center justify-center">
          <p className={`text-[10px] tracking-[0.2em] uppercase ${textMuted}`}>
            By scrolling, you confirm you&apos;re 21+
          </p>
        </section>

        {/* Extra scroll space to hit 100% */}
        <div className="flex-shrink-0 w-[50vw] h-full" />
      </div>

      {/* Progress */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <div className={`h-px w-16 rounded-full overflow-hidden ${dark ? "bg-emerald-900/20" : "bg-leaf/15"}`}>
          <div
            className={`h-full rounded-full transition-all duration-100 ${dark ? "bg-emerald-500/50" : "bg-leaf/40"}`}
            style={{ width: `${Math.min(progress * 100, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
