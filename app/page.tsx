"use client";

import { useState, useEffect } from "react";
import CannabisLeaf, { LEAF_PATH } from "./components/CannabisLeaf";
import RollingPaper from "./components/RollingPaper";
import SharedJoint from "./components/SharedJoint";
import CollectiveBreath from "./components/CollectiveBreath";
import VaultLock from "./components/VaultLock";

function useFavicon(dark: boolean) {
  useEffect(() => {
    const bgColor = dark ? "#000000" : "#FFFEF5";
    const leafColor = dark ? "#34d399" : "#228B22";

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="${bgColor}"/><g transform="translate(64, 64) scale(0.75)"><path fill="${leafColor}" d="${LEAF_PATH}"/></g></svg>`;

    const dataUrl = `data:image/svg+xml,${encodeURIComponent(svg)}`;

    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = dataUrl;
  }, [dark]);
}

type Phase = "rolling" | "experience";

export default function Home() {
  const [phase, setPhase] = useState<Phase>("rolling");
  const [dark, setDark] = useState(true);

  useFavicon(dark);

  const toggleDark = () => setDark(!dark);

  return (
    <>
      {phase === "rolling" && (
        <RollingPaper onComplete={() => setPhase("experience")} />
      )}

      {phase === "experience" && (
        <main
          className={`min-h-screen w-screen flex flex-col items-center justify-center px-6 relative transition-colors duration-500 ${
            dark ? "bg-black" : "bg-cream"
          }`}
        >
          {/* Collective Breath — ambient background */}
          <CollectiveBreath />

          <div className="flex flex-col flex-1 justify-center items-center z-10 animate-fade-in">
            <CannabisLeaf
              className={`w-16 h-16 sm:w-20 sm:h-20 mb-8 animate-float cursor-pointer hover:scale-110 active:scale-95 transition-transform duration-150 ${
                dark ? "text-emerald-400" : "text-leaf"
              }`}
              onClick={toggleDark}
            />

            <div className="flex flex-col items-center text-center animate-fade-in animate-delay-100">
              <p
                className={`text-xl sm:text-2xl font-medium leading-relaxed ${
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
            </div>

            {/* 4:20 Vault Lock — time-gated event details */}
            <VaultLock />
          </div>

          {/* Shared Joint — fixed position at bottom */}
          <SharedJoint />

          {/* @ts-expect-error web component */}
          <ani-potts-header variant={dark ? "dark" : "light"} />
        </main>
      )}
    </>
  );
}
