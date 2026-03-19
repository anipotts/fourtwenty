"use client";

import { useState, useEffect, useCallback } from "react";
import CannabisLeaf, { LEAF_PATH } from "./components/CannabisLeaf";
import SharedJoint from "./components/SharedJoint";

function useFavicon() {
  useEffect(() => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 640"><path fill="#2d6a4f" d="${LEAF_PATH}"/></svg>`;
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }, []);
}

type Phase = "gate" | "experience";

export default function Home() {
  const [phase, setPhase] = useState<Phase>("gate");
  const [fading, setFading] = useState(false);

  useFavicon();

  const enter = useCallback(() => {
    setFading(true);
    setTimeout(() => setPhase("experience"), 500);
  }, []);

  return (
    <div className="h-screen w-screen relative bg-cream">
      {phase === "gate" && (
        <main
          className={`h-full w-full flex flex-col items-center justify-center px-6 transition-all duration-500 ${
            fading ? "opacity-0 scale-105" : "opacity-100"
          }`}
        >
          <div className="flex flex-col items-center">
            <CannabisLeaf
              animated
              className="w-20 h-20 sm:w-24 sm:h-24 mb-8 text-leaf animate-fade-in"
              onClick={enter}
            />
            <h1 className="text-2xl sm:text-3xl font-bold mb-8 text-center text-leaf-dark animate-fade-in animate-delay-100">
              Are you 21?
            </h1>
            <div className="flex gap-4 animate-fade-in animate-delay-200">
              <button
                onClick={enter}
                className="px-8 py-3 font-bold rounded-full text-lg bg-leaf text-cream hover:bg-leaf-dark hover:scale-105 active:scale-95 transition-all duration-150"
              >
                Yes
              </button>
              <button
                onClick={enter}
                className="px-8 py-3 border-2 border-leaf text-leaf font-bold rounded-full text-lg hover:bg-leaf hover:text-cream hover:scale-105 active:scale-95 transition-all duration-150"
              >
                No
              </button>
            </div>
          </div>
        </main>
      )}

      {phase === "experience" && (
        <main className="h-full w-full flex items-center justify-center overflow-hidden">
          <SharedJoint />
        </main>
      )}

      <div className="absolute bottom-0 left-0 right-0 z-50">
        {/* @ts-expect-error web component */}
        <ani-potts-header variant="light" />
      </div>
    </div>
  );
}
