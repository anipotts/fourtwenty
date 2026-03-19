"use client";

import { useMemo } from "react";

interface JointImageProps {
  length: number;
  flare?: boolean;
  className?: string;
  onClick?: () => void;
}

/** Compute burn line position as a percentage from top */
export function getBurnPct(length: number): number {
  const tipPct = 6;
  const filterPct = 16;
  const burnablePct = 100 - tipPct - filterPct;
  return tipPct + burnablePct * (1 - Math.max(length, 0.01));
}

export default function JointImage({
  length,
  flare = false,
  className,
  onClick,
}: JointImageProps) {
  // Stable irregular burn edge (regenerates on relight when length jumps)
  const burnSeed = useMemo(() => Math.random(), [Math.floor(length * 20)]);

  // Image anatomy: top 6% = twisted tip, bottom 16% = filter
  const tipPct = 6;
  const filterPct = 16;
  const burnablePct = 100 - tipPct - filterPct;

  // How much to clip from the top
  const burnedPct = tipPct + burnablePct * (1 - Math.max(length, 0.01));

  // Generate irregular clip-path with slight canoe
  const clipPath = useMemo(() => {
    if (length >= 0.95) return "none"; // Show full joint

    // The burn line sits at burnedPct from top
    // We want a bumpy line across the joint width
    // Joint sits roughly in center 20% of image width (40%-60%)
    const jointLeft = 38;
    const jointRight = 62;
    const canoe = (burnSeed - 0.5) * 2; // -1 to 1

    // Generate points along the burn edge
    const points: string[] = [];

    // Top-left corner (keep everything above burn line clipped)
    // We clip from burnedPct down to 100% (showing only below burn line)
    // clip-path: polygon defines the VISIBLE area

    // Left side outside joint — straight cut
    points.push(`0% ${burnedPct}%`);

    // Across the burn edge with bumps
    const steps = 8;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = jointLeft + (jointRight - jointLeft) * t;
      // Canoe shape + random bumps
      const canoeDip = canoe * Math.sin(t * Math.PI) * 1.5;
      const bump = Math.sin(burnSeed * 100 + i * 7.3) * 0.8;
      const y = burnedPct + canoeDip + bump;
      points.push(`${x}% ${y}%`);
    }

    // Right side + bottom
    points.push(`100% ${burnedPct}%`);
    points.push(`100% 100%`);
    points.push(`0% 100%`);

    return `polygon(${points.join(", ")})`;
  }, [burnedPct, length, burnSeed]);

  return (
    <div className={`relative ${className ?? ""}`} onClick={onClick} style={{ cursor: "pointer" }}>
      {/* The joint image — clipped by burn progression */}
      <img
        src="/joint.webp"
        alt="Joint"
        draggable={false}
        className="h-full w-auto select-none"
        style={{
          clipPath: clipPath === "none" ? undefined : clipPath,
          transition: "clip-path 0.3s ease-out",
        }}
      />

      {/* Cherry/ember glow at the burn line */}
      {length > 0.01 && length < 0.95 && (
        <div
          className="absolute left-1/2 pointer-events-none"
          style={{
            top: `${burnedPct}%`,
            transform: "translateX(-50%) translateY(-50%)",
            transition: "top 0.3s ease-out",
          }}
        >
          {/* Ember dot */}
          <div
            className="rounded-full transition-all duration-300"
            style={{
              width: flare ? 14 : 8,
              height: flare ? 6 : 4,
              background: flare
                ? "radial-gradient(ellipse, #ff8822 0%, #cc4400 40%, transparent 70%)"
                : "radial-gradient(ellipse, #884422 0%, #554038 50%, transparent 70%)",
              boxShadow: flare
                ? "0 0 12px 4px rgba(255,100,20,0.4), 0 0 24px 8px rgba(255,60,0,0.15)"
                : "0 0 4px 1px rgba(200,80,20,0.15)",
            }}
          />
        </div>
      )}
    </div>
  );
}
