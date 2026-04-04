import { Eraser } from "lucide-react";
import { useState } from "react";
import type { Hand } from "@/lib/composer-state";
import { handColorClass, useSettings } from "@/lib/settings";
import { ICON_NAMES, IconNote } from "./IconNote";
import { RadialGlyph } from "./PanScriptGlyph";

interface SelectedCell {
  rowIdx: number;
  beatIdx: number;
}

interface PositionKeyboardProps {
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

export function PositionKeyboard({
  selectedCell,
  activeNotes,
  onAssignNote,
  onRemoveNote,
  onClearAll,
}: PositionKeyboardProps) {
  const { settings } = useSettings();
  const [pendingNote, setPendingNote] = useState<string | null>(null);
  const [showIcons, setShowIcons] = useState(false);

  if (!selectedCell) return null;

  const activeMap = new Map(activeNotes.map((n) => [n.value, n.hand]));
  const totalNotes = activeNotes.length;
  const positions = [
    0,
    ...Array.from({ length: settings.panscriptFields }, (_, i) => i + 1),
  ];

  const handleTap = (val: string) => {
    setPendingNote(pendingNote === val ? null : val);
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

  const existingHand = pendingNote
    ? (activeMap.get(pendingNote) ?? null)
    : null;
  const isNewNote = pendingNote !== null && !activeMap.has(pendingNote);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur border-t border-border px-3 py-2 safe-bottom">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-1 mb-1.5">
          <span className="text-[10px] text-muted-foreground">
            Row {selectedCell.rowIdx + 1}, Beat {selectedCell.beatIdx + 1}
          </span>
          {totalNotes > 0 && (
            <span className="text-[10px] text-muted-foreground ml-1">
              · {totalNotes} note{totalNotes !== 1 ? "s" : ""}
            </span>
          )}
          <button
            type="button"
            onClick={() => setShowIcons((v) => !v)}
            className={`ml-auto text-[10px] px-2 py-0.5 rounded border transition-colors ${
              showIcons
                ? "bg-accent border-ring text-foreground"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {showIcons ? "Positions" : "Icons"}
          </button>
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
              return (
                <button
                  type="button"
                  key={hand}
                  onClick={() => handleHandPick(hand)}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-colors border ${
                    isCurrentHand
                      ? `${colorCls} border-ring bg-accent`
                      : `${colorCls} border-border hover:border-ring/50 hover:bg-accent/50`
                  }`}
                >
                  {short} · {label}
                </button>
              );
            })}
            {!isNewNote && (
              <button
                type="button"
                onClick={handleRemove}
                className="px-3 py-1 rounded text-xs font-semibold transition-colors border border-border text-destructive hover:bg-destructive/20"
              >
                ✕ Remove
              </button>
            )}
            <button
              type="button"
              onClick={() => setPendingNote(null)}
              className="ml-auto text-[10px] text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Note buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {!showIcons
            ? positions.map((pos) => {
                const val = String(pos);
                const noteHand = activeMap.get(val);
                const isActive = noteHand !== undefined;
                const isPending = pendingNote === val;
                const activeColor = isActive
                  ? noteHand === "right"
                    ? `hsl(${settings.rightHandColor})`
                    : noteHand === "left"
                      ? `hsl(${settings.leftHandColor})`
                      : `hsl(${settings.anyHandColor})`
                  : undefined;

                return (
                  <button
                    type="button"
                    key={pos}
                    onClick={() => handleTap(val)}
                    className={`shrink-0 w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-lg transition-colors border
                      ${
                        isPending
                          ? "ring-2 ring-ring bg-accent border-ring"
                          : isActive
                            ? `bg-secondary border-current`
                            : "bg-secondary hover:bg-accent text-foreground border-border"
                      }`}
                    style={isActive ? { color: activeColor } : undefined}
                    title={pos === 0 ? "Ding" : `Field ${pos}`}
                  >
                    <RadialGlyph
                      fields={settings.panscriptFields}
                      active={[pos]}
                      color={activeColor}
                      size={24}
                    />
                  </button>
                );
              })
            : ICON_NAMES.map((name) => {
                const val = `icon:${name}`;
                const noteHand = activeMap.get(val);
                const isActive = noteHand !== undefined;
                const isPending = pendingNote === val;
                const activeColor = isActive
                  ? noteHand === "right"
                    ? `hsl(${settings.rightHandColor})`
                    : noteHand === "left"
                      ? `hsl(${settings.leftHandColor})`
                      : `hsl(${settings.anyHandColor})`
                  : undefined;

                return (
                  <button
                    type="button"
                    key={name}
                    onClick={() => handleTap(val)}
                    className={`shrink-0 w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-lg transition-colors border
                      ${
                        isPending
                          ? "ring-2 ring-ring bg-accent border-ring"
                          : isActive
                            ? "bg-secondary border-current"
                            : "bg-secondary hover:bg-accent text-foreground border-border"
                      }`}
                    style={isActive ? { color: activeColor } : undefined}
                    title={name}
                  >
                    <IconNote name={name} color={activeColor} size={20} />
                  </button>
                );
              })}
          <button
            type="button"
            onClick={onClearAll}
            className="shrink-0 w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-lg bg-secondary hover:bg-destructive/20 text-muted-foreground hover:text-destructive font-mono text-sm transition-colors border border-border"
            title="Clear all notes"
          >
            <Eraser size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
