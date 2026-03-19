"use client";

import { useState, useEffect, useCallback } from "react";
import CannabisLeaf, { LEAF_PATH } from "./components/CannabisLeaf";
import SharedJoint from "./components/SharedJoint";
import CollectiveBreath from "./components/CollectiveBreath";
import RollingPaper from "./components/RollingPaper";

function useFavicon(dark: boolean) {
  useEffect(() => {
    const bgColor = dark ? "#000000" : "#FFFEF5";
    const leafColor = dark ? "#34d399" : "#228B22";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 640"><rect width="600" height="640" fill="${bgColor}"/><path fill="${leafColor}" d="${LEAF_PATH}"/></svg>`;
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }, [dark]);
}

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return mobile;
}

type Phase = "gate" | "rolling" | "experience";

export default function Home() {
  const [dark, setDark] = useState(false);
  const [phase, setPhase] = useState<Phase>("gate");
  const [fading, setFading] = useState(false);
  const isMobile = useIsMobile();

  useFavicon(dark);

  const enterExperience = useCallback(() => {
    if (isMobile) {
      setPhase("rolling");
    } else {
      setFading(true);
      setTimeout(() => setPhase("experience"), 600);
    }
  }, [isMobile]);

  return (
    <div className={`h-screen w-screen relative ${dark ? "bg-black" : "bg-cream"} transition-colors duration-500`}>
      {/* Persistent leaf — always visible, always clickable */}
      <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50">
        <CannabisLeaf
          animated
          className={`w-20 h-20 sm:w-24 sm:h-24 ${
            dark ? "text-emerald-400" : "text-leaf"
          }`}
          onClick={() => setDark(!dark)}
        />
      </div>

      {phase === "gate" && (
        <main
          className={`h-full w-full flex flex-col items-center justify-center px-6 transition-all duration-500 ${
            fading ? "opacity-0 scale-105" : "opacity-100"
          }`}
        >
          {/* Spacer for leaf */}
          <div className="h-32" />

          <div className="flex flex-col items-center">
            <h1
              className={`text-2xl sm:text-3xl font-bold mb-8 text-center animate-fade-in animate-delay-100 ${
                dark ? "text-emerald-400" : "text-leaf-dark"
              }`}
            >
              Are you 21?
            </h1>
            <div className="flex gap-4 animate-fade-in animate-delay-200">
              <button
                onClick={enterExperience}
                className={`px-8 py-3 font-bold rounded-full text-lg hover:scale-105 active:scale-95 transition-all duration-150 ${
                  dark
                    ? "text-black bg-emerald-400 hover:bg-emerald-300"
                    : "bg-leaf text-cream hover:bg-leaf-dark"
                }`}
              >
                Yes
              </button>
              <button
                onClick={enterExperience}
                className={`px-8 py-3 border-2 font-bold rounded-full text-lg hover:scale-105 active:scale-95 transition-all duration-150 ${
                  dark
                    ? "text-emerald-400 border-emerald-400 hover:bg-emerald-400 hover:text-black"
                    : "border-leaf text-leaf hover:bg-leaf hover:text-cream"
                }`}
              >
                No
              </button>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0">
            {/* @ts-expect-error web component */}
            <ani-potts-header variant={dark ? "dark" : "light"} />
          </div>
        </main>
      )}

      {phase === "rolling" && (
        <RollingPaper onComplete={() => setPhase("experience")} dark={dark} />
      )}

      {phase === "experience" && (
        <main className="h-full w-full flex items-center justify-center px-6 overflow-hidden">
          <CollectiveBreath />

          <div className="flex flex-col items-center z-10 animate-fade-in">
            {/* Spacer for persistent leaf */}
            <div className="h-28" />

            <p
              className={`text-lg sm:text-xl font-medium leading-relaxed text-center ${
                dark ? "text-emerald-400/80" : "text-leaf-dark/80"
              }`}
            >
              <span
                className={`text-2xl sm:text-3xl font-bold block ${
                  dark ? "text-emerald-300" : "text-leaf"
                }`}
              >
                4/20 in NYC.
              </span>
              2026.
            </p>
          </div>

          <SharedJoint />

          <div className="absolute bottom-0 left-0 right-0">
            {/* @ts-expect-error web component */}
            <ani-potts-header variant={dark ? "dark" : "light"} />
          </div>
        </main>
      )}
    </div>
  );
}
