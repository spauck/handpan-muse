import { noteDisplayValue } from "@/lib/settings";
import { IconNote } from "./IconNote";

interface BeatCellProps {
  value: string | null;
  hand: "right" | "left";
  isSelected: boolean;
  onSelect: () => void;
}

export function BeatCell({ value, hand, isSelected, onSelect }: BeatCellProps) {
  const colorClass = hand === "right" ? "text-hand-right" : "text-hand-left";
  const isEmpty = value === null;

  const renderValue = () => {
    if (isEmpty) return "·";
    const parsed = noteDisplayValue(value);
    if (parsed.type === "icon") {
      return <IconNote name={parsed.value} size={14} />;
    }
    return parsed.value;
  };

  return (
    <button
      className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-sm font-mono rounded transition-all
        ${isEmpty ? "text-beat-empty hover:text-muted-foreground" : colorClass + " font-semibold"}
        ${isSelected ? "ring-2 ring-ring bg-accent scale-110" : "hover:bg-secondary"}
        cursor-pointer select-none`}
      onClick={onSelect}
      title={`${hand === "right" ? "R" : "L"}: tap to select`}
    >
      {renderValue()}
    </button>
  );
}
