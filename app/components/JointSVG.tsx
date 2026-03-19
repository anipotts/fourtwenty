"use client";

import { useMemo } from "react";

interface JointSVGProps {
  /** 0 = fully smoked, 1 = full length */
  length: number;
  /** Whether the cherry is flaring (someone just hit it) */
  flare?: boolean;
  className?: string;
}

export default function JointSVG({
  length,
  flare = false,
  className,
}: JointSVGProps) {
  // Use a unique ID prefix so multiple instances don't collide
  const uid = useMemo(
    () => `j${Math.random().toString(36).slice(2, 8)}`,
    []
  );

  const clampedLength = Math.max(Math.min(length, 1), 0);

  // --- Geometry ---
  const crutchLength = 28;
  const crutchRadius = 5; // half-height of the crutch cylinder
  const maxPaperLength = 120;
  const paperLength = maxPaperLength * Math.max(clampedLength, 0.015);

  // Crutch center-Y
  const cy = 14;

  // Conical taper: crutch end is narrower, lit end is wider
  const crutchHalfH = crutchRadius;
  const tipHalfH = crutchRadius + 2.8; // wider at cherry end

  // Paper body coordinates (left = crutch side, right = cherry side)
  const pLeft = crutchLength;
  const pRight = crutchLength + paperLength;

  // Interpolated half-heights along the paper
  const halfHAt = (x: number) => {
    const t = (x - pLeft) / Math.max(paperLength, 1);
    return crutchHalfH + t * (tipHalfH - crutchHalfH);
  };

  // Paper outline (conical trapezoid)
  const paperPath = [
    `M${pLeft},${cy - crutchHalfH}`,
    `L${pRight},${cy - halfHAt(pRight)}`,
    // Slight rounded cap at cherry end
    `A${halfHAt(pRight)},${halfHAt(pRight)} 0 0 1 ${pRight},${cy + halfHAt(pRight)}`,
    `L${pLeft},${cy + crutchHalfH}`,
    "Z",
  ].join(" ");

  // Twist tip at the very end (only when mostly full)
  const showTwist = clampedLength > 0.7;
  const twistLength = 6;
  const twistX = pRight;
  const twistEndX = twistX + twistLength;

  // Grain/wrinkle lines along the paper
  const grainLines = useMemo(() => {
    const lines: Array<{ x: number; opacity: number }> = [];
    const count = Math.floor(paperLength / 8);
    for (let i = 1; i <= count; i++) {
      const x = pLeft + (paperLength * i) / (count + 1);
      // Vary opacity for natural look
      const opacity = 0.12 + Math.sin(i * 2.7) * 0.08;
      lines.push({ x, opacity });
    }
    return lines;
  }, [paperLength, pLeft]);

  // Crutch spiral lines
  const spiralCount = 5;
  const spirals = useMemo(() => {
    const result: Array<{ cx: number; opacity: number }> = [];
    for (let i = 0; i < spiralCount; i++) {
      const x = 4 + (crutchLength - 8) * (i / (spiralCount - 1));
      const opacity = 0.25 + Math.sin(i * 1.8) * 0.15;
      result.push({ cx: x, opacity });
    }
    return result;
  }, []);

  const isRoach = clampedLength <= 0.02;

  return (
    <svg
      viewBox="-6 -16 190 52"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      style={{ transform: "rotate(-15deg)" }}
      role="img"
      aria-label="A hand-rolled joint"
    >
      <defs>
        {/* Paper gradient — off-white with yellowish warmth */}
        <linearGradient id={`${uid}-paper`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f0ead8" />
          <stop offset="30%" stopColor="#ece5d0" />
          <stop offset="70%" stopColor="#e6dfc8" />
          <stop offset="100%" stopColor="#e0d8be" />
        </linearGradient>

        {/* Paper longitudinal shading — slightly darker toward cherry */}
        <linearGradient
          id={`${uid}-paper-long`}
          x1="0"
          y1="0"
          x2="1"
          y2="0"
        >
          <stop offset="0%" stopColor="rgba(255,255,255,0)" />
          <stop offset="50%" stopColor="rgba(255,255,255,0.06)" />
          <stop offset="85%" stopColor="rgba(180,160,120,0.12)" />
          <stop offset="100%" stopColor="rgba(140,120,80,0.2)" />
        </linearGradient>

        {/* Crutch cardboard gradient */}
        <linearGradient id={`${uid}-crutch`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ddd2b8" />
          <stop offset="25%" stopColor="#d6cab0" />
          <stop offset="75%" stopColor="#c8bca0" />
          <stop offset="100%" stopColor="#bfb394" />
        </linearGradient>

        {/* Crutch face (visible end circle) gradient */}
        <radialGradient id={`${uid}-crutch-face`} cx="0.45" cy="0.45">
          <stop offset="0%" stopColor="#d8ccb4" />
          <stop offset="60%" stopColor="#c4b89e" />
          <stop offset="100%" stopColor="#b0a588" />
        </radialGradient>

        {/* Cherry ember gradient */}
        <radialGradient id={`${uid}-ember`} cx="0.4" cy="0.45">
          <stop
            offset="0%"
            stopColor={flare ? "#fff0c0" : "#ffcc66"}
          />
          <stop
            offset="25%"
            stopColor={flare ? "#ffaa22" : "#ff8800"}
          />
          <stop
            offset="55%"
            stopColor={flare ? "#ee5500" : "#cc3300"}
          />
          <stop
            offset="85%"
            stopColor={flare ? "#aa2200" : "#771a00"}
          />
          <stop offset="100%" stopColor="#441000" />
        </radialGradient>

        {/* Outer glow for cherry */}
        <radialGradient id={`${uid}-glow`} cx="0.5" cy="0.5">
          <stop
            offset="0%"
            stopColor={flare ? "rgba(255,140,20,0.6)" : "rgba(255,100,0,0.25)"}
          />
          <stop
            offset="60%"
            stopColor={flare ? "rgba(255,80,0,0.2)" : "rgba(255,60,0,0.08)"}
          />
          <stop offset="100%" stopColor="rgba(255,40,0,0)" />
        </radialGradient>

        {/* Paper texture noise filter */}
        <filter id={`${uid}-grain`} x="0%" y="0%" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.65"
            numOctaves="4"
            seed="3"
            result="noise"
          />
          <feColorMatrix
            type="saturate"
            values="0"
            in="noise"
            result="mono"
          />
          <feBlend in="SourceGraphic" in2="mono" mode="multiply" />
        </filter>

        {/* Glow blur for cherry */}
        <filter id={`${uid}-cherry-glow`} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur
            stdDeviation={flare ? "6" : "3.5"}
            result="blur"
          />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        {/* Soft shadow under paper wrinkles */}
        <filter id={`${uid}-wrinkle`}>
          <feGaussianBlur stdDeviation="0.3" />
        </filter>

        {/* Clip for paper body */}
        <clipPath id={`${uid}-paper-clip`}>
          <path d={paperPath} />
        </clipPath>
      </defs>

      {/* ===== CRUTCH / FILTER ===== */}
      <g>
        {/* Main crutch body */}
        <rect
          x={0}
          y={cy - crutchHalfH}
          width={crutchLength}
          height={crutchHalfH * 2}
          rx={1.8}
          ry={1.8}
          fill={`url(#${uid}-crutch)`}
          stroke="#b5a88c"
          strokeWidth={0.35}
        />

        {/* Spiral pattern inside crutch — the rolled cardboard look */}
        {spirals.map((s, i) => (
          <ellipse
            key={i}
            cx={s.cx}
            cy={cy}
            rx={0.6}
            ry={crutchHalfH - 1.2}
            fill="none"
            stroke="#a89878"
            strokeWidth={0.45}
            opacity={s.opacity}
          />
        ))}

        {/* Horizontal cardboard fiber lines */}
        {[cy - 2.5, cy - 0.8, cy + 0.8, cy + 2.5].map((y, i) => (
          <line
            key={`fiber-${i}`}
            x1={1.5}
            y1={y}
            x2={crutchLength - 1.5}
            y2={y}
            stroke="#bfb094"
            strokeWidth={0.2}
            opacity={0.2 + (i % 2) * 0.1}
          />
        ))}

        {/* Visible end of the crutch — the spiral face */}
        <ellipse
          cx={0}
          cy={cy}
          rx={2}
          ry={crutchHalfH}
          fill={`url(#${uid}-crutch-face)`}
          stroke="#a89878"
          strokeWidth={0.35}
        />
        {/* Inner spiral on the face */}
        <ellipse
          cx={-0.3}
          cy={cy}
          rx={1.2}
          ry={3}
          fill="none"
          stroke="#a08868"
          strokeWidth={0.3}
          opacity={0.5}
        />
        <ellipse
          cx={-0.1}
          cy={cy}
          rx={0.5}
          ry={1.5}
          fill="none"
          stroke="#a08868"
          strokeWidth={0.25}
          opacity={0.4}
        />
      </g>

      {/* ===== PAPER BODY ===== */}
      {paperLength > 1 && (
        <g>
          {/* Base paper fill */}
          <path
            d={paperPath}
            fill={`url(#${uid}-paper)`}
            stroke="#d4ccb6"
            strokeWidth={0.3}
          />

          {/* Longitudinal shading overlay */}
          <path
            d={paperPath}
            fill={`url(#${uid}-paper-long)`}
          />

          {/* Paper texture — subtle noise */}
          <path
            d={paperPath}
            fill={`url(#${uid}-paper)`}
            filter={`url(#${uid}-grain)`}
            opacity={0.15}
          />

          {/* Grain/wrinkle lines along the paper — diagonal for realism */}
          <g clipPath={`url(#${uid}-paper-clip)`}>
            {grainLines.map((line, i) => {
              const hh = halfHAt(line.x);
              return (
                <line
                  key={`grain-${i}`}
                  x1={line.x - 0.5}
                  y1={cy - hh + 0.5}
                  x2={line.x + 0.5}
                  y2={cy + hh - 0.5}
                  stroke="#c8c0a8"
                  strokeWidth={0.3}
                  opacity={line.opacity}
                />
              );
            })}

            {/* Subtle diagonal creases */}
            {paperLength > 30 && (
              <>
                <line
                  x1={pLeft + paperLength * 0.2}
                  y1={cy - 3}
                  x2={pLeft + paperLength * 0.25}
                  y2={cy + 4}
                  stroke="#c5bc9f"
                  strokeWidth={0.25}
                  opacity={0.15}
                />
                <line
                  x1={pLeft + paperLength * 0.5}
                  y1={cy - 5}
                  x2={pLeft + paperLength * 0.55}
                  y2={cy + 5}
                  stroke="#c5bc9f"
                  strokeWidth={0.25}
                  opacity={0.12}
                />
                <line
                  x1={pLeft + paperLength * 0.75}
                  y1={cy - 6}
                  x2={pLeft + paperLength * 0.78}
                  y2={cy + 6}
                  stroke="#c5bc9f"
                  strokeWidth={0.25}
                  opacity={0.1}
                />
              </>
            )}

            {/* Seam line along the paper — the glue line */}
            {paperLength > 10 && (
              <line
                x1={pLeft + 2}
                y1={cy - crutchHalfH + 1.5}
                x2={pRight - 2}
                y2={cy - halfHAt(pRight) + 1.8}
                stroke="#d8d0b8"
                strokeWidth={0.4}
                opacity={0.3}
                strokeDasharray="3 5"
              />
            )}
          </g>
        </g>
      )}

      {/* ===== TWISTED TIP ===== */}
      {showTwist && paperLength > 60 && (
        <g>
          {/* The twist — a tapered point */}
          <path
            d={`
              M${twistX},${cy - halfHAt(twistX)}
              Q${twistX + twistLength * 0.6},${cy - halfHAt(twistX) * 0.4}
               ${twistEndX},${cy - 1}
              L${twistEndX},${cy + 1}
              Q${twistX + twistLength * 0.6},${cy + halfHAt(twistX) * 0.4}
               ${twistX},${cy + halfHAt(twistX)}
            `}
            fill="#e8e0cc"
            stroke="#d4ccb6"
            strokeWidth={0.25}
            opacity={0.85}
          />
          {/* Twist wrinkle lines */}
          <line
            x1={twistX + 2}
            y1={cy - halfHAt(twistX) * 0.7}
            x2={twistEndX - 1}
            y2={cy - 0.5}
            stroke="#c8c0a8"
            strokeWidth={0.2}
            opacity={0.3}
          />
          <line
            x1={twistX + 2}
            y1={cy + halfHAt(twistX) * 0.7}
            x2={twistEndX - 1}
            y2={cy + 0.5}
            stroke="#c8c0a8"
            strokeWidth={0.2}
            opacity={0.3}
          />
        </g>
      )}

      {/* ===== CHERRY / EMBER ===== */}
      {!isRoach && !showTwist && paperLength > 1 && (
        <g>
          {/* Outermost ambient glow */}
          <ellipse
            cx={pRight}
            cy={cy}
            rx={flare ? 18 : 10}
            ry={flare ? 14 : 8}
            fill={`url(#${uid}-glow)`}
            className="transition-all duration-300"
          />

          {/* Mid glow ring */}
          <ellipse
            cx={pRight}
            cy={cy}
            rx={flare ? 10 : 6}
            ry={flare ? 9 : 6.5}
            fill={flare ? "rgba(255,120,20,0.3)" : "rgba(255,80,10,0.1)"}
            filter={`url(#${uid}-cherry-glow)`}
            className="transition-all duration-300"
          />

          {/* Ash ring — slightly gray at the very edge */}
          <ellipse
            cx={pRight + 0.5}
            cy={cy}
            rx={halfHAt(pRight) + 0.5}
            ry={halfHAt(pRight) + 0.5}
            fill="none"
            stroke="#888"
            strokeWidth={0.8}
            opacity={0.25}
          />

          {/* Main ember body */}
          <ellipse
            cx={pRight}
            cy={cy}
            rx={halfHAt(pRight) - 0.3}
            ry={halfHAt(pRight)}
            fill={`url(#${uid}-ember)`}
            opacity={flare ? 1 : 0.9}
            className="transition-all duration-200"
          />

          {/* Hot white-yellow center when flaring */}
          {flare && (
            <ellipse
              cx={pRight - 0.5}
              cy={cy - 0.5}
              rx={2.5}
              ry={3}
              fill="#ffe880"
              opacity={0.7}
              className="transition-opacity duration-150"
            />
          )}

          {/* Cracks in the ember — dark fissure lines */}
          <line
            x1={pRight - 2}
            y1={cy - 1.5}
            x2={pRight + 1.5}
            y2={cy + 0.5}
            stroke="#441000"
            strokeWidth={0.3}
            opacity={flare ? 0.2 : 0.35}
          />
          <line
            x1={pRight - 1}
            y1={cy + 2}
            x2={pRight + 1}
            y2={cy - 0.5}
            stroke="#441000"
            strokeWidth={0.25}
            opacity={flare ? 0.15 : 0.3}
          />
        </g>
      )}

      {/* ===== ROACH STATE ===== */}
      {isRoach && (
        <g>
          {/* Burnt remnant */}
          <rect
            x={crutchLength}
            y={cy - crutchHalfH + 1}
            width={4}
            height={crutchHalfH * 2 - 2}
            rx={1}
            fill="#666"
            opacity={0.35}
          />
          {/* Tiny ash residue */}
          <ellipse
            cx={crutchLength + 4}
            cy={cy}
            rx={1.5}
            ry={2}
            fill="#888"
            opacity={0.2}
          />
        </g>
      )}

      {/* ===== SUBTLE SHADOW UNDER THE JOINT ===== */}
      <ellipse
        cx={crutchLength + paperLength * 0.4}
        cy={cy + crutchHalfH + 6}
        rx={paperLength * 0.3 + 10}
        ry={1.5}
        fill="rgba(0,0,0,0.06)"
      />
    </svg>
  );
}
