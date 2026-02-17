import { useSettings, noteStorageValue } from "@/lib/settings";
import { IconNote } from "./IconNote";
import { Eraser } from "lucide-react";

interface SelectedCell {
  rowIdx: number;
  beatIdx: number;
  hand: "right" | "left";
}

interface VirtualKeyboardProps {
  selectedCell: SelectedCell | null;
  onKeyPress: (value: string | null) => void;
}

export function VirtualKeyboard({ selectedCell, onKeyPress }: VirtualKeyboardProps) {
  const { settings } = useSettings();

  if (!selectedCell) return null;

  const handLabel = selectedCell.hand === "right" ? "R" : "L";
  const handColorClass = selectedCell.hand === "right" ? "text-hand-right" : "text-hand-left";

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur border-t border-border px-3 py-2 safe-bottom">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-1 mb-1.5">
          <span className={`text-xs font-mono font-bold ${handColorClass}`}>{handLabel}</span>
          <span className="text-[10px] text-muted-foreground">
            Row {selectedCell.rowIdx + 1}, Beat {selectedCell.beatIdx + 1}
          </span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {settings.keyboardKeys.map((key, i) => {
            const storageVal = noteStorageValue(key);
            return (
              <button
                key={`${key.type}-${key.value}-${i}`}
                onClick={() => onKeyPress(storageVal)}
                className="shrink-0 w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-lg bg-secondary hover:bg-accent text-foreground font-mono text-sm font-semibold transition-colors border border-border"
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
            onClick={() => onKeyPress(null)}
            className="shrink-0 w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-lg bg-secondary hover:bg-destructive/20 text-muted-foreground hover:text-destructive font-mono text-sm transition-colors border border-border"
            title="Clear note"
          >
            <Eraser size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
