/** biome-ignore-all lint/suspicious/noArrayIndexKey: because */

import {
  ChevronUp,
  CircleMinus,
  CirclePlus,
  CornerDownLeft,
  PanelLeftOpen,
  PanelRightOpen,
  Trash2,
} from "lucide-react";
import type { Bar } from "@/lib/composer-state";
import { groupIntoRows } from "@/lib/composer-state";
import { BeatCell } from "./BeatCell";

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
  bars,
  notesPerCount,
  viewMode,
  selectedCell,
  onSelectCell,
  onDeleteBar,
  onChangeBarLength,
  onSetBreak,
  onAddBar,
}: ComposerGridProps) {
  const isSelected = (barIdx: number, beatIdx: number) =>
    !viewMode &&
    selectedCell?.barIdx === barIdx &&
    selectedCell?.beatIdx === beatIdx;

  const handleSelect = (barIdx: number, beatIdx: number) => {
    if (viewMode) return;
    if (isSelected(barIdx, beatIdx)) {
      onSelectCell(null);
    } else {
      onSelectCell({ barIdx, beatIdx });
    }
  };

  const rows = groupIntoRows(bars);

  return (
    <div className="space-y-3">
      {rows.map((row, rowIdx) => {
        // Build flat list of (bar, barIdx) for this row
        const rowBars = row.bars.map((bar, i) => ({
          bar,
          barIdx: row.start + i,
        }));
        const totalBeats = rowBars.reduce(
          (s, { bar }) => s + bar.beats.length,
          0,
        );

        // Grid columns: each beat = 1fr; each bar boundary (between bars in
        // the same row) = auto for the divider.
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
            className="bg-card rounded-lg px-3 pt-2 pb-1 sm:px-4 border border-border group relative"
          >
            {!viewMode && (
              <div className="text-[10px] text-muted-foreground mb-1 font-mono flex items-center gap-2">
                <span>Row {rowIdx + 1}</span>
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

            {/* Count labels */}
            <div
              className="grid w-full mb-0.5"
              style={{ gridTemplateColumns: gridTemplate }}
            >
              {rowBars.map(({ bar, barIdx }, bi) => {
                const cells: React.ReactNode[] = [];
                for (let beatIdx = 0; beatIdx < bar.beats.length; beatIdx++) {
                  const countGroup = Math.floor(beatIdx / notesPerCount);
                  const subIdx = beatIdx % notesPerCount;
                  const labels = getCountLabels(countGroup + 1, notesPerCount);
                  const label = labels[subIdx] || ".";
                  cells.push(
                    <div
                      key={`l-${barIdx}-${beatIdx}`}
                      className="flex items-center justify-center"
                    >
                      <span
                        className={`text-[12px] font-mono ${subIdx === 0 ? "text-muted-foreground font-semibold" : "text-muted-foreground/50"}`}
                      >
                        {label}
                      </span>
                    </div>,
                  );
                }
                if (bi < rowBars.length - 1) {
                  cells.push(
                    <div
                      key={`l-div-${barIdx}`}
                      className="w-px h-3 mx-0.5 opacity-0"
                    />,
                  );
                }
                return cells;
              })}
            </div>

            {/* Beats */}
            <div
              className="grid w-full"
              style={{ gridTemplateColumns: gridTemplate }}
            >
              {rowBars.map(({ bar, barIdx }, bi) => {
                const cells: React.ReactNode[] = [];
                bar.beats.forEach((beat, beatIdx) => {
                  cells.push(
                    <BeatCell
                      key={`b-${barIdx}-${beatIdx}`}
                      beat={beat}
                      isSelected={isSelected(barIdx, beatIdx)}
                      onSelect={() => handleSelect(barIdx, beatIdx)}
                    />,
                  );
                });
                if (bi < rowBars.length - 1) {
                  cells.push(
                    <div
                      key={`div-${barIdx}`}
                      className="w-px bg-bar-divider mx-0.5 self-stretch"
                    />,
                  );
                }
                return cells;
              })}
            </div>

            {/* Per-bar controls */}
            {!viewMode && (
              <div
                className="grid w-full"
                style={{ gridTemplateColumns: gridTemplate }}
              >
                {rowBars.map(({ bar, barIdx }, bi) => {
                  const cells: React.ReactNode[] = [];
                  cells.push(
                    <div
                      key={`ctrl-${barIdx}`}
                      className="flex items-center justify-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ gridColumn: `span ${bar.beats.length}` }}
                    >
                      <button
                        type="button"
                        onClick={() => onAddBar(barIdx, bar, "before")}
                        className="text-muted-foreground hover:text-foreground p-0.5"
                        title="Add bar before"
                      >
                        <PanelRightOpen size={11} />
                      </button>
                      {barIdx > 0 && !bar.breakBefore && (
                        <button
                          type="button"
                          onClick={() => onSetBreak(barIdx, true)}
                          className="text-muted-foreground hover:text-foreground p-0.5"
                          title="Insert row break before this bar"
                        >
                          <CornerDownLeft size={11} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onChangeBarLength(barIdx, -1)}
                        className="text-muted-foreground hover:text-foreground p-0.5"
                        title="Shorten bar"
                        disabled={bar.beats.length <= 1}
                      >
                        <CircleMinus size={11} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onChangeBarLength(barIdx, +1)}
                        className="text-muted-foreground hover:text-foreground p-0.5"
                        title="Lengthen bar"
                      >
                        <CirclePlus size={11} />
                      </button>
                      {bars.length > 1 && (
                        <button
                          type="button"
                          onClick={() => onDeleteBar(barIdx)}
                          className="text-muted-foreground hover:text-destructive p-0.5"
                          title="Delete bar"
                        >
                          <Trash2 size={11} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onAddBar(barIdx, bar, "after")}
                        className="text-muted-foreground hover:text-foreground p-0.5"
                        title="Add bar after"
                      >
                        <PanelLeftOpen size={11} />
                      </button>
                    </div>,
                  );
                  if (bi < rowBars.length - 1) {
                    cells.push(
                      <div
                        key={`ctrl-div-${barIdx}`}
                        className="w-px opacity-0"
                      />,
                    );
                  }
                  return cells;
                })}
              </div>
            )}

            {/* spacer to keep totalBeats reference (avoid unused warning) */}
            <span className="hidden">{totalBeats}</span>
          </div>
        );
      })}
    </div>
  );
}
