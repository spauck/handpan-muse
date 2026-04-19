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

interface BarControlsProps {
  bar: Bar;
  barIdx: number;
  viewMode?: boolean;
  isFirstInRow: boolean;
  canDelete: boolean;
  isSelected: boolean;
  onDeleteBar: () => void;
  onChangeBarLength: (delta: number) => void;
  onSetBreak: (breakBefore: boolean) => void;
  onAddBar: (where: "before" | "after") => void;
}

export function BarControls({
  bar,
  barIdx,
  isFirstInRow,
  canDelete,
  isSelected,
  onDeleteBar,
  onChangeBarLength,
  onSetBreak,
  onAddBar,
}: BarControlsProps) {
  const beatCount = bar.beats.length;

  return (
    <div
      className={`grid group rounded-md transition-colors ${
        isSelected ? "bg-accent/30 ring-1 ring-primary/40" : ""
      }`}
    >
      <div
        className={`flex items-center justify-center gap-0.5 transition-opacity ${
          isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
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
    </div>
  );
}
