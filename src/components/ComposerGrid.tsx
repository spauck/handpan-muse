/** biome-ignore-all lint/suspicious/noArrayIndexKey: because */

import { ChevronDown, ChevronUp } from "lucide-react";
import { Fragment } from "react";
import type { Bar } from "@/lib/composer-state";
import { groupIntoRows } from "@/lib/composer-state";
import { BarColumn } from "./BarColumn";

interface SelectedCell {
  barIdx: number;
  beatIdx: number;
}

interface ComposerGridProps {
  bars: Bar[];
  notesPerCount: number;
  viewMode?: boolean;
  selectedCell: SelectedCell | null;
  selectedBarIdx: number | null;
  onSelectCell: (cell: SelectedCell | null) => void;
  onSelectBar: (barIdx: number | null) => void;
  onDeleteBar: (barIdx: number) => void;
  onChangeBarLength: (barIdx: number, delta: number) => void;
  onSetBreak: (barIdx: number, breakBefore: boolean) => void;
  onAddBar: (
    position: number,
    currentBar: Bar,
    where: "before" | "after",
  ) => void;
  onMoveRow: (rowIdx: number, direction: -1 | 1) => void;
}

export function ComposerGrid({
  bars,
  notesPerCount,
  viewMode,
  selectedCell,
  selectedBarIdx,
  onSelectCell,
  onSelectBar,
  onDeleteBar,
  onChangeBarLength,
  onSetBreak,
  onAddBar,
  onMoveRow,
}: ComposerGridProps) {
  const handleSelect = (barIdx: number, beatIdx: number) => {
    if (viewMode) return;
    if (selectedCell?.barIdx === barIdx && selectedCell?.beatIdx === beatIdx) {
      onSelectCell(null);
    } else {
      onSelectCell({ barIdx, beatIdx });
    }
  };

  const rows = groupIntoRows(bars);

  return (
    <div className="space-y-3">
      {rows.map((row, rowIdx) => {
        const rowBars = row.bars.map((bar, i) => ({
          bar,
          barIdx: row.start + i,
        }));
        const totalBeats = rowBars.reduce(
          (s, { bar }) => s + bar.beats.length,
          0,
        );

        // Compute the starting count number for each bar in the row.
        // Counts reset to 1 at the start of every row.
        let runningCount = 1;
        const startCounts = rowBars.map(({ bar }) => {
          const start = runningCount;
          // Number of count groups consumed by this bar.
          runningCount += Math.ceil(bar.beats.length / notesPerCount);
          return start;
        });

        // Top-level grid: each bar contributes `bar.beats.length` columns,
        // plus an `auto` column for dividers between bars.
        const gridTemplate = rowBars
          .flatMap(({ bar }, bi) => {
            const cols = Array.from({ length: bar.beats.length }, () => "1fr");
            if (bi < rowBars.length - 1) cols.push("auto");
            return cols;
          })
          .join(" ");

        return (
          <div
            key={rowIdx}
            className="bg-card rounded-lg px-3 pt-2 pb-1 sm:px-4 border border-border relative"
          >
            {!viewMode && (
              <div className="text-[10px] text-muted-foreground mb-1 font-mono flex items-center gap-2 flex-wrap">
                <span>Row {rowIdx + 1}</span>
                {rowIdx > 0 && (
                  <button
                    type="button"
                    onClick={() => onMoveRow(rowIdx, -1)}
                    className="text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5"
                    title="Move row up"
                  >
                    <ChevronUp size={12} /> up
                  </button>
                )}
                {rowIdx < rows.length - 1 && (
                  <button
                    type="button"
                    onClick={() => onMoveRow(rowIdx, 1)}
                    className="text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5"
                    title="Move row down"
                  >
                    <ChevronDown size={12} /> down
                  </button>
                )}
                {rowIdx > 0 && (
                  <button
                    type="button"
                    onClick={() => onSetBreak(row.start, false)}
                    className="text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5"
                    title="Join with previous row"
                  >
                    <ChevronUp size={12} /> join up
                  </button>
                )}
              </div>
            )}

            <div
              className="grid w-full items-end"
              style={{ gridTemplateColumns: gridTemplate }}
            >
              {rowBars.map(({ bar, barIdx }, bi) => (
                <Fragment key={`bar-wrap-${barIdx}`}>
                  <BarColumn
                    bar={bar}
                    barIdx={barIdx}
                    startCount={startCounts[bi]}
                    notesPerCount={notesPerCount}
                    viewMode={viewMode}
                    isFirstInRow={bi === 0}
                    canDelete={bars.length > 1}
                    isSelected={
                      selectedBarIdx === barIdx ||
                      selectedCell?.barIdx === barIdx
                    }
                    selectedBeatIdx={
                      selectedCell?.barIdx === barIdx
                        ? selectedCell.beatIdx
                        : null
                    }
                    onSelectBar={() =>
                      onSelectBar(selectedBarIdx === barIdx ? null : barIdx)
                    }
                    onSelectBeat={(beatIdx) => handleSelect(barIdx, beatIdx)}
                    onDeleteBar={() => onDeleteBar(barIdx)}
                    onChangeBarLength={(delta) =>
                      onChangeBarLength(barIdx, delta)
                    }
                    onSetBreak={(breakBefore) =>
                      onSetBreak(barIdx, breakBefore)
                    }
                    onAddBar={(where) => onAddBar(barIdx, bar, where)}
                  />
                  {bi < rowBars.length - 1 && (
                    <div className="w-px bg-bar-divider mx-0.5 self-stretch" />
                  )}
                </Fragment>
              ))}
            </div>

            <span className="hidden">{totalBeats}</span>
          </div>
        );
      })}
    </div>
  );
}
