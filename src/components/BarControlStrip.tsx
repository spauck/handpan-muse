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
        className="h-2 mt-1 rounded-sm bg-bar-divider/60 hover:bg-primary/50 transition-colors cursor-pointer w-full min-w-0"
      />
    );
  }

  const btn =
    "text-muted-foreground hover:text-foreground p-1 rounded-sm hover:bg-accent/60 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed";

  return (
    <div
      className="mt-1 flex items-center justify-center gap-0.5 rounded-sm bg-accent/40 ring-1 ring-primary/40 px-1 py-0.5 whitespace-nowrap"
      role="toolbar"
      aria-label="Bar controls"
    >
      <button
        type="button"
        onClick={onAddBefore}
        className={btn}
        title="Add bar before"
      >
        <PanelRightOpen size={13} />
      </button>
      {!isFirstBarOverall && !isFirstInRow && (
        <button
          type="button"
          onClick={onSetBreak}
          className={btn}
          title="Insert row break before this bar"
        >
          <CornerDownLeft size={13} />
        </button>
      )}
      <button
        type="button"
        onClick={onShorten}
        className={btn}
        title="Shorten bar"
        disabled={!canShorten}
      >
        <CircleMinus size={13} />
      </button>
      <button
        type="button"
        onClick={onLengthen}
        className={btn}
        title="Lengthen bar"
      >
        <CirclePlus size={13} />
      </button>
      {canDelete && (
        <button
          type="button"
          onClick={onDelete}
          className={`${btn} hover:text-destructive`}
          title="Delete bar"
        >
          <Trash2 size={13} />
        </button>
      )}
      <button
        type="button"
        onClick={onAddAfter}
        className={btn}
        title="Add bar after"
      >
        <PanelLeftOpen size={13} />
      </button>
    </div>
  );
}
