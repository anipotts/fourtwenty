"use client";

import { useState, useEffect } from "react";
import AniPottsHeader from "./components/AniPottsHeader";

const LEAF_PATH =
  "M503.47 360.25c-1.56-.82-32.39-16.89-76.78-25.81c64.25-75.12 84.05-161.67 84.93-165.64c1.18-5.33-.44-10.9-4.3-14.77c-3.03-3.04-7.12-4.7-11.32-4.7c-1.14 0-2.29.12-3.44.38c-3.88.85-86.54 19.59-160.58 79.76c.01-1.46.01-2.93.01-4.4c0-118.79-59.98-213.72-62.53-217.7A15.97 15.97 0 0 0 256 0c-5.45 0-10.53 2.78-13.47 7.37c-2.55 3.98-62.53 98.91-62.53 217.7c0 1.47.01 2.94.01 4.4c-74.03-60.16-156.69-78.9-160.58-79.76c-1.14-.25-2.29-.38-3.44-.38c-4.2 0-8.29 1.66-11.32 4.7A15.99 15.99 0 0 0 .38 168.8c.88 3.97 20.68 90.52 84.93 165.64c-44.39 8.92-75.21 24.99-76.78 25.81a16.003 16.003 0 0 0-.02 28.29c2.45 1.29 60.76 31.72 133.49 31.72c6.14 0 11.96-.1 17.5-.31c-11.37 22.23-16.52 38.31-16.81 39.22c-1.8 5.68-.29 11.89 3.91 16.11a16.02 16.02 0 0 0 16.1 3.99c1.83-.57 37.72-11.99 77.3-39.29V504c0 4.42 3.58 8 8 8h16c4.42 0 8-3.58 8-8v-64.01c39.58 27.3 75.47 38.71 77.3 39.29a16.02 16.02 0 0 0 16.1-3.99c4.2-4.22 5.71-10.43 3.91-16.11c-.29-.91-5.45-16.99-16.81-39.22c5.54.21 11.37.31 17.5.31c72.72 0 131.04-30.43 133.49-31.72c5.24-2.78 8.52-8.22 8.51-14.15c-.01-5.94-3.29-11.39-8.53-14.15";

function CannabisLeaf({
  className,
  onClick,
}: {
  className?: string;
  onClick?: () => void;
}) {
  return (
    <svg
      viewBox="0 0 512 512"
      className={className}
      fill="currentColor"
      onClick={onClick}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d={LEAF_PATH} />
    </svg>
  );
}

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

export default function Home() {
  const [verified, setVerified] = useState<boolean | null>(null);
  const [dark, setDark] = useState(false);

  useFavicon(dark);

  const toggleDark = () => setDark(!dark);

  return (
    <main
      className={`h-screen w-screen flex flex-col items-center justify-center px-6 relative transition-colors duration-300 ${dark ? "bg-black" : "bg-cream"}`}
    >
      <div className="flex flex-col flex-1 justify-center items-center">
        <CannabisLeaf
          className={`w-16 h-16 sm:w-20 sm:h-20 mb-8 animate-fade-in animate-float cursor-pointer hover:scale-110 active:scale-95 transition-transform duration-150 ${dark ? "text-emerald-400" : "text-leaf"}`}
          onClick={toggleDark}
        />

        {verified === null && (
          <div className="flex flex-col items-center">
            <h1
              className={`text-2xl sm:text-3xl font-bold mb-8 text-center animate-fade-in animate-delay-100 ${dark ? "text-emerald-400" : "text-leaf-dark"}`}
            >
              Are you 21?
            </h1>
            <div className="flex gap-4 animate-fade-in animate-delay-200">
              <button
                onClick={() => setVerified(true)}
                className={`px-8 py-3 font-bold rounded-full text-lg hover:scale-105 active:scale-95 transition-all duration-150 ${dark ? "text-black bg-emerald-400 hover:bg-emerald-300" : "bg-leaf text-cream hover:bg-leaf-dark"}`}
              >
                Yes
              </button>
              <button
                onClick={() => setVerified(false)}
                className={`px-8 py-3 border-2 font-bold rounded-full text-lg hover:scale-105 active:scale-95 transition-all duration-150 ${dark ? "text-emerald-400 border-emerald-400 hover:bg-emerald-400 hover:text-black" : "border-leaf text-leaf hover:bg-leaf hover:text-cream"}`}
              >
                No
              </button>
            </div>
          </div>
        )}

        {verified === true && (
          <div className="flex flex-col items-center text-center animate-scale-in">
            <p
              className={`text-xl sm:text-2xl font-medium leading-relaxed ${dark ? "text-emerald-400" : "text-leaf-dark"}`}
            >
              Keep an eye out for
              <br />
              <span
                className={`text-3xl sm:text-4xl font-bold ${dark ? "text-emerald-300" : "text-leaf"}`}
              >
                4/20 in NYC.
              </span>
              <br />
              2026.
            </p>
          </div>
        )}

        {verified === false && (
          <div className="flex flex-col items-center text-center animate-scale-in">
            <p
              className={`text-xl sm:text-2xl font-medium ${dark ? "text-emerald-400" : "text-leaf-dark"}`}
            >
              Come back when you&apos;re 21!
            </p>
          </div>
        )}
      </div>

      <AniPottsHeader variant={dark ? "dark" : "light"} />
    </main>
  );
}
