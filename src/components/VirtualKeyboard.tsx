import { useSettings, noteStorageValue, handColorClass } from "@/lib/settings";
import { IconNote } from "./IconNote";
import { Eraser } from "lucide-react";
import { useState } from "react";
import type { Hand } from "@/lib/composer-state";

interface SelectedCell {
  rowIdx: number;
  beatIdx: number;
}

interface VirtualKeyboardProps {
  selectedCell: SelectedCell | null;
  /** All notes in the beat with their hand assignment */
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

export function VirtualKeyboard({ selectedCell, activeNotes, onAssignNote, onRemoveNote, onClearAll }: VirtualKeyboardProps) {
  const { settings } = useSettings();
  const [pendingNote, setPendingNote] = useState<string | null>(null);

  if (!selectedCell) return null;

  const activeMap = new Map(activeNotes.map(n => [n.value, n.hand]));
  const totalNotes = activeNotes.length;

  const handleKeyTap = (storageVal: string) => {
    if (pendingNote === storageVal) {
      setPendingNote(null);
    } else {
      setPendingNote(storageVal);
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
  const canAdd = totalNotes < 3 || !isNewNote;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur border-t border-border px-3 py-2 safe-bottom">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-1 mb-1.5">
          <span className="text-[10px] text-muted-foreground">
            Row {selectedCell.rowIdx + 1}, Beat {selectedCell.beatIdx + 1}
          </span>
          {totalNotes > 0 && (
            <span className="text-[10px] text-muted-foreground ml-1">
              · {totalNotes}/3 note{totalNotes !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Hand picker row — shown when a note is pending */}
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

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {settings.keyboardKeys.map((key, i) => {
            const storageVal = noteStorageValue(key);
            const noteHand = activeMap.get(storageVal);
            const isActive = noteHand !== undefined;
            const isPending = pendingNote === storageVal;
            const isDisabled = !isActive && totalNotes >= 3;
            const activeBorderColor = isActive ? handColorClass(noteHand) : "";

            return (
              <button
                key={`${key.type}-${key.value}-${i}`}
                onClick={() => handleKeyTap(storageVal)}
                disabled={isDisabled}
                className={`shrink-0 w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-lg font-mono text-sm font-semibold transition-colors border
                  ${isPending
                    ? "ring-2 ring-ring bg-accent border-ring"
                    : isActive
                      ? `${activeBorderColor} bg-secondary border-current`
                      : isDisabled
                        ? "bg-secondary/40 text-muted-foreground/40 border-border cursor-not-allowed"
                        : "bg-secondary hover:bg-accent text-foreground border-border"
                  }`}
              >
                {key.type === "icon" ? (
                  <IconNote name={key.value} size={18} />
                ) : (
                  key.value
                )}
              </button>
            );
          })}
          <button
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
