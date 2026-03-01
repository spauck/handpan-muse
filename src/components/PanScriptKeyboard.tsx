import { useSettings, noteStorageValue, handColorClass } from "@/lib/settings";
import { Eraser } from "lucide-react";
import { useState } from "react";
import type { Hand } from "@/lib/composer-state";

interface SelectedCell {
  rowIdx: number;
  beatIdx: number;
}

interface PanScriptKeyboardProps {
  fields: number;
  selectedCell: SelectedCell | null;
  activeNotes: Array<{ value: string; hand: Hand }>;
  onAssignNote: (value: string, hand: Hand) => void;
  onRemoveNote: (value: string) => void;
  onClearAll: () => void;
}

const HAND_OPTIONS: { hand: Hand; label: string; short: string }[] = [
  { hand: "right", label: "Right", short: "R" },
  { hand: "left", label: "Left", short: "L" },
  { hand: "any", label: "Any", short: "A" },
];

function getFieldPosition(index: number, total: number, cx: number, cy: number, r: number) {
  const angle = (-Math.PI / 2) + (2 * Math.PI * (index - 1)) / total;
  return {
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  };
}

export function PanScriptKeyboard({ fields, selectedCell, activeNotes, onAssignNote, onRemoveNote, onClearAll }: PanScriptKeyboardProps) {
  const [pendingNote, setPendingNote] = useState<string | null>(null);

  if (!selectedCell) return null;

  const activeMap = new Map(activeNotes.map(n => [n.value, n.hand]));
  const totalNotes = activeNotes.length;

  const cx = 100;
  const cy = 100;
  const outerR = 85;
  const spokeR = 75;
  const hitR = 18;
  const dingR = 16;

  const handleTap = (pos: number) => {
    const val = `p${pos}`;
    if (pendingNote === val) {
      setPendingNote(null);
    } else {
      setPendingNote(val);
    }
  };

  const handleHandPick = (hand: Hand) => {
    if (!pendingNote) return;
    onAssignNote(pendingNote, hand);
    setPendingNote(null);
  };

  const handleRemove = () => {
    if (!pendingNote) return;
    onRemoveNote(pendingNote);
    setPendingNote(null);
  };

  const existingHand = pendingNote ? activeMap.get(pendingNote) ?? null : null;
  const isNewNote = pendingNote !== null && !activeMap.has(pendingNote);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur border-t border-border px-3 py-2 safe-bottom">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-1 mb-1">
          <span className="text-[10px] text-muted-foreground">
            Row {selectedCell.rowIdx + 1}, Beat {selectedCell.beatIdx + 1}
          </span>
          {totalNotes > 0 && (
            <span className="text-[10px] text-muted-foreground ml-1">
              · {totalNotes}/3 position{totalNotes !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Hand picker */}
        {pendingNote !== null && (
          <div className="flex items-center gap-1.5 mb-1.5 bg-secondary/50 rounded-lg px-2 py-1.5 border border-border">
            <span className="text-xs text-muted-foreground mr-1">
              {isNewNote ? "Add to:" : "Move to:"}
            </span>
            {HAND_OPTIONS.map(({ hand, label, short }) => {
              const isCurrentHand = existingHand === hand;
              const colorCls = handColorClass(hand);
              const disabled = isNewNote && totalNotes >= 3;
              return (
                <button
                  key={hand}
                  onClick={() => handleHandPick(hand)}
                  disabled={disabled}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-colors border ${
                    isCurrentHand
                      ? `${colorCls} border-ring bg-accent`
                      : disabled
                        ? "text-muted-foreground/40 border-border cursor-not-allowed"
                        : `${colorCls} border-border hover:border-ring/50 hover:bg-accent/50`
                  }`}
                >
                  {short} · {label}
                </button>
              );
            })}
            {!isNewNote && (
              <button
                onClick={handleRemove}
                className="px-3 py-1 rounded text-xs font-semibold transition-colors border border-border text-destructive hover:bg-destructive/20"
              >
                ✕ Remove
              </button>
            )}
            <button
              onClick={() => setPendingNote(null)}
              className="ml-auto text-[10px] text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        )}

        <div className="flex items-center gap-3">
          <svg viewBox="0 0 200 200" className="w-28 h-28 sm:w-32 sm:h-32 shrink-0">
            <circle cx={cx} cy={cy} r={outerR} fill="none" className="stroke-muted-foreground" strokeWidth={2} opacity={0.3} />

            {Array.from({ length: fields }, (_, i) => {
              const pos = getFieldPosition(i + 1, fields, cx, cy, spokeR);
              return (
                <line key={`spoke-${i}`} x1={cx} y1={cy} x2={pos.x} y2={pos.y} className="stroke-muted-foreground" strokeWidth={1.5} opacity={0.2} />
              );
            })}

            {/* Ding */}
            <circle
              cx={cx} cy={cy} r={dingR}
              className={`cursor-pointer transition-colors ${
                pendingNote === "p0"
                  ? "fill-accent stroke-ring"
                  : activeMap.has("p0")
                    ? "fill-primary stroke-primary"
                    : totalNotes >= 3
                      ? "fill-none stroke-muted-foreground opacity-20 cursor-not-allowed"
                      : "fill-none stroke-muted-foreground hover:stroke-foreground opacity-40 hover:opacity-70"
              }`}
              strokeWidth={2}
              onClick={() => handleTap(0)}
            />
            <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" className="text-[10px] fill-muted-foreground pointer-events-none font-mono" opacity={0.5}>D</text>

            {Array.from({ length: fields }, (_, i) => {
              const pos = getFieldPosition(i + 1, fields, cx, cy, spokeR * 0.72);
              const val = `p${i + 1}`;
              const isActive = activeMap.has(val);
              const isPending = pendingNote === val;
              const isDisabled = !isActive && totalNotes >= 3;

              return (
                <g key={`field-${i}`}>
                  <circle
                    cx={pos.x} cy={pos.y} r={hitR}
                    className={`cursor-pointer transition-colors ${
                      isPending
                        ? "fill-accent stroke-ring"
                        : isActive
                          ? "fill-primary stroke-primary"
                          : isDisabled
                            ? "fill-none stroke-muted-foreground opacity-15 cursor-not-allowed"
                            : "fill-none stroke-muted-foreground hover:stroke-foreground opacity-30 hover:opacity-60"
                    }`}
                    strokeWidth={2}
                    onClick={() => !isDisabled && handleTap(i + 1)}
                  />
                  <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central" className="text-[9px] fill-muted-foreground pointer-events-none font-mono" opacity={0.4}>
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
