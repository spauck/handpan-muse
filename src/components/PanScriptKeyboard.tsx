import { Eraser } from "lucide-react";

interface SelectedCell {
  rowIdx: number;
  beatIdx: number;
  hand: "right" | "left";
}

interface PanScriptKeyboardProps {
  fields: number;
  selectedCell: SelectedCell | null;
  activeNotes: string[];
  onKeyPress: (value: string) => void;
  onClearAll: () => void;
}

function getFieldPosition(index: number, total: number, cx: number, cy: number, r: number) {
  const angle = (-Math.PI / 2) + (2 * Math.PI * (index - 1)) / total;
  return {
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  };
}

export function PanScriptKeyboard({ fields, selectedCell, activeNotes, onKeyPress, onClearAll }: PanScriptKeyboardProps) {
  if (!selectedCell) return null;

  const handLabel = selectedCell.hand === "right" ? "R" : "L";
  const handColorClass = selectedCell.hand === "right" ? "text-hand-right" : "text-hand-left";

  const activeSet = new Set(activeNotes);
  const maxNotes = 3;

  const cx = 100;
  const cy = 100;
  const outerR = 85;
  const spokeR = 75;
  const hitR = 18;
  const dingR = 16;

  const handleTap = (pos: number) => {
    const val = `p${pos}`;
    const isActive = activeSet.has(val);
    if (!isActive && activeNotes.length >= maxNotes) return;
    onKeyPress(val);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur border-t border-border px-3 py-2 safe-bottom">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-1 mb-1">
          <span className={`text-xs font-mono font-bold ${handColorClass}`}>{handLabel}</span>
          <span className="text-[10px] text-muted-foreground">
            Row {selectedCell.rowIdx + 1}, Beat {selectedCell.beatIdx + 1}
          </span>
          {activeNotes.length > 0 && (
            <span className="text-[10px] text-muted-foreground ml-1">
              · {activeNotes.length}/{maxNotes} position{activeNotes.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <svg viewBox="0 0 200 200" className="w-28 h-28 sm:w-32 sm:h-32 shrink-0">
            {/* Outer circle */}
            <circle cx={cx} cy={cy} r={outerR} fill="none" className="stroke-muted-foreground" strokeWidth={2} opacity={0.3} />

            {/* Spokes */}
            {Array.from({ length: fields }, (_, i) => {
              const pos = getFieldPosition(i + 1, fields, cx, cy, spokeR);
              return (
                <line
                  key={`spoke-${i}`}
                  x1={cx} y1={cy} x2={pos.x} y2={pos.y}
                  className="stroke-muted-foreground"
                  strokeWidth={1.5}
                  opacity={0.2}
                />
              );
            })}

            {/* Ding (center) - clickable */}
            <circle
              cx={cx} cy={cy} r={dingR}
              className={`cursor-pointer transition-colors ${
                activeSet.has("p0")
                  ? "fill-primary stroke-primary"
                  : activeNotes.length >= maxNotes
                    ? "fill-none stroke-muted-foreground opacity-20 cursor-not-allowed"
                    : "fill-none stroke-muted-foreground hover:stroke-foreground opacity-40 hover:opacity-70"
              }`}
              strokeWidth={2}
              onClick={() => handleTap(0)}
            />
            <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" className="text-[10px] fill-muted-foreground pointer-events-none font-mono" opacity={0.5}>D</text>

            {/* Tone fields */}
            {Array.from({ length: fields }, (_, i) => {
              const pos = getFieldPosition(i + 1, fields, cx, cy, spokeR * 0.72);
              const val = `p${i + 1}`;
              const isActive = activeSet.has(val);
              const isDisabled = !isActive && activeNotes.length >= maxNotes;

              return (
                <g key={`field-${i}`}>
                  <circle
                    cx={pos.x} cy={pos.y} r={hitR}
                    className={`cursor-pointer transition-colors ${
                      isActive
                        ? "fill-primary stroke-primary"
                        : isDisabled
                          ? "fill-none stroke-muted-foreground opacity-15 cursor-not-allowed"
                          : "fill-none stroke-muted-foreground hover:stroke-foreground opacity-30 hover:opacity-60"
                    }`}
                    strokeWidth={2}
                    onClick={() => !isDisabled && handleTap(i + 1)}
                  />
                  <text
                    x={pos.x} y={pos.y}
                    textAnchor="middle" dominantBaseline="central"
                    className="text-[9px] fill-muted-foreground pointer-events-none font-mono"
                    opacity={0.4}
                  >
                    {i + 1}
                  </text>
                </g>
              );
            })}
          </svg>

          <button
            onClick={onClearAll}
            className="shrink-0 w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-lg bg-secondary hover:bg-destructive/20 text-muted-foreground hover:text-destructive font-mono text-sm transition-colors border border-border"
            title="Clear all positions"
          >
            <Eraser size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
