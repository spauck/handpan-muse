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
  selectedBeatIdx: number | null;
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
  selectedBeatIdx,
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
      className="grid group"
      style={{ gridTemplateColumns, gridColumn: `span ${beatCount}` }}
    >
      {/* Count labels */}
      {bar.beats.map((_, beatIdx) => {
        const absoluteBeat = (startCount - 1) * notesPerCount + beatIdx;
        const countGroup = Math.floor(absoluteBeat / notesPerCount);
        const subIdx = absoluteBeat % notesPerCount;
        const labels = getCountLabels(countGroup + 1, notesPerCount);
        const label = labels[subIdx] || ".";
        return (
          <div
            key={`l-${barIdx}-${beatIdx}`}
            className="flex items-center justify-center mb-0.5"
          >
            <span
              className={`text-[12px] font-mono ${
                subIdx === 0
                  ? "text-muted-foreground font-semibold"
                  : "text-muted-foreground/50"
              }`}
            >
              {label}
            </span>
          </div>
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

      {/* Controls */}
      {!viewMode && (
        <div
          className="flex items-center justify-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ gridColumn: `span ${beatCount}` }}
        >
          <button
            type="button"
            onClick={() => onAddBar("before")}
            className="text-muted-foreground hover:text-foreground p-0.5"
            title="Add bar before"
          >
            <PanelRightOpen size={11} />
          </button>
          {barIdx > 0 && !isFirstInRow && (
            <button
              type="button"
              onClick={() => onSetBreak(true)}
              className="text-muted-foreground hover:text-foreground p-0.5"
              title="Insert row break before this bar"
            >
              <CornerDownLeft size={11} />
            </button>
          )}
          <button
            type="button"
            onClick={() => onChangeBarLength(-1)}
            className="text-muted-foreground hover:text-foreground p-0.5"
            title="Shorten bar"
            disabled={beatCount <= 1}
          >
            <CircleMinus size={11} />
          </button>
          <button
            type="button"
            onClick={() => onChangeBarLength(+1)}
            className="text-muted-foreground hover:text-foreground p-0.5"
            title="Lengthen bar"
          >
            <CirclePlus size={11} />
          </button>
          {canDelete && (
            <button
              type="button"
              onClick={onDeleteBar}
              className="text-muted-foreground hover:text-destructive p-0.5"
              title="Delete bar"
            >
              <Trash2 size={11} />
            </button>
          )}
          <button
            type="button"
            onClick={() => onAddBar("after")}
            className="text-muted-foreground hover:text-foreground p-0.5"
            title="Add bar after"
          >
            <PanelLeftOpen size={11} />
          </button>
        </div>
      )}
    </div>
  );
}
