/** biome-ignore-all lint/suspicious/noArrayIndexKey: because */

import type { Bar } from "@/lib/composer-state";
import { BeatCell } from "./BeatCell";

interface BarColumnProps {
  bar: Bar;
  barIdx: number;
  /** 1-based count number that the first beat of this bar represents. */
  startCount: number;
  notesPerCount: number;
  viewMode?: boolean;
  isSelected: boolean;
  selectedBeatIdx: number | null;
  onSelectBar: () => void;
  onSelectBeat: (beatIdx: number) => void;
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

export function BarColumn({
  bar,
  barIdx,
  startCount,
  notesPerCount,
  viewMode,
  isSelected,
  selectedBeatIdx,
  onSelectBar,
  onSelectBeat,
}: BarColumnProps) {
  const beatCount = bar.beats.length;
  const gridTemplateColumns = `repeat(${beatCount}, 1fr)`;

  return (
    <div
      className={`grid group rounded-md transition-colors ${
        !viewMode && isSelected ? "bg-accent/30 ring-1 ring-primary/40" : ""
      }`}
      style={{ gridTemplateColumns, gridColumn: `span ${beatCount}` }}
    >
      {/* Count labels — tap to select the bar */}
      {bar.beats.map((_, beatIdx) => {
        const absoluteBeat = (startCount - 1) * notesPerCount + beatIdx;
        const countGroup = Math.floor(absoluteBeat / notesPerCount);
        const subIdx = absoluteBeat % notesPerCount;
        const labels = getCountLabels(countGroup + 1, notesPerCount);
        const label = labels[subIdx] || ".";
        const labelEl = (
          <span
            className={`text-[12px] font-mono ${
              subIdx === 0
                ? "text-muted-foreground font-semibold"
                : "text-muted-foreground/50"
            }`}
          >
            {label}
          </span>
        );
        if (viewMode) {
          return (
            <div
              key={`l-${barIdx}-${beatIdx}`}
              className="flex items-center justify-center mb-0.5"
            >
              {labelEl}
            </div>
          );
        }
        return (
          <button
            key={`l-${barIdx}-${beatIdx}`}
            type="button"
            onClick={onSelectBar}
            className="flex items-center justify-center mb-0.5 hover:bg-accent/40 rounded-sm cursor-pointer"
            title="Select bar"
          >
            {labelEl}
          </button>
        );
      })}

      {/* Beats */}
      {bar.beats.map((beat, beatIdx) => (
        <BeatCell
          key={`b-${barIdx}-${beatIdx}`}
          beat={beat}
          isSelected={!viewMode && selectedBeatIdx === beatIdx}
          onSelect={() => onSelectBeat(beatIdx)}
        />
      ))}
    </div>
  );
}
