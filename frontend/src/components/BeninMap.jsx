/**
 * Map of Bénin (real border outline, projected from GeoJSON) with donor points
 * lighting up around a health facility while a signal pulses outward — a
 * picture of the matching, not a stock photo. Every animated element carries
 * `data-decorative` so it freezes under reduce-motion.
 */

// Bénin national border, projected into this 300×400 viewBox
// (source: johan/world.geo.json, longitude/latitude → SVG).
const COUNTRY =
  "M174 373 L125.2 380 L110.6 339.3 L113.3 203.6 L101.4 191.4 L99.2 162.4 " +
  "L78.6 141.7 L60.6 124.3 L68.1 93.2 L88.4 86.5 L100.5 60.6 L129.3 55.1 " +
  "L142.3 37.5 L162.1 20.2 L183.3 20 L228.3 54 L226 73.6 L239.3 108.7 " +
  "L227.7 132.5 L233.9 148.3 L205.2 184.9 L187 203 L175.9 240.3 L177.4 277.9 Z";

// Cotonou
const FACILITY = { x: 158, y: 366 };

// Approx. positions of real towns inside the outline.
// success = compatible AND close to the facility → alerted; primary = other
// donors in the base, too far to be notified for this urgency.
const DONORS = [
  { x: 172, y: 344, tone: "success" }, // Porto-Novo — proche, prévenu
  { x: 137, y: 319, tone: "success" }, // Bohicon — proche, prévenu
  { x: 162, y: 269, tone: "primary" }, // Savè
  { x: 170, y: 191, tone: "primary" }, // Parakou
  { x: 114, y: 170, tone: "primary" }, // Djougou
  { x: 104, y: 134, tone: "primary" }, // Natitingou
  { x: 189, y: 85, tone: "primary" }, // Kandi
];

const LINKS = [
  [137, 319],
  [172, 344],
];

export default function BeninMap({ className = "" }) {
  return (
    <svg
      viewBox="0 0 300 400"
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

      <path
        d={COUNTRY}
        fill="currentColor"
        fillOpacity="0.06"
        stroke="currentColor"
        strokeOpacity="0.3"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <rect
        x="0"
        y="0"
        width="300"
        height="400"
        fill="url(#benin-dots)"
        clipPath="url(#benin-clip)"
      />

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
              animation: "dot-in 640ms cubic-bezier(.34,1.56,.64,1) both",
              animationDelay: `${380 + i * 170}ms`,
            }}
          />
        </g>
      ))}

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
