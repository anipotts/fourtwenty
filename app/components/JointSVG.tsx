"use client";

interface JointSVGProps {
  /** 0 = fully smoked, 1 = full length */
  length: number;
  /** Whether the cherry is flaring (someone just hit it) */
  flare?: boolean;
  className?: string;
}

export default function JointSVG({ length, flare = false, className }: JointSVGProps) {
  // Joint dimensions
  const totalWidth = 160;
  const jointHeight = 14;
  const filterTipWidth = 30;
  const paperMaxWidth = totalWidth - filterTipWidth;
  const paperWidth = paperMaxWidth * Math.max(length, 0.02);
  const cherrySize = 7;

  return (
    <svg
      viewBox={`0 0 ${totalWidth + 20} ${jointHeight + 30}`}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id="cherry-glow">
          <feGaussianBlur stdDeviation={flare ? "4" : "2"} />
          <feComposite in="SourceGraphic" />
        </filter>
        <linearGradient id="paper-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f5f0e0" />
          <stop offset="100%" stopColor="#e8dcc8" />
        </linearGradient>
        <linearGradient id="filter-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d4a050" />
          <stop offset="100%" stopColor="#c48830" />
        </linearGradient>
      </defs>

      <g transform={`translate(10, 15)`}>
        {/* Filter tip (always visible) */}
        <rect
          x={0}
          y={0}
          width={filterTipWidth}
          height={jointHeight}
          rx={2}
          fill="url(#filter-fill)"
        />
        {/* Filter tip lines */}
        {[8, 15, 22].map((x) => (
          <line
            key={x}
            x1={x}
            y1={1}
            x2={x}
            y2={jointHeight - 1}
            stroke="#b8782a"
            strokeWidth={0.5}
            opacity={0.5}
          />
        ))}

        {/* Paper (shrinks as joint is smoked) */}
        {paperWidth > 1 && (
          <rect
            x={filterTipWidth}
            y={0.5}
            width={paperWidth}
            height={jointHeight - 1}
            rx={1}
            fill="url(#paper-fill)"
          />
        )}

        {/* Cherry (lit end) */}
        {length > 0.02 && (
          <>
            {/* Glow */}
            <circle
              cx={filterTipWidth + paperWidth}
              cy={jointHeight / 2}
              r={cherrySize * (flare ? 2.5 : 1.5)}
              fill={flare ? "rgba(255,100,0,0.4)" : "rgba(255,80,0,0.2)"}
              filter="url(#cherry-glow)"
              className="transition-all duration-300"
            />
            {/* Core */}
            <circle
              cx={filterTipWidth + paperWidth}
              cy={jointHeight / 2}
              r={cherrySize * 0.6}
              fill={flare ? "#ff6600" : "#e04800"}
              className="transition-all duration-300"
            />
          </>
        )}

        {/* Ash tip when nearly done */}
        {length <= 0.02 && (
          <rect
            x={filterTipWidth}
            y={1}
            width={4}
            height={jointHeight - 2}
            rx={1}
            fill="#888"
            opacity={0.5}
          />
        )}
      </g>
    </svg>
  );
}
