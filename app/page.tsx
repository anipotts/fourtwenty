"use client";

import { useState, useEffect, useCallback } from "react";
import CannabisLeaf, { LEAF_PATH } from "./components/CannabisLeaf";
import SharedJoint from "./components/SharedJoint";
import CollectiveBreath from "./components/CollectiveBreath";
import VaultLock from "./components/VaultLock";
import RollingPaper from "./components/RollingPaper";

function useFavicon(dark: boolean) {
  useEffect(() => {
    const bgColor = dark ? "#000000" : "#FFFEF5";
    const leafColor = dark ? "#34d399" : "#228B22";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="${bgColor}"/><g transform="translate(64, 64) scale(0.75)"><path fill="${leafColor}" d="${LEAF_PATH}"/></g></svg>`;
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
      // Mobile: rolling paper transition
      setPhase("rolling");
    } else {
      // Desktop: simple fade to experience
      setFading(true);
      setTimeout(() => setPhase("experience"), 600);
    }
  }, [isMobile]);

  return (
    <>
      {/* Phase 1: Age gate — identical to current prod */}
      {phase === "gate" && (
        <main
          className={`h-screen w-screen flex flex-col items-center justify-center px-6 relative transition-all duration-500 ${
            fading ? "opacity-0 scale-105" : "opacity-100"
          } ${dark ? "bg-black" : "bg-cream"}`}
        >
          <div className="flex flex-col flex-1 justify-center items-center">
            <CannabisLeaf
              animated
              className={`w-16 h-16 sm:w-20 sm:h-20 mb-8 animate-fade-in ${
                dark ? "text-emerald-400" : "text-leaf"
              }`}
              onClick={() => setDark(!dark)}
            />

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
                  onClick={() => {/* no-op or redirect */}}
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
          </div>

          {/* @ts-expect-error web component */}
          <ani-potts-header variant={dark ? "dark" : "light"} />
        </main>
      )}

      {/* Phase 2: Rolling paper — mobile only */}
      {phase === "rolling" && (
        <RollingPaper
          onComplete={() => setPhase("experience")}
          dark={dark}
        />
      )}

      {/* Phase 3: The experience */}
      {phase === "experience" && (
        <main
          className={`min-h-screen w-screen flex flex-col items-center justify-center px-6 relative transition-colors duration-500 ${
            dark ? "bg-black" : "bg-cream"
          }`}
        >
          <CollectiveBreath />

          <div className="flex flex-col flex-1 justify-center items-center z-10 animate-fade-in">
            <CannabisLeaf
              className={`w-16 h-16 sm:w-20 sm:h-20 mb-6 animate-float cursor-pointer hover:scale-110 active:scale-95 transition-transform duration-150 ${
                dark ? "text-emerald-400" : "text-leaf"
              }`}
              onClick={() => setDark(!dark)}
            />

            <p
              className={`text-xl sm:text-2xl font-medium leading-relaxed text-center animate-fade-in animate-delay-100 ${
                dark ? "text-emerald-400" : "text-leaf-dark"
              }`}
            >
              Keep an eye out for
              <br />
              <span
                className={`text-3xl sm:text-4xl font-bold ${
                  dark ? "text-emerald-300" : "text-leaf"
                }`}
              >
                4/20 in NYC.
              </span>
              <br />
              2026.
            </p>

            <VaultLock dark={dark} />
          </div>

          <SharedJoint />

          {/* @ts-expect-error web component */}
          <ani-potts-header variant={dark ? "dark" : "light"} />
        </main>
      )}
    </>
  );
}
