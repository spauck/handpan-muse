/** biome-ignore-all lint/suspicious/noArrayIndexKey: because */

import {
  CircleMinus,
  CirclePlus,
  CornerDownLeft,
  PanelLeftOpen,
  PanelRightOpen,
  Trash2,
} from "lucide-react";
import type { Bar } from "@/lib/composer-state";
import { BeatCell } from "./BeatCell";

interface BarColumnProps {
  bar: Bar;
  barIdx: number;
  /** 1-based count number that the first beat of this bar represents. */
  startCount: number;
  notesPerCount: number;
  viewMode?: boolean;
  isFirstInRow: boolean;
  canDelete: boolean;
  isSelected: boolean;
  selectedBeatIdx: number | null;
  onSelectBar: () => void;
  onSelectBeat: (beatIdx: number) => void;
  onDeleteBar: () => void;
  onChangeBarLength: (delta: number) => void;
  onSetBreak: (breakBefore: boolean) => void;
  onAddBar: (where: "before" | "after") => void;
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
  isFirstInRow,
  canDelete,
  isSelected,
  selectedBeatIdx,
  onSelectBar,
  onSelectBeat,
  onDeleteBar,
  onChangeBarLength,
  onSetBreak,
  onAddBar,
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

      {/* Controls — visible on hover (desktop) or when bar is selected (mobile) */}
      {!viewMode && (
        <div
          className={`flex items-center justify-center gap-0.5 transition-opacity ${
            isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
          style={{ gridColumn: `span ${beatCount}` }}
        >
          <button
            type="button"
            onClick={() => onAddBar("before")}
            className="text-muted-foreground hover:text-foreground p-1"
            title="Add bar before"
          >
            <PanelRightOpen size={13} />
          </button>
          {barIdx > 0 && !isFirstInRow && (
            <button
              type="button"
              onClick={() => onSetBreak(true)}
              className="text-muted-foreground hover:text-foreground p-1"
              title="Insert row break before this bar"
            >
              <CornerDownLeft size={13} />
            </button>
          )}
          <button
            type="button"
            onClick={() => onChangeBarLength(-1)}
            className="text-muted-foreground hover:text-foreground p-1"
            title="Shorten bar"
            disabled={beatCount <= 1}
          >
            <CircleMinus size={13} />
          </button>
          <button
            type="button"
            onClick={() => onChangeBarLength(+1)}
            className="text-muted-foreground hover:text-foreground p-1"
            title="Lengthen bar"
          >
            <CirclePlus size={13} />
          </button>
          {canDelete && (
            <button
              type="button"
              onClick={onDeleteBar}
              className="text-muted-foreground hover:text-destructive p-1"
              title="Delete bar"
            >
              <Trash2 size={13} />
            </button>
          )}
          <button
            type="button"
            onClick={() => onAddBar("after")}
            className="text-muted-foreground hover:text-foreground p-1"
            title="Add bar after"
          >
            <PanelLeftOpen size={13} />
          </button>
        </div>
      )}
    </div>
  );
}
