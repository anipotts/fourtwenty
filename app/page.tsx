"use client";

import { useState, useEffect, useCallback } from "react";
import CannabisLeaf from "./components/CannabisLeaf";
import SharedJoint from "./components/SharedJoint";

// Simpler leaf for favicon — fewer points, clean at 16px
const FAVICON_LEAF = "M503.47 360.25c-1.56-.82-32.39-16.89-76.78-25.81c64.25-75.12 84.05-161.67 84.93-165.64c1.18-5.33-.44-10.9-4.3-14.77c-3.03-3.04-7.12-4.7-11.32-4.7c-1.14 0-2.29.12-3.44.38c-3.88.85-86.54 19.59-160.58 79.76c.01-1.46.01-2.93.01-4.4c0-118.79-59.98-213.72-62.53-217.7A15.97 15.97 0 0 0 256 0c-5.45 0-10.53 2.78-13.47 7.37c-2.55 3.98-62.53 98.91-62.53 217.7c0 1.47.01 2.94.01 4.4c-74.03-60.16-156.69-78.9-160.58-79.76c-1.14-.25-2.29-.38-3.44-.38c-4.2 0-8.29 1.66-11.32 4.7A15.99 15.99 0 0 0 .38 168.8c.88 3.97 20.68 90.52 84.93 165.64c-44.39 8.92-75.21 24.99-76.78 25.81a16.003 16.003 0 0 0-.02 28.29c2.45 1.29 60.76 31.72 133.49 31.72c6.14 0 11.96-.1 17.5-.31c-11.37 22.23-16.52 38.31-16.81 39.22c-1.8 5.68-.29 11.89 3.91 16.11a16.02 16.02 0 0 0 16.1 3.99c1.83-.57 37.72-11.99 77.3-39.29V504c0 4.42 3.58 8 8 8h16c4.42 0 8-3.58 8-8v-64.01c39.58 27.3 75.47 38.71 77.3 39.29a16.02 16.02 0 0 0 16.1-3.99c4.2-4.22 5.71-10.43 3.91-16.11c-.29-.91-5.45-16.99-16.81-39.22c5.54.21 11.37.31 17.5.31c72.72 0 131.04-30.43 133.49-31.72c5.24-2.78 8.52-8.22 8.51-14.15c-.01-5.94-3.29-11.39-8.53-14.15";

function useFavicon() {
  useEffect(() => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="${FAVICON_LEAF}" fill="#2d6a4f" stroke="#faf8f0" stroke-width="24" stroke-linejoin="round" paint-order="stroke"/></svg>`;
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
