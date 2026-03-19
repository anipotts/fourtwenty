"use client";

import { useMemo } from "react";

interface JointSVGProps {
  length: number;
  flare?: boolean;
  className?: string;
}

export default function JointSVG({ length, flare = false, className }: JointSVGProps) {
  const uid = useMemo(() => `j${Math.random().toString(36).slice(2, 8)}`, []);
  const cl = Math.max(Math.min(length, 1), 0);

  // Vertical joint — origin at bottom (filter), grows upward
  // Viewbox: tall and narrow
  const filterH = 40;
  const filterW = 14;
  const maxPaperH = 160;
  const paperH = maxPaperH * Math.max(cl, 0.02);

  // Conical: filter is narrower, cherry end is wider
  const filterHalfW = filterW / 2;
  const tipHalfW = filterHalfW + 2.5;

  // Y coordinates (0 = top of viewbox, joint grows downward from cherry to filter)
  const filterTop = 200 - filterH;
  const filterBot = 200;
  const paperTop = filterTop - paperH;
  const cherryY = paperTop;

  // Interpolate width at any Y position along the paper
  const halfWAt = (y: number) => {
    const t = (filterTop - y) / Math.max(paperH, 1);
    return filterHalfW + t * (tipHalfW - filterHalfW);
  };

  const cx = 50; // center X

  return (
    <svg
      viewBox="0 -10 100 220"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      style={{ transform: "rotate(-12deg)" }}
    >
      <defs>
        <linearGradient id={`${uid}-paper`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#f2f0ec" />
          <stop offset="30%" stopColor="#edeae4" />
          <stop offset="70%" stopColor="#eae7e0" />
          <stop offset="100%" stopColor="#e8e5de" />
        </linearGradient>

        {/* Herb showing through paper — darker center band */}
        <linearGradient id={`${uid}-herb`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(120,100,70,0)" />
          <stop offset="25%" stopColor="rgba(120,100,70,0.12)" />
          <stop offset="50%" stopColor="rgba(100,85,55,0.18)" />
          <stop offset="75%" stopColor="rgba(120,100,70,0.12)" />
          <stop offset="100%" stopColor="rgba(120,100,70,0)" />
        </linearGradient>

        {/* Herb gradient along length — darker toward cherry */}
        <linearGradient id={`${uid}-herb-v`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="rgba(100,80,50,0)" />
          <stop offset="30%" stopColor="rgba(100,80,50,0.08)" />
          <stop offset="70%" stopColor="rgba(90,70,40,0.2)" />
          <stop offset="100%" stopColor="rgba(80,60,35,0.28)" />
        </linearGradient>

        <linearGradient id={`${uid}-filter`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#f0ede8" />
          <stop offset="50%" stopColor="#ebe8e2" />
          <stop offset="100%" stopColor="#e5e2dc" />
        </linearGradient>

        {/* Cherry ember */}
        <radialGradient id={`${uid}-ember`} cx="0.5" cy="0.6">
          <stop offset="0%" stopColor={flare ? "#ff8833" : "#cc4400"} />
          <stop offset="40%" stopColor={flare ? "#aa3300" : "#663300"} />
          <stop offset="70%" stopColor="#443322" />
          <stop offset="100%" stopColor="#2a2220" />
        </radialGradient>

        <radialGradient id={`${uid}-glow`} cx="0.5" cy="0.5">
          <stop offset="0%" stopColor={flare ? "rgba(255,120,20,0.5)" : "rgba(255,80,0,0.15)"} />
          <stop offset="100%" stopColor="rgba(255,40,0,0)" />
        </radialGradient>

        <clipPath id={`${uid}-paper-clip`}>
          <path d={`
            M${cx - filterHalfW},${filterTop}
            L${cx - halfWAt(paperTop)},${paperTop}
            L${cx + halfWAt(paperTop)},${paperTop}
            L${cx + filterHalfW},${filterTop}
            Z
          `} />
        </clipPath>
      </defs>

      {/* ===== FILTER / CRUTCH ===== */}
      <rect
        x={cx - filterHalfW}
        y={filterTop}
        width={filterW}
        height={filterH}
        rx={1.5}
        fill={`url(#${uid}-filter)`}
        stroke="#d8d5d0"
        strokeWidth={0.4}
      />

      {/* Filter fold lines — RAW style accordion folds */}
      {[0.15, 0.35, 0.55, 0.75, 0.9].map((t, i) => (
        <line
          key={i}
          x1={cx - filterHalfW + 1.5}
          y1={filterTop + filterH * t}
          x2={cx + filterHalfW - 1.5}
          y2={filterTop + filterH * t}
          stroke="#ccc8c2"
          strokeWidth={0.3}
          opacity={0.4 + (i % 2) * 0.15}
        />
      ))}

      {/* "tap to hit" text on filter */}
      <text
        x={cx}
        y={filterTop + filterH * 0.55}
        textAnchor="middle"
        fontSize="4.5"
        fontFamily="system-ui, sans-serif"
        fontWeight="500"
        letterSpacing="0.5"
        fill="#b0aaa0"
        opacity={0.6}
      >
        tap to hit
      </text>

      {/* ===== PAPER BODY ===== */}
      {paperH > 1 && (
        <g>
          {/* Paper base */}
          <path
            d={`
              M${cx - filterHalfW},${filterTop}
              L${cx - halfWAt(paperTop)},${paperTop}
              Q${cx},${paperTop - 1.5} ${cx + halfWAt(paperTop)},${paperTop}
              L${cx + filterHalfW},${filterTop}
              Z
            `}
            fill={`url(#${uid}-paper)`}
            stroke="#ddd9d3"
            strokeWidth={0.3}
          />

          {/* Herb showing through — horizontal band */}
          <rect
            x={cx - tipHalfW}
            y={paperTop}
            width={tipHalfW * 2}
            height={paperH}
            fill={`url(#${uid}-herb)`}
            clipPath={`url(#${uid}-paper-clip)`}
          />

          {/* Herb gradient along length */}
          <rect
            x={cx - tipHalfW}
            y={paperTop}
            width={tipHalfW * 2}
            height={paperH}
            fill={`url(#${uid}-herb-v)`}
            clipPath={`url(#${uid}-paper-clip)`}
          />

          {/* Subtle wrinkle lines */}
          <g clipPath={`url(#${uid}-paper-clip)`} opacity={0.15}>
            {Array.from({ length: Math.floor(paperH / 12) }, (_, i) => {
              const y = filterTop - (i + 1) * 12;
              const hw = halfWAt(y);
              return (
                <line
                  key={i}
                  x1={cx - hw + 1}
                  y1={y - 0.5}
                  x2={cx + hw - 1}
                  y2={y + 0.5}
                  stroke="#c8c4bc"
                  strokeWidth={0.3}
                />
              );
            })}
          </g>

          {/* Seam line — the glue edge */}
          {paperH > 20 && (
            <line
              x1={cx + filterHalfW - 1}
              y1={filterTop - 2}
              x2={cx + halfWAt(paperTop) - 1.5}
              y2={paperTop + 3}
              stroke="#e0dcd5"
              strokeWidth={0.4}
              opacity={0.35}
              clipPath={`url(#${uid}-paper-clip)`}
            />
          )}
        </g>
      )}

      {/* ===== CHERRY ===== */}
      {cl > 0.02 && (
        <g>
          {/* Outer glow */}
          <ellipse
            cx={cx}
            cy={cherryY}
            rx={flare ? 16 : 8}
            ry={flare ? 12 : 6}
            fill={`url(#${uid}-glow)`}
            className="transition-all duration-300"
          />

          {/* Ash cap — dark gray top */}
          <ellipse
            cx={cx}
            cy={cherryY}
            rx={halfWAt(cherryY)}
            ry={4}
            fill={`url(#${uid}-ember)`}
            className="transition-all duration-200"
          />

          {/* Ash texture — gray crust */}
          <ellipse
            cx={cx}
            cy={cherryY - 1}
            rx={halfWAt(cherryY) - 1}
            ry={2.5}
            fill="#555"
            opacity={flare ? 0.3 : 0.5}
            className="transition-opacity duration-200"
          />

          {/* Hot ember peeking through ash when flaring */}
          {flare && (
            <ellipse
              cx={cx + 0.5}
              cy={cherryY + 0.5}
              rx={3}
              ry={2}
              fill="#ff6622"
              opacity={0.6}
            />
          )}
        </g>
      )}

      {/* ===== ROACH ===== */}
      {cl <= 0.02 && (
        <rect
          x={cx - filterHalfW + 1}
          y={filterTop - 4}
          width={filterW - 2}
          height={4}
          rx={1}
          fill="#777"
          opacity={0.3}
        />
      )}
    </svg>
  );
}
