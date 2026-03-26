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

/** Composite glyph: overlays two hands' active positions on one diagram */
interface CompositeGlyphProps {
  fields: number;
  rightActive: number[];
  leftActive: number[];
  size?: number;
  rightColor: string;
  leftColor: string;
  /** When true, renders at 100% width/height instead of fixed size */
  fluid?: boolean;
}

export function CompositeGlyph({ fields, rightActive, leftActive, size = 28, rightColor, leftColor, fluid }: CompositeGlyphProps) {
  const cx = 50;
  const cy = 50;
  const outerR = 42;
  const spokeR = 38;
  const dotR = 7;
  const dingR = 6;

  const rightSet = new Set(rightActive);
  const leftSet = new Set(leftActive);

  const getDotProps = (idx: number) => {
    const hasRight = rightSet.has(idx);
    const hasLeft = leftSet.has(idx);
    if (hasRight && hasLeft) {
      // Both hands — split dot: right on left half, left on right half
      return { type: "both" as const, rightColor, leftColor };
    }
    if (hasRight) return { type: "single" as const, color: rightColor };
    if (hasLeft) return { type: "single" as const, color: leftColor };
    return { type: "empty" as const };
  };

  const renderDot = (cx: number, cy: number, r: number, idx: number, key: string) => {
    const props = getDotProps(idx);
    if (props.type === "empty") {
      return <circle key={key} cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" strokeWidth={1} opacity={0.15} />;
    }
    if (props.type === "single") {
      return <circle key={key} cx={cx} cy={cy} r={r} fill={props.color} />;
    }
    // Both: render two half-circles
    const clipIdR = `${key}-clip-r`;
    const clipIdL = `${key}-clip-l`;
    return (
      <g key={key}>
        <defs>
          <clipPath id={clipIdR}><rect x={cx - r} y={cy - r} width={r} height={r * 2} /></clipPath>
          <clipPath id={clipIdL}><rect x={cx} y={cy - r} width={r} height={r * 2} /></clipPath>
        </defs>
        <circle cx={cx} cy={cy} r={r} fill={props.rightColor} clipPath={`url(#${clipIdR})`} />
        <circle cx={cx} cy={cy} r={r} fill={props.leftColor} clipPath={`url(#${clipIdL})`} />
      </g>
    );
  };

  return (
    <svg viewBox="0 0 100 100" {...(fluid ? { width: "100%", height: "100%" } : { width: size, height: size })} className="shrink-0">
      <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="currentColor" strokeWidth={2} opacity={0.3} />
      {Array.from({ length: fields }, (_, i) => {
        const pos = getFieldPosition(i + 1, fields, cx, cy, spokeR);
        return <line key={`spoke-${i}`} x1={cx} y1={cy} x2={pos.x} y2={pos.y} stroke="currentColor" strokeWidth={1.5} opacity={0.2} />;
      })}
      {renderDot(cx, cy, dingR, 0, "ding")}
      {Array.from({ length: fields }, (_, i) => {
        const pos = getFieldPosition(i + 1, fields, cx, cy, spokeR * 0.75);
        return renderDot(pos.x, pos.y, dotR, i + 1, `dot-${i}`);
      })}
    </svg>
  );
}
