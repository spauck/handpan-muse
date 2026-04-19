/** biome-ignore-all lint/suspicious/noArrayIndexKey: because */

import { ChevronDown, ChevronUp, Copy, Trash2 } from "lucide-react";
import { Fragment, useEffect, useRef, useState } from "react";
import type { Bar } from "@/lib/composer-state";
import { groupIntoRows } from "@/lib/composer-state";
import { BarColumn } from "./BarColumn";
import { BarControlStrip } from "./BarControlStrip";

interface SelectedCell {
  barIdx: number;
  beatIdx: number;
}

interface ComposerGridProps {
  bars: Bar[];
  notesPerCount: number;
  viewMode?: boolean;
  selectedCell: SelectedCell | null;
  onSelectCell: (cell: SelectedCell | null) => void;
  onDeleteBar: (barIdx: number) => void;
  onChangeBarLength: (barIdx: number, delta: number) => void;
  onSetBreak: (barIdx: number, breakBefore: boolean) => void;
  onAddBar: (
    position: number,
    currentBar: Bar,
    where: "before" | "after",
  ) => void;
  onMoveRow: (rowIdx: number, direction: -1 | 1) => void;
  onDuplicateRow: (rowIdx: number) => void;
  onDeleteRow: (rowIdx: number) => void;
}

export function ComposerGrid({
  bars,
  notesPerCount,
  viewMode,
  selectedCell,
  onSelectCell,
  onDeleteBar,
  onChangeBarLength,
  onSetBreak,
  onAddBar,
  onMoveRow,
  onDuplicateRow,
  onDeleteRow,
}: ComposerGridProps) {
  // Only one bar's controls can be open at a time across the whole grid.
  const [openBarIdx, setOpenBarIdx] = useState<number | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Dismiss open controls when tapping anywhere outside the grid.
  useEffect(() => {
    if (openBarIdx === null) return;
    const handler = (e: MouseEvent) => {
      if (
        gridRef.current &&
        !gridRef.current.contains(e.target as Node)
      ) {
        setOpenBarIdx(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openBarIdx]);

  // Close controls if the open bar gets removed.
  useEffect(() => {
    if (openBarIdx !== null && openBarIdx >= bars.length) {
      setOpenBarIdx(null);
    }
  }, [bars.length, openBarIdx]);

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
    <div className="space-y-3" ref={gridRef}>
      {rows.map((row, rowIdx) => {
        const rowBars = row.bars.map((bar, i) => ({
          bar,
          barIdx: row.start + i,
        }));
        const totalBeats = rowBars.reduce(
          (s, { bar }) => s + bar.beats.length,
          0,
        );

        // Compute starting count for each bar; counts reset per row.
        let runningCount = 1;
        const startCounts = rowBars.map(({ bar }) => {
          const start = runningCount;
          runningCount += Math.ceil(bar.beats.length / notesPerCount);
          return start;
        });

        // Top-level grid: each bar contributes `bar.beats.length` 1fr columns,
        // plus an `auto` divider column between bars.
        const gridTemplate = rowBars
          .flatMap(({ bar }, bi) => {
            const cols = Array.from(
              { length: bar.beats.length },
              () => "minmax(0, 1fr)",
            );
            if (bi < rowBars.length - 1) cols.push("auto");
            return cols;
          })
          .join(" ");

        return (
          <div
            key={rowIdx}
            className="bg-card rounded-lg px-3 pt-2 pb-2 sm:px-4 border border-border relative"
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
                <button
                  type="button"
                  onClick={() => onDuplicateRow(rowIdx)}
                  className="text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5"
                  title="Duplicate row below"
                >
                  <Copy size={11} /> duplicate
                </button>
                {bars.length > row.bars.length && (
                  <button
                    type="button"
                    onClick={() => onDeleteRow(rowIdx)}
                    className="text-muted-foreground hover:text-destructive inline-flex items-center gap-0.5"
                    title="Delete row"
                  >
                    <Trash2 size={11} /> delete
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
                    isHighlighted={
                      openBarIdx === barIdx ||
                      selectedCell?.barIdx === barIdx
                    }
                    selectedBeatIdx={
                      selectedCell?.barIdx === barIdx
                        ? selectedCell.beatIdx
                        : null
                    }
                    onSelectBeat={(beatIdx) => handleSelect(barIdx, beatIdx)}
                  />
                  {bi < rowBars.length - 1 && (
                    <div className="w-px bg-bar-divider mx-0.5 self-stretch" />
                  )}
                </Fragment>
              ))}

              {/* Bar control strips — second grid row, aligned under each bar.
                  Adjacent strips share remaining space; an open strip claims
                  intrinsic width via the toolbar's natural size. */}
              {!viewMode &&
                rowBars.map(({ bar, barIdx }, bi) => (
                  <Fragment key={`strip-wrap-${barIdx}`}>
                    <div
                      style={{ gridColumn: `span ${bar.beats.length}` }}
                      className="min-w-0"
                    >
                      <BarControlStrip
                        isOpen={openBarIdx === barIdx}
                        isFirstInRow={bi === 0}
                        isFirstBarOverall={barIdx === 0}
                        canDelete={bars.length > 1}
                        canShorten={bar.beats.length > 1}
                        onToggle={() =>
                          setOpenBarIdx(openBarIdx === barIdx ? null : barIdx)
                        }
                        onAddBefore={() => onAddBar(barIdx, bar, "before")}
                        onAddAfter={() => onAddBar(barIdx, bar, "after")}
                        onShorten={() => onChangeBarLength(barIdx, -1)}
                        onLengthen={() => onChangeBarLength(barIdx, +1)}
                        onSetBreak={() => onSetBreak(barIdx, true)}
                        onDelete={() => onDeleteBar(barIdx)}
                      />
                    </div>
                    {bi < rowBars.length - 1 && (
                      <div aria-hidden className="w-px mx-0.5" />
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
