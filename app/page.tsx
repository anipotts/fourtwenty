"use client";

import { useState, useEffect, useCallback } from "react";
import CannabisLeaf, { LEAF_PATH } from "./components/CannabisLeaf";
import SharedJoint from "./components/SharedJoint";
import RollingPaper from "./components/RollingPaper";
import { useLocation } from "./hooks/useLocation";

function useFavicon(dark: boolean) {
  useEffect(() => {
    const bgColor = dark ? "#1a1a1a" : "#faf8f0";
    const leafColor = dark ? "#74c69d" : "#2d6a4f";
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
  const location = useLocation();

  useFavicon(dark);

  const enterExperience = useCallback(() => {
    if (isMobile) {
      setPhase("rolling");
    } else {
      setFading(true);
      setTimeout(() => setPhase("experience"), 600);
    }
  }, [isMobile]);

  const leaf = (
    <CannabisLeaf
      animated
      className={`w-20 h-20 sm:w-24 sm:h-24 ${
        dark ? "text-leaf-light" : "text-leaf"
      }`}
      onClick={() => setDark(!dark)}
    />
  );

  const muted = dark ? "text-leaf-light/40" : "text-leaf/40";

  return (
    <div className={`h-screen w-screen relative transition-colors duration-500 ${dark ? "bg-[#1a1a1a]" : "bg-cream"}`}>
      {phase === "gate" && (
        <main
          className={`h-full w-full flex flex-col items-center justify-center px-6 transition-all duration-500 ${
            fading ? "opacity-0 scale-105" : "opacity-100"
          }`}
        >
          <div className="flex flex-col items-center">
            <div className="mb-8 animate-fade-in">{leaf}</div>
            <h1
              className={`text-2xl sm:text-3xl font-bold mb-8 text-center animate-fade-in animate-delay-100 ${
                dark ? "text-leaf-light" : "text-leaf-dark"
              }`}
            >
              Are you 21?
            </h1>
            <div className="flex gap-4 animate-fade-in animate-delay-200">
              <button
                onClick={enterExperience}
                className={`px-8 py-3 font-bold rounded-full text-lg hover:scale-105 active:scale-95 transition-all duration-150 ${
                  dark
                    ? "text-[#1a1a1a] bg-leaf-accent hover:bg-leaf-light"
                    : "bg-leaf text-cream hover:bg-leaf-dark"
                }`}
              >
                Yes
              </button>
              <button
                onClick={enterExperience}
                className={`px-8 py-3 border-2 font-bold rounded-full text-lg hover:scale-105 active:scale-95 transition-all duration-150 ${
                  dark
                    ? "text-leaf-accent border-leaf-accent hover:bg-leaf-accent hover:text-[#1a1a1a]"
                    : "border-leaf text-leaf hover:bg-leaf hover:text-cream"
                }`}
              >
                No
              </button>
            </div>
          </div>
        </main>
      )}

      {phase === "rolling" && (
        <RollingPaper onComplete={() => setPhase("experience")} dark={dark} />
      )}

      {phase === "experience" && (
        <main className="h-full w-full flex items-center justify-center px-6 overflow-hidden">
          <div className="flex flex-col items-center animate-fade-in">
            <div className="mb-6">{leaf}</div>

            {location?.isNYC ? (
              <p
                className={`text-lg sm:text-xl font-medium leading-relaxed text-center ${
                  dark ? "text-leaf-light/80" : "text-leaf-dark/80"
                }`}
              >
                <span
                  className={`text-2xl sm:text-3xl font-bold block ${
                    dark ? "text-leaf-accent" : "text-leaf"
                  }`}
                >
                  4/20 in NYC.
                </span>
                2026.
              </p>
            ) : (
              <div className="text-center">
                <p
                  className={`text-2xl sm:text-3xl font-bold ${
                    dark ? "text-leaf-accent" : "text-leaf"
                  }`}
                >
                  4/20 in NYC.
                </p>
                <p
                  className={`text-lg mt-1 ${
                    dark ? "text-leaf-light/60" : "text-leaf-dark/60"
                  }`}
                >
                  2026.
                </p>
                <p className={`text-sm mt-4 ${muted}`}>
                  {location?.city
                    ? `You're in ${location.city}. This one's for NYC.`
                    : "This one's for NYC."}
                </p>
                <p className={`text-xs mt-1 ${muted}`}>
                  But you can still hit the joint.
                </p>
              </div>
            )}
          </div>

          <SharedJoint />
        </main>
      )}

      {/* Persistent header */}
      <div className="absolute bottom-0 left-0 right-0 z-50">
        {/* @ts-expect-error web component */}
        <ani-potts-header variant={dark ? "dark" : "light"} />
      </div>
    </div>
  );
}
