/**
 * Simplified PanScript glyph: radial lines from center.
 * Position 0 = ding (center dot), 1..N = tone fields as short radial lines.
 */

function getFieldAngle(index: number, total: number): number {
  return (-Math.PI / 2) + (2 * Math.PI * (index - 1)) / total;
}

interface RadialGlyphProps {
  fields: number;
  active: number[];
  color?: string;
  size?: number;
  fluid?: boolean;
}

/** Single-hand radial glyph */
export function RadialGlyph({ fields, active, color, size = 28, fluid }: RadialGlyphProps) {
  const cx = 50, cy = 50;
  const innerR = 12;
  const outerR = 42;
  const activeSet = new Set(active);

  return (
    <svg viewBox="0 0 100 100" {...(fluid ? { width: "100%", height: "100%" } : { width: size, height: size })} className="shrink-0">
      {/* Ding — small dot */}
      {activeSet.has(0) && (
        <circle cx={cx} cy={cy} r={5} fill={color || "currentColor"} />
      )}
      {/* Tone field lines */}
      {Array.from({ length: fields }, (_, i) => {
        if (!activeSet.has(i + 1)) return null;
        const angle = getFieldAngle(i + 1, fields);
        const x1 = cx + innerR * Math.cos(angle);
        const y1 = cy + innerR * Math.sin(angle);
        const x2 = cx + outerR * Math.cos(angle);
        const y2 = cy + outerR * Math.sin(angle);
        return (
          <line
            key={i}
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={color || "currentColor"}
            strokeWidth={6}
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}

/** Composite glyph: overlays multiple hands */
interface CompositeGlyphProps {
  fields: number;
  rightActive: number[];
  leftActive: number[];
  size?: number;
  rightColor: string;
  leftColor: string;
  fluid?: boolean;
}

export function CompositeGlyph({ fields, rightActive, leftActive, size = 28, rightColor, leftColor, fluid }: CompositeGlyphProps) {
  const cx = 50, cy = 50;
  const innerR = 12;
  const outerR = 42;

  const rightSet = new Set(rightActive);
  const leftSet = new Set(leftActive);

  const renderLine = (idx: number, color: string, offset: number, key: string) => {
    const angle = getFieldAngle(idx, fields);
    const perpX = Math.cos(angle + Math.PI / 2) * offset;
    const perpY = Math.sin(angle + Math.PI / 2) * offset;
    const x1 = cx + innerR * Math.cos(angle) + perpX;
    const y1 = cy + innerR * Math.sin(angle) + perpY;
    const x2 = cx + outerR * Math.cos(angle) + perpX;
    const y2 = cy + outerR * Math.sin(angle) + perpY;
    return <line key={key} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={3} strokeLinecap="round" />;
  };

  return (
    <svg viewBox="0 0 100 100" {...(fluid ? { width: "100%", height: "100%" } : { width: size, height: size })} className="shrink-0">
      {/* Ding */}
      {(rightSet.has(0) || leftSet.has(0)) && (() => {
        const hasR = rightSet.has(0);
        const hasL = leftSet.has(0);
        if (hasR && hasL) {
          const clipR = "ding-clip-r";
          const clipL = "ding-clip-l";
          return (
            <g>
              <defs>
                <clipPath id={clipR}><rect x={cx - 5} y={cy - 5} width={5} height={10} /></clipPath>
                <clipPath id={clipL}><rect x={cx} y={cy - 5} width={5} height={10} /></clipPath>
              </defs>
              <circle cx={cx} cy={cy} r={5} fill={rightColor} clipPath={`url(#${clipR})`} />
              <circle cx={cx} cy={cy} r={5} fill={leftColor} clipPath={`url(#${clipL})`} />
            </g>
          );
        }
        return <circle cx={cx} cy={cy} r={5} fill={hasR ? rightColor : leftColor} />;
      })()}
      {/* Tone fields */}
      {Array.from({ length: fields }, (_, i) => {
        const idx = i + 1;
        const hasR = rightSet.has(idx);
        const hasL = leftSet.has(idx);
        if (hasR && hasL) {
          return (
            <g key={i}>
              {renderLine(idx, rightColor, -2, `r-${i}`)}
              {renderLine(idx, leftColor, 2, `l-${i}`)}
            </g>
          );
        }
        if (hasR) return renderLine(idx, rightColor, 0, `r-${i}`);
        if (hasL) return renderLine(idx, leftColor, 0, `l-${i}`);
        return null;
      })}
    </svg>
  );
}
