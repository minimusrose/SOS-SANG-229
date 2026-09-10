/**
 * Stylised map of Bénin: donor points light up around a health facility while
 * a signal pulses outward — a picture of the matching, not a stock photo.
 * All motion carries `data-decorative` so it freezes under reduce-motion.
 */

const COUNTRY =
  "M138 356 C128 340 122 320 120 300 C116 280 108 258 116 236 " +
  "C124 214 110 196 112 172 C114 146 96 120 104 96 C110 74 128 60 150 52 " +
  "C172 46 196 58 218 52 C236 47 252 56 256 78 C260 98 246 116 244 138 " +
  "C242 162 254 186 240 210 C228 232 236 256 220 278 C206 298 196 318 182 336 " +
  "C174 346 162 352 152 358 C148 360 142 360 138 356 Z";

const FACILITY = { x: 152, y: 320 };

const DONORS = [
  { x: 122, y: 250, tone: "primary" },
  { x: 200, y: 108, tone: "primary" },
  { x: 232, y: 168, tone: "success" },
  { x: 128, y: 158, tone: "primary" },
  { x: 176, y: 66, tone: "primary" },
  { x: 214, y: 240, tone: "primary" },
  { x: 162, y: 288, tone: "success" },
];

const LINKS = [
  [162, 288],
  [122, 250],
];

export default function BeninMap({ className = "" }) {
  return (
    <svg
      viewBox="0 0 300 380"
      className={`h-full w-full text-primary ${className}`.trim()}
      role="img"
      aria-label="Carte du Bénin : des donneurs compatibles autour d’un établissement de santé"
    >
      <defs>
        <clipPath id="benin-clip">
          <path d={COUNTRY} />
        </clipPath>
        <pattern
          id="benin-dots"
          width="14"
          height="14"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="2" cy="2" r="1.1" fill="currentColor" fillOpacity="0.18" />
        </pattern>
      </defs>

      {/* landmass */}
      <path
        d={COUNTRY}
        fill="currentColor"
        fillOpacity="0.06"
        stroke="currentColor"
        strokeOpacity="0.28"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <rect
        x="0"
        y="0"
        width="300"
        height="380"
        fill="url(#benin-dots)"
        clipPath="url(#benin-clip)"
      />

      {/* matching links */}
      {LINKS.map(([x, y]) => (
        <line
          key={`${x}-${y}`}
          x1={x}
          y1={y}
          x2={FACILITY.x}
          y2={FACILITY.y}
          stroke="currentColor"
          strokeOpacity="0.5"
          strokeWidth="2"
          strokeDasharray="2 5"
          strokeLinecap="round"
          data-decorative
          style={{ animation: "dash-flow 900ms linear infinite" }}
        />
      ))}

      {/* signal rings from the facility */}
      {[0, 0.9, 1.8].map((delay) => (
        <circle
          key={delay}
          cx={FACILITY.x}
          cy={FACILITY.y}
          r="34"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
          className="svg-anim"
          data-decorative
          style={{
            opacity: 0,
            animation: "pulse-ring 2.8s ease-out infinite",
            animationDelay: `${delay}s`,
          }}
        />
      ))}

      {/* donor points */}
      {DONORS.map((d, i) => (
        <g
          key={`${d.x}-${d.y}`}
          className={d.tone === "success" ? "text-success" : "text-primary"}
        >
          {d.tone === "success" ? (
            <circle
              cx={d.x}
              cy={d.y}
              r="11"
              fill="none"
              stroke="currentColor"
              strokeOpacity="0.4"
              strokeWidth="2"
              className="svg-anim"
              data-decorative
              style={{
                opacity: 0,
                animation: "pulse-ring 3.2s ease-out infinite",
                animationDelay: `${1.2 + i * 0.15}s`,
              }}
            />
          ) : null}
          <circle
            cx={d.x}
            cy={d.y}
            r="5.5"
            fill="currentColor"
            className="svg-anim"
            data-decorative
            style={{
              animation:
                "dot-in 640ms cubic-bezier(.34,1.56,.64,1) both",
              animationDelay: `${380 + i * 170}ms`,
            }}
          />
        </g>
      ))}

      {/* health facility */}
      <circle cx={FACILITY.x} cy={FACILITY.y} r="13" fill="#fff" />
      <circle cx={FACILITY.x} cy={FACILITY.y} r="10" fill="currentColor" />
      <path
        d={`M${FACILITY.x} ${FACILITY.y - 5}v10 M${FACILITY.x - 5} ${FACILITY.y}h10`}
        stroke="#fff"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
