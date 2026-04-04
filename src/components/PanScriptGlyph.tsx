/**
 * Simplified PanScript glyph: radial lines from center.
 * Position 0 = ding (center dot), 1..N = tone fields as short radial lines.
 */
/** biome-ignore-all lint/suspicious/noArrayIndexKey: because */
/** biome-ignore-all lint/a11y/noSvgWithoutTitle: because */

import { cn } from "@/lib/utils";

function getFieldAngle(index: number, total: number): number {
  return -Math.PI / 2 + (2 * Math.PI * (index - 1)) / total;
}

interface RadialGlyphProps {
  fields: number;
  active: number[];
  color?: string;
  size?: number;
  fluid?: boolean;
  className?: string;
}

/** Single-hand radial glyph */
export function RadialGlyph({
  fields,
  active,
  color,
  size = 28,
  fluid,
  className,
}: RadialGlyphProps) {
  const cx = 50,
    cy = 50;
  const innerR = 24;
  const outerR = 44;
  const activeSet = new Set(active);

  return (
    <svg
      viewBox="0 0 100 100"
      {...(fluid
        ? { width: "100%", height: "100%" }
        : { width: size, height: size })}
      className={cn("shrink-0", className)}
    >
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
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={color || "currentColor"}
            strokeWidth={7}
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}
