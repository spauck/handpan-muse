/**
 * PanScript glyph: a top-down handpan diagram rendered as SVG.
 * Positions: 0 = ding (center), 1..n = tone fields clockwise from top.
 */

interface PanScriptGlyphProps {
  /** Total tone fields (excluding ding). Default 8 for a 8+1 handpan. */
  fields: number;
  /** Active position indices (0 = ding, 1..fields = tone fields) */
  active: number[];
  /** SVG width/height in px */
  size?: number;
  /** Color class for active dots, as CSS color string */
  color?: string;
}

function getFieldPosition(index: number, total: number, cx: number, cy: number, r: number) {
  // Start from top (-90°), go clockwise
  const angle = (-Math.PI / 2) + (2 * Math.PI * (index - 1)) / total;
  return {
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  };
}

export function PanScriptGlyph({ fields, active, size = 28, color }: PanScriptGlyphProps) {
  const cx = 50;
  const cy = 50;
  const outerR = 42;
  const spokeR = 38;
  const dotR = 7;
  const dingR = 6;

  const activeSet = new Set(active);

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className="shrink-0"
    >
      {/* Outer circle */}
      <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="currentColor" strokeWidth={2} opacity={0.3} />

      {/* Spokes */}
      {Array.from({ length: fields }, (_, i) => {
        const pos = getFieldPosition(i + 1, fields, cx, cy, spokeR);
        return (
          <line
            key={`spoke-${i}`}
            x1={cx}
            y1={cy}
            x2={pos.x}
            y2={pos.y}
            stroke="currentColor"
            strokeWidth={1.5}
            opacity={0.2}
          />
        );
      })}

      {/* Ding (center) */}
      <circle
        cx={cx}
        cy={cy}
        r={dingR}
        fill={activeSet.has(0) ? (color || "currentColor") : "none"}
        stroke="currentColor"
        strokeWidth={activeSet.has(0) ? 0 : 1.5}
        opacity={activeSet.has(0) ? 1 : 0.3}
      />

      {/* Tone field dots */}
      {Array.from({ length: fields }, (_, i) => {
        const pos = getFieldPosition(i + 1, fields, cx, cy, spokeR * 0.75);
        const isActive = activeSet.has(i + 1);
        return (
          <circle
            key={`dot-${i}`}
            cx={pos.x}
            cy={pos.y}
            r={dotR}
            fill={isActive ? (color || "currentColor") : "none"}
            stroke={isActive ? "none" : "currentColor"}
            strokeWidth={isActive ? 0 : 1}
            opacity={isActive ? 1 : 0.15}
          />
        );
      })}
    </svg>
  );
}
