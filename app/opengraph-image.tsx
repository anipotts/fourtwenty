import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "fourtwenty.nyc — 4/20 in NYC 2026";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#1a1a1a",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Leaf icon — simplified for OG rendering (satori doesn't support complex paths well) */}
        <div
          style={{
            fontSize: 80,
            marginBottom: 20,
          }}
        >
          🌿
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span
            style={{
              color: "#52b788",
              fontSize: 72,
              fontWeight: 800,
              letterSpacing: "-2px",
            }}
          >
            4/20 in NYC.
          </span>
          <span
            style={{
              color: "#74c69d",
              fontSize: 36,
              fontWeight: 500,
              opacity: 0.7,
            }}
          >
            2026.
          </span>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 40,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span
            style={{
              color: "#74c69d",
              fontSize: 20,
              opacity: 0.4,
              letterSpacing: "4px",
              textTransform: "uppercase" as const,
            }}
          >
            fourtwenty.nyc
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
