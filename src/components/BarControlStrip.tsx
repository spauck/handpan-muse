import {
  CircleMinus,
  CirclePlus,
  CornerDownLeft,
  PanelLeftOpen,
  PanelRightOpen,
  Trash2,
} from "lucide-react";

interface BarControlStripProps {
  isOpen: boolean;
  isFirstInRow: boolean;
  isFirstBarOverall: boolean;
  canDelete: boolean;
  canShorten: boolean;
  onToggle: () => void;
  onAddBefore: () => void;
  onAddAfter: () => void;
  onShorten: () => void;
  onLengthen: () => void;
  onSetBreak: () => void;
  onDelete: () => void;
}

export function BarControlStrip({
  isOpen,
  isFirstInRow,
  isFirstBarOverall,
  canDelete,
  canShorten,
  onToggle,
  onAddBefore,
  onAddAfter,
  onShorten,
  onLengthen,
  onSetBreak,
  onDelete,
}: BarControlStripProps) {
  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={onToggle}
        title="Bar controls"
        aria-label="Open bar controls"
        // We set 'flex' on this button to remove inherited line height which pads out the height unexpectedly.
        className="flex transition-colors cursor-pointer w-full min-w-0 px-2 py-0 my-2"
      >
        <div className="h-2 bg-accent hover:bg-primary/50 w-full rounded-sm" />
      </button>
    );
  }

  const btn =
    "text-muted-foreground hover:text-foreground p-1 rounded-sm hover:bg-accent/60 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed";

  const iconSize = 16;
  return (
    <div
      className="mt-2 -mb-10 flex flex-row items-center justify-center gap-0.5 rounded-sm bg-accent ring-2 ring-accent px-1 py-0.5"
      role="toolbar"
      aria-label="Bar controls"
    >
      <button
        type="button"
        onClick={onAddBefore}
        className={btn}
        title="Add bar before"
      >
        <PanelRightOpen size={iconSize} />
      </button>
      {!isFirstBarOverall && !isFirstInRow && (
        <button
          type="button"
          onClick={onSetBreak}
          className={btn}
          title="Insert row break before this bar"
        >
          <CornerDownLeft size={iconSize} />
        </button>
      )}
      <button
        type="button"
        onClick={onShorten}
        className={btn}
        title="Shorten bar"
        disabled={!canShorten}
      >
        <CircleMinus size={iconSize} />
      </button>
      <button
        type="button"
        onClick={onLengthen}
        className={btn}
        title="Lengthen bar"
      >
        <CirclePlus size={iconSize} />
      </button>
      {canDelete && (
        <button
          type="button"
          onClick={onDelete}
          className={`${btn} hover:text-destructive`}
          title="Delete bar"
        >
          <Trash2 size={iconSize} />
        </button>
      )}
      <button
        type="button"
        onClick={onAddAfter}
        className={btn}
        title="Add bar after"
      >
        <PanelLeftOpen size={iconSize} />
      </button>
    </div>
  );
}
