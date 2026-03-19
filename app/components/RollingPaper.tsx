"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useScrollProgress } from "../hooks/useScrollProgress";
import { useMediaQuery } from "../hooks/useMediaQuery";
import CannabisLeaf from "./CannabisLeaf";

interface RollingPaperProps {
  onComplete: () => void;
}

export default function RollingPaper({ onComplete }: RollingPaperProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const progress = useScrollProgress(scrollRef);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [lit, setLit] = useState(false);
  const hasCompleted = useRef(false);

  // Desktop: translate wheel Y → horizontal scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !isDesktop) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      el.scrollLeft += e.deltaY + e.deltaX;
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [isDesktop]);

  // Fire completion when progress hits ~95%
  const handleComplete = useCallback(() => {
    if (hasCompleted.current) return;
    hasCompleted.current = true;
    setLit(true);
    setTimeout(onComplete, 1200);
  }, [onComplete]);

  useEffect(() => {
    if (progress > 0.92 && !hasCompleted.current) {
      handleComplete();
    }
  }, [progress, handleComplete]);

  // Paper burn amount — visual progression of the paper rolling
  const burnPct = Math.min(progress * 110, 100);

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-700 ${lit ? "opacity-0 pointer-events-none" : "opacity-100"}`}
    >
      {/* Background — darkens as you roll */}
      <div
        className="absolute inset-0 transition-colors duration-300"
        style={{
          backgroundColor: `rgb(${Math.round(26 - progress * 26)}, ${Math.round(20 - progress * 20)}, ${Math.round(15 - progress * 15)})`,
        }}
      />

      {/* Scrollable container */}
      <div
        ref={scrollRef}
        className={`relative h-full w-full overflow-auto scrollbar-none ${
          isDesktop
            ? "flex flex-row overflow-x-auto overflow-y-hidden"
            : "flex flex-col overflow-y-auto overflow-x-hidden"
        }`}
        style={{ scrollbarWidth: "none" }}
      >
        {/* Paper sections — the content you see while rolling */}
        <section
          className={`flex-shrink-0 flex items-center justify-center ${
            isDesktop ? "w-screen h-full" : "w-full min-h-screen"
          }`}
        >
          <div className="flex flex-col items-center gap-6 px-8">
            <CannabisLeaf className="w-16 h-16 text-emerald-600/40 animate-float" />
            <p className="text-emerald-700/60 text-sm tracking-[0.3em] uppercase font-light">
              {isDesktop ? "Scroll to roll →" : "Scroll down to roll ↓"}
            </p>
          </div>
        </section>

        <section
          className={`flex-shrink-0 flex items-center justify-center ${
            isDesktop ? "w-screen h-full" : "w-full min-h-screen"
          }`}
        >
          <div className="flex flex-col items-center gap-4 px-8 text-center">
            <p className="text-emerald-500/80 text-4xl sm:text-6xl font-bold tracking-tight">
              4/20
            </p>
            <p className="text-emerald-600/50 text-lg sm:text-xl font-light">
              NYC &middot; 2026
            </p>
          </div>
        </section>

        <section
          className={`flex-shrink-0 flex items-center justify-center ${
            isDesktop ? "w-screen h-full" : "w-full min-h-screen"
          }`}
        >
          <div className="flex flex-col items-center gap-4 px-8 text-center">
            <p className="text-emerald-400/70 text-2xl sm:text-3xl font-medium">
              Something&apos;s coming
            </p>
            <CannabisLeaf className="w-10 h-10 text-emerald-500/30" />
          </div>
        </section>

        <section
          className={`flex-shrink-0 flex items-center justify-center ${
            isDesktop ? "w-screen h-full" : "w-full min-h-screen"
          }`}
        >
          <div className="flex flex-col items-center gap-3 px-8 text-center">
            <p className="text-emerald-500/50 text-xs tracking-[0.2em] uppercase">
              By rolling, you confirm you&apos;re 21+
            </p>
          </div>
        </section>

        {/* Extra scroll space to ensure we can reach 100% */}
        <div
          className={`flex-shrink-0 ${
            isDesktop ? "w-[50vw] h-full" : "w-full h-[50vh]"
          }`}
        />
      </div>

      {/* Rolling paper visual overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Paper texture strip that "rolls" as you scroll */}
        <div
          className="absolute transition-transform duration-100 ease-out"
          style={
            isDesktop
              ? {
                  top: 0,
                  bottom: 0,
                  right: 0,
                  width: `${100 - burnPct}%`,
                  background:
                    "linear-gradient(90deg, rgba(245,235,210,0.08) 0%, rgba(245,235,210,0.03) 50%, transparent 100%)",
                  borderLeft: burnPct > 5 ? "1px solid rgba(245,235,210,0.1)" : "none",
                }
              : {
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: `${100 - burnPct}%`,
                  background:
                    "linear-gradient(180deg, rgba(245,235,210,0.08) 0%, rgba(245,235,210,0.03) 50%, transparent 100%)",
                  borderTop: burnPct > 5 ? "1px solid rgba(245,235,210,0.1)" : "none",
                }
          }
        />

        {/* Cherry / lit tip glow */}
        {burnPct > 80 && (
          <div
            className="absolute animate-pulse"
            style={
              isDesktop
                ? {
                    top: "50%",
                    left: `${burnPct}%`,
                    transform: "translate(-50%, -50%)",
                    width: "120px",
                    height: "120px",
                    borderRadius: "50%",
                    background:
                      "radial-gradient(circle, rgba(255,120,20,0.6) 0%, rgba(255,80,0,0.3) 40%, transparent 70%)",
                  }
                : {
                    left: "50%",
                    top: `${burnPct}%`,
                    transform: "translate(-50%, -50%)",
                    width: "120px",
                    height: "120px",
                    borderRadius: "50%",
                    background:
                      "radial-gradient(circle, rgba(255,120,20,0.6) 0%, rgba(255,80,0,0.3) 40%, transparent 70%)",
                  }
            }
          />
        )}
      </div>

      {/* Progress indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 z-10">
        <div className="h-1 w-24 sm:w-32 rounded-full bg-emerald-900/30 overflow-hidden">
          <div
            className="h-full rounded-full bg-emerald-500/70 transition-all duration-150"
            style={{ width: `${Math.min(progress * 100, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
