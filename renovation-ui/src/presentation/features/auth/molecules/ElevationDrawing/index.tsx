/**
 * A house front drawn as an architect's elevation: the product's own material.
 * The two pillars carry a sandstone-cladding hatch in the stone's own colours, with the area and cost
 * the app would compute for them, so the picture shows what the product does.
 * Figures match the built-in sample house (30 × 20 ft facade, 1.2 × 9.5 ft pillars).
 */
const INK = 'currentColor';

function Window({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x} y={y} width="50" height="40" fill="none" stroke={INK} strokeWidth="1.25" />
      <line x1={x + 25} y1={y} x2={x + 25} y2={y + 40} stroke={INK} strokeWidth="0.75" />
    </g>
  );
}

export function ElevationDrawing() {
  return (
    <svg
      viewBox="0 0 440 340"
      role="img"
      aria-label="Elevation drawing of a two-storey house, 30 feet wide and 20 feet high, with stone cladding on its two pillars"
      className="block h-auto w-full rounded-[2px] text-ink shadow-[0_2px_10px_rgb(0_0_0/0.35)]"
    >
      {/* The sheet of drawing paper. */}
      <rect width="440" height="340" fill="#fbfaf6" />
      <defs>
        <pattern id="ashlar" width="12" height="8" patternUnits="userSpaceOnUse">
          <rect width="12" height="8" fill="#ead8b6" />
          <path
            d="M0 0.5H12M0 4.5H12M6 0.5V4.5M0 4.5V8M12 4.5V8"
            stroke="#a07a4c"
            strokeWidth="0.6"
            fill="none"
          />
        </pattern>
      </defs>

      {/* Ground line */}
      <line x1="20" y1="270" x2="420" y2="270" stroke={INK} strokeWidth="1.5" />
      {/* Parapet and roof band */}
      <rect x="70" y="40" width="300" height="30" fill="none" stroke={INK} strokeWidth="1.25" />
      <rect
        x="70"
        y="70"
        width="300"
        height="10"
        className="fill-ink/10"
        stroke={INK}
        strokeWidth="1.25"
      />
      {/* Main wall */}
      <rect x="70" y="80" width="300" height="190" fill="none" stroke={INK} strokeWidth="1.5" />

      <Window x={100} y={110} />
      <Window x={290} y={110} />
      <Window x={100} y={190} />
      <Window x={290} y={190} />

      {/* Balcony: glazed door, railing, slab */}
      <rect x="190" y="100" width="60" height="70" fill="none" stroke={INK} strokeWidth="1.25" />
      <line x1="220" y1="100" x2="220" y2="170" stroke={INK} strokeWidth="0.75" />
      <rect x="170" y="140" width="100" height="30" fill="none" stroke={INK} strokeWidth="1" />
      {Array.from({ length: 11 }, (_, index) => (
        <line
          key={index}
          x1={175 + index * 9}
          y1="142"
          x2={175 + index * 9}
          y2="170"
          stroke={INK}
          strokeWidth="0.6"
        />
      ))}
      <rect
        x="170"
        y="170"
        width="100"
        height="10"
        className="fill-ink/10"
        stroke={INK}
        strokeWidth="1.25"
      />

      {/* Pillars with the stone finish applied */}
      <rect
        x="170"
        y="180"
        width="12"
        height="90"
        fill="url(#ashlar)"
        stroke="#8a6638"
        strokeWidth="1.25"
      />
      <rect
        x="258"
        y="180"
        width="12"
        height="90"
        fill="url(#ashlar)"
        stroke="#8a6638"
        strokeWidth="1.25"
      />
      {/* Door */}
      <rect x="203" y="200" width="34" height="70" fill="none" stroke={INK} strokeWidth="1.25" />
      <line x1="220" y1="200" x2="220" y2="270" stroke={INK} strokeWidth="0.75" />

      {/* Width dimension */}
      <g className="text-ink/60" stroke={INK} strokeWidth="0.75">
        <line x1="70" y1="292" x2="370" y2="292" />
        <line x1="70" y1="284" x2="70" y2="300" />
        <line x1="370" y1="284" x2="370" y2="300" />
      </g>
      <rect x="196" y="285" width="48" height="14" fill="#fbfaf6" />
      <text x="220" y="295.5" textAnchor="middle" className="fill-ink/80 font-mono text-[10px]">
        30 ft
      </text>

      {/* Height dimension */}
      <g className="text-ink/60" stroke={INK} strokeWidth="0.75">
        <line x1="44" y1="80" x2="44" y2="270" />
        <line x1="36" y1="80" x2="52" y2="80" />
        <line x1="36" y1="270" x2="52" y2="270" />
      </g>
      <rect x="30" y="168" width="28" height="14" fill="#fbfaf6" />
      <text x="44" y="178.5" textAnchor="middle" className="fill-ink/80 font-mono text-[10px]">
        20 ft
      </text>

      {/* Callout to the cladded pillar */}
      <g className="text-[#8a6638]" stroke={INK} strokeWidth="0.75" fill="none">
        <path d="M270 225 L318 225 L330 237" />
        <circle cx="270" cy="225" r="2" fill="#8a6638" />
      </g>
      <text x="334" y="244" className="fill-ink text-[11px]">
        Sandstone cladding
      </text>
      <text x="334" y="258" className="fill-ink/60 font-mono text-[10px]">
        70 sq ft · ₹22,927
      </text>
    </svg>
  );
}
