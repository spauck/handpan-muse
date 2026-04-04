/** biome-ignore-all lint/suspicious/noArrayIndexKey: because */

import type { Row } from "@/lib/composer-state";
import { BeatCell } from "./BeatCell";

interface SelectedCell {
  rowIdx: number;
  beatIdx: number;
}

interface ComposerGridProps {
  rows: Row[];
  beatsPerBar: number;
  notesPerCount: number;
  viewMode?: boolean;
  selectedCell: SelectedCell | null;
  onSelectCell: (cell: SelectedCell | null) => void;
  onDeleteRow: (rowIdx: number) => void;
}

function getCountLabels(beatNumber: number, notesPerCount: number): string[] {
  const num = String(beatNumber);
  switch (notesPerCount) {
    case 1:
      return [num];
    case 2:
      return [num, "."];
    case 3:
      return [num, "&", "."];
    case 4:
      return [num, ".", "&", "."];
    default:
      return [num, ...Array.from({ length: notesPerCount - 1 }, () => ".")];
  }
}

export function ComposerGrid({
  rows,
  beatsPerBar,
  notesPerCount,
  viewMode,
  selectedCell,
  onSelectCell,
  onDeleteRow,
}: ComposerGridProps) {
  const isSelected = (rowIdx: number, beatIdx: number) =>
    !viewMode &&
    selectedCell?.rowIdx === rowIdx &&
    selectedCell?.beatIdx === beatIdx;

  const handleSelect = (rowIdx: number, beatIdx: number) => {
    if (viewMode) return;
    if (isSelected(rowIdx, beatIdx)) {
      onSelectCell(null);
    } else {
      onSelectCell({ rowIdx, beatIdx });
    }
  };

  return (
    <div className="space-y-3">
      {rows.map((row, rowIdx) => (
        <div
          key={rowIdx}
          className="bg-card rounded-lg p-3 sm:p-4 border border-border group relative"
        >
          {!viewMode && (
            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
              {rows.length > 1 && (
                <button
                  type="button"
                  onClick={() => onDeleteRow(rowIdx)}
                  className="text-muted-foreground hover:text-destructive text-xs px-1.5 py-0.5 rounded hover:bg-secondary"
                  title="Delete row"
                >
                  ✕
                </button>
              )}
            </div>
          )}
          {!viewMode && (
            <div className="text-[10px] text-muted-foreground mb-1 font-mono">
              Row {rowIdx + 1}
            </div>
          )}

          {/* Count labels */}
          <div
            className="flex items-center mb-0.5"
            style={{
              gap: 0,
              // Use CSS grid to match the beat row layout
            }}
          >
            <div
              className="grid w-full"
              style={{
                gridTemplateColumns: row
                  .map((_b, i) => {
                    const isBarEnd =
                      (i + 1) % beatsPerBar === 0 && i < row.length - 1;
                    return isBarEnd ? "1fr auto" : "1fr";
                  })
                  .join(" "),
              }}
            >
              {row.map((_beat, beatIdx) => {
                const isBarEnd =
                  (beatIdx + 1) % beatsPerBar === 0 && beatIdx < row.length - 1;
                const countGroup = Math.floor(beatIdx / notesPerCount);
                const subIdx = beatIdx % notesPerCount;
                const labels = getCountLabels(countGroup + 1, notesPerCount);
                const label = labels[subIdx] || ".";

                return (
                  <div key={beatIdx} className="contents">
                    <div className="flex items-center justify-center">
                      <span
                        className={`text-[9px] font-mono ${subIdx === 0 ? "text-muted-foreground font-semibold" : "text-muted-foreground/50"}`}
                      >
                        {label}
                      </span>
                    </div>
                    {isBarEnd && <div className="w-px h-3 mx-0.5 opacity-0" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Single unified row - CSS Grid for equal scaling */}
          <div
            className="grid w-full"
            style={{
              gridTemplateColumns: row
                .map((_b, i) => {
                  const isBarEnd =
                    (i + 1) % beatsPerBar === 0 && i < row.length - 1;
                  return isBarEnd ? "1fr auto" : "1fr";
                })
                .join(" "),
            }}
          >
            {row.map((beat, beatIdx) => {
              const isBarEnd =
                (beatIdx + 1) % beatsPerBar === 0 && beatIdx < row.length - 1;
              return (
                <div key={beatIdx} className="contents">
                  <BeatCell
                    beat={beat}
                    isSelected={isSelected(rowIdx, beatIdx)}
                    onSelect={() => handleSelect(rowIdx, beatIdx)}
                  />
                  {isBarEnd && (
                    <div className="w-px bg-bar-divider mx-0.5 self-stretch" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
