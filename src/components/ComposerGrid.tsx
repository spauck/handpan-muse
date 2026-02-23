import { BeatCell } from "./BeatCell";
import { IconNote } from "./IconNote";
import { PanScriptGlyph } from "./PanScriptGlyph";
import { noteDisplayValue, useSettings } from "@/lib/settings";
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
  notesPerCount: number;
  viewMode?: boolean;
  collapsed?: boolean;
  selectedCell: SelectedCell | null;
  onSelectCell: (cell: SelectedCell | null) => void;
  onDeleteRow: (rowIdx: number) => void;
}

/** Generate count labels for a single count group */
function getCountLabels(beatNumber: number, notesPerCount: number): string[] {
  const num = String(beatNumber);
  switch (notesPerCount) {
    case 1: return [num];
    case 2: return [num, "."];
    case 3: return [num, "&", "."];
    case 4: return [num, ".", "&", "."];
    default: return [num, ...Array.from({ length: notesPerCount - 1 }, () => ".")];
  }
}

export function ComposerGrid({ rows, beatsPerBar, barsPerRow, notesPerCount, viewMode, collapsed, selectedCell, onSelectCell, onDeleteRow }: ComposerGridProps) {
  const isSelected = (rowIdx: number, beatIdx: number, hand: "right" | "left") =>
    !viewMode && selectedCell?.rowIdx === rowIdx && selectedCell?.beatIdx === beatIdx && selectedCell?.hand === hand;

  const handleSelect = (rowIdx: number, beatIdx: number, hand: "right" | "left") => {
    if (viewMode) return;
    if (isSelected(rowIdx, beatIdx, hand)) {
      onSelectCell(null);
    } else {
      onSelectCell({ rowIdx, beatIdx, hand });
    }
  };

  return (
    <div className="space-y-3">
      {rows.map((row, rowIdx) => (
        <div key={rowIdx} className={`bg-card rounded-lg p-3 sm:p-4 border border-border group relative ${viewMode ? "" : ""}`}>
          {!viewMode && (
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
          )}
          {!viewMode && <div className="text-[10px] text-muted-foreground mb-1 font-mono">Row {rowIdx + 1}</div>}

          {/* Count labels — continuous across the row, not resetting per bar */}
          <div className="flex items-center gap-0.5 mb-0.5">
            <span className="w-4 shrink-0" />
            <div className="flex items-center gap-0.5">
              {row.map((_beat, beatIdx) => {
                const isBarEnd = (beatIdx + 1) % beatsPerBar === 0 && beatIdx < row.length - 1;
                // Use absolute position in the row for counting
                const countGroup = Math.floor(beatIdx / notesPerCount);
                const subIdx = beatIdx % notesPerCount;
                const labels = getCountLabels(countGroup + 1, notesPerCount);
                const label = labels[subIdx] || ".";

                return (
                  <div key={beatIdx} className="flex items-center">
                    <div className="w-7 sm:w-8 flex items-center justify-center">
                      <span className={`text-[9px] font-mono ${subIdx === 0 ? "text-muted-foreground font-semibold" : "text-muted-foreground/50"}`}>
                        {label}
                      </span>
                    </div>
                    {isBarEnd && (
                      <div className="w-px h-3 mx-1 opacity-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {collapsed ? (
            /* Collapsed: single row with R+L stacked in each cell */
            <div className="flex items-center gap-0.5">
              <span className="w-4 shrink-0" />
              <div className="flex items-center flex-wrap gap-0.5">
                {row.map(([right, left], beatIdx) => {
                  const isBarEnd = (beatIdx + 1) % beatsPerBar === 0 && beatIdx < row.length - 1;
                  return (
                    <div key={beatIdx} className="flex items-center">
                      <CollapsedCell right={right} left={left} />
                      {isBarEnd && <div className="w-px h-6 bg-bar-divider mx-1" />}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <>
              {/* Right hand row */}
              <div className="flex items-center gap-0.5 mb-0.5">
                <span className="text-[10px] text-hand-right font-mono w-4 shrink-0">R</span>
                <div className="flex items-center flex-wrap gap-0.5">
                  {row.map(([right], beatIdx) => (
                    <div key={beatIdx} className="flex items-center">
                      <BeatCell
                        notes={right}
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
                        notes={left}
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
            </>
          )}
        </div>
      ))}
    </div>
  );
}

/** Collapsed cell: stacks right-hand notes on top, left-hand below */
function CollapsedCell({ right, left }: { right: string[]; left: string[] }) {
  const { settings } = useSettings();
  const rightEmpty = right.length === 0;
  const leftEmpty = left.length === 0;
  const bothEmpty = rightEmpty && leftEmpty;

  const isPanScriptRight = right.some(n => n.startsWith("p"));
  const isPanScriptLeft = left.some(n => n.startsWith("p"));

  const renderNotes = (notes: string[], hand: "right" | "left") => {
    const isPanScript = notes.some(n => n.startsWith("p"));
    if (isPanScript) {
      const activePositions = notes
        .filter(n => n.startsWith("p"))
        .map(n => parseInt(n.slice(1), 10))
        .filter(n => !isNaN(n));
      const hslColor = hand === "right" ? settings.rightHandColor : settings.leftHandColor;
      return (
        <PanScriptGlyph
          fields={settings.panscriptFields}
          active={activePositions}
          size={18}
          color={`hsl(${hslColor})`}
        />
      );
    }
    const colorClass = hand === "right" ? "text-hand-right" : "text-hand-left";
    return (
      <div className={`flex flex-col items-center gap-px ${colorClass} font-semibold`}>
        {notes.map((v, i) => {
          const parsed = noteDisplayValue(v);
          if (parsed.type === "icon") {
            return <IconNote key={i} name={parsed.value} size={10} />;
          }
          return <span key={i} className="leading-none text-[10px]">{parsed.value}</span>;
        })}
      </div>
    );
  };

  return (
    <div className="w-7 h-9 sm:w-8 sm:h-10 flex flex-col items-center justify-center rounded select-none">
      {bothEmpty ? (
        <span className="text-sm text-beat-empty">·</span>
      ) : (
        <>
          <div className="flex-1 flex items-end justify-center min-h-0">
            {!rightEmpty && renderNotes(right, "right")}
          </div>
          <div className="flex-1 flex items-start justify-center min-h-0">
            {!leftEmpty && renderNotes(left, "left")}
          </div>
        </>
      )}
    </div>
  );
}
