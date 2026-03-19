"use client";

interface JointSVGProps {
  /** 0 = fully smoked, 1 = full length */
  length: number;
  /** Whether the cherry is flaring (someone just hit it) */
  flare?: boolean;
  className?: string;
}

export default function JointSVG({ length, flare = false, className }: JointSVGProps) {
  const crutchWidth = 24;
  const crutchHeight = 9;
  const paperMaxWidth = 110;
  const paperWidth = paperMaxWidth * Math.max(length, 0.02);

  // Conical taper — wider at the lit end
  const crutchY = 0;
  const tipHeightTop = crutchY - 2.5; // paper is taller than crutch at lit end
  const tipHeightBot = crutchY + crutchHeight + 2.5;

  const paperLeft = crutchWidth;
  const paperRight = crutchWidth + paperWidth;

  // Conical paper shape as a polygon
  const paperPoints = [
    `${paperLeft},${crutchY}`,          // top-left (flush with crutch)
    `${paperRight},${tipHeightTop}`,     // top-right (wider)
    `${paperRight},${tipHeightBot}`,     // bottom-right (wider)
    `${paperLeft},${crutchY + crutchHeight}`, // bottom-left (flush)
  ].join(" ");

  return (
    <svg
      viewBox="-4 -12 160 36"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="crutch" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e0d5c0" />
          <stop offset="100%" stopColor="#c8bca6" />
        </linearGradient>
        <linearGradient id="paper" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ede7d9" />
          <stop offset="60%" stopColor="#e8e0cf" />
          <stop offset="100%" stopColor="#ddd5c2" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation={flare ? "5" : "3"} />
          <feComposite in="SourceGraphic" />
        </filter>
      </defs>

      {/* Crutch / filter — rolled cardboard look */}
      <rect
        x={0}
        y={crutchY}
        width={crutchWidth}
        height={crutchHeight}
        rx={1.5}
        fill="url(#crutch)"
        stroke="#bfb49e"
        strokeWidth={0.4}
      />
      {/* Spiral lines inside crutch */}
      <path
        d={`M4,${crutchY + 1.5} Q7,${crutchY + crutchHeight / 2} 4,${crutchY + crutchHeight - 1.5}`}
        fill="none"
        stroke="#b5a890"
        strokeWidth={0.5}
        opacity={0.6}
      />
      <path
        d={`M10,${crutchY + 1.5} Q13,${crutchY + crutchHeight / 2} 10,${crutchY + crutchHeight - 1.5}`}
        fill="none"
        stroke="#b5a890"
        strokeWidth={0.5}
        opacity={0.4}
      />
      <path
        d={`M16,${crutchY + 1.5} Q19,${crutchY + crutchHeight / 2} 16,${crutchY + crutchHeight - 1.5}`}
        fill="none"
        stroke="#b5a890"
        strokeWidth={0.5}
        opacity={0.3}
      />

      {/* Paper body — conical shape */}
      {paperWidth > 1 && (
        <polygon
          points={paperPoints}
          fill="url(#paper)"
          stroke="#d4ccba"
          strokeWidth={0.3}
        />
      )}

      {/* Subtle twist lines on paper */}
      {paperWidth > 20 && (
        <>
          <line
            x1={paperLeft + paperWidth * 0.3}
            y1={crutchY - 0.5 - paperWidth * 0.3 * (2.5 / paperMaxWidth)}
            x2={paperLeft + paperWidth * 0.3}
            y2={crutchY + crutchHeight + 0.5 + paperWidth * 0.3 * (2.5 / paperMaxWidth)}
            stroke="#cfc6b3"
            strokeWidth={0.3}
            opacity={0.4}
          />
          <line
            x1={paperLeft + paperWidth * 0.6}
            y1={crutchY - 1 - paperWidth * 0.6 * (2.5 / paperMaxWidth)}
            x2={paperLeft + paperWidth * 0.6}
            y2={crutchY + crutchHeight + 1 + paperWidth * 0.6 * (2.5 / paperMaxWidth)}
            stroke="#cfc6b3"
            strokeWidth={0.3}
            opacity={0.3}
          />
        </>
      )}

      {/* Cherry — the lit end */}
      {length > 0.02 && (
        <>
          {/* Outer glow */}
          <ellipse
            cx={paperRight}
            cy={crutchY + crutchHeight / 2}
            rx={flare ? 10 : 6}
            ry={flare ? 8 : 5}
            fill={flare ? "rgba(255,100,0,0.35)" : "rgba(255,80,0,0.15)"}
            filter="url(#glow)"
            className="transition-all duration-300"
          />
          {/* Inner ember */}
          <ellipse
            cx={paperRight}
            cy={crutchY + crutchHeight / 2}
            rx={3.5}
            ry={flare ? 5 : 4}
            fill={flare ? "#ff5500" : "#d44000"}
            opacity={flare ? 1 : 0.85}
            className="transition-all duration-300"
          />
          {/* Hot center */}
          <ellipse
            cx={paperRight + 0.5}
            cy={crutchY + crutchHeight / 2}
            rx={1.5}
            ry={2}
            fill={flare ? "#ffaa00" : "#ff6600"}
            opacity={flare ? 0.9 : 0.6}
            className="transition-all duration-200"
          />
        </>
      )}

      {/* Roach state — nearly done */}
      {length <= 0.02 && (
        <rect
          x={crutchWidth}
          y={crutchY + 1}
          width={3}
          height={crutchHeight - 2}
          rx={1}
          fill="#999"
          opacity={0.4}
        />
      )}
    </svg>
  );
}
