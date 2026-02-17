import { BeatCell } from "./BeatCell";
import type { Row } from "@/lib/composer-state";

interface SelectedCell {
  rowIdx: number;
  beatIdx: number;
  hand: "right" | "left";
}

interface ComposerGridProps {
  rows: Row[];
  beatsPerBar: number;
  barsPerRow: number;
  selectedCell: SelectedCell | null;
  onSelectCell: (cell: SelectedCell | null) => void;
  onDeleteRow: (rowIdx: number) => void;
}

export function ComposerGrid({ rows, beatsPerBar, barsPerRow, selectedCell, onSelectCell, onDeleteRow }: ComposerGridProps) {
  const isSelected = (rowIdx: number, beatIdx: number, hand: "right" | "left") =>
    selectedCell?.rowIdx === rowIdx && selectedCell?.beatIdx === beatIdx && selectedCell?.hand === hand;

  const handleSelect = (rowIdx: number, beatIdx: number, hand: "right" | "left") => {
    if (isSelected(rowIdx, beatIdx, hand)) {
      onSelectCell(null);
    } else {
      onSelectCell({ rowIdx, beatIdx, hand });
    }
  };

  return (
    <div className="space-y-3">
      {rows.map((row, rowIdx) => (
        <div key={rowIdx} className="bg-card rounded-lg p-3 sm:p-4 border border-border group relative">
          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {rows.length > 1 && (
              <button
                onClick={() => onDeleteRow(rowIdx)}
                className="text-muted-foreground hover:text-destructive text-xs px-1.5 py-0.5 rounded hover:bg-secondary"
                title="Delete row"
              >
                ✕
              </button>
            )}
          </div>
          <div className="text-[10px] text-muted-foreground mb-1.5 font-mono">Row {rowIdx + 1}</div>
          {/* Right hand row */}
          <div className="flex items-center gap-0.5 mb-0.5">
            <span className="text-[10px] text-hand-right font-mono w-4 shrink-0">R</span>
            <div className="flex items-center flex-wrap gap-0.5">
              {row.map(([right], beatIdx) => (
                <div key={beatIdx} className="flex items-center">
                  <BeatCell
                    value={right}
                    hand="right"
                    isSelected={isSelected(rowIdx, beatIdx, "right")}
                    onSelect={() => handleSelect(rowIdx, beatIdx, "right")}
                  />
                  {(beatIdx + 1) % beatsPerBar === 0 && beatIdx < row.length - 1 && (
                    <div className="w-px h-6 bg-bar-divider mx-1" />
                  )}
                </div>
              ))}
            </div>
          </div>
          {/* Left hand row */}
          <div className="flex items-center gap-0.5">
            <span className="text-[10px] text-hand-left font-mono w-4 shrink-0">L</span>
            <div className="flex items-center flex-wrap gap-0.5">
              {row.map(([, left], beatIdx) => (
                <div key={beatIdx} className="flex items-center">
                  <BeatCell
                    value={left}
                    hand="left"
                    isSelected={isSelected(rowIdx, beatIdx, "left")}
                    onSelect={() => handleSelect(rowIdx, beatIdx, "left")}
                  />
                  {(beatIdx + 1) % beatsPerBar === 0 && beatIdx < row.length - 1 && (
                    <div className="w-px h-6 bg-bar-divider mx-1" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
