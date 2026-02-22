import { noteDisplayValue, useSettings } from "@/lib/settings";
import { IconNote } from "./IconNote";
import { PanScriptGlyph } from "./PanScriptGlyph";

interface BeatCellProps {
  notes: string[];   // array of note values for this hand (0-3)
  hand: "right" | "left";
  isSelected: boolean;
  onSelect: () => void;
}

export function BeatCell({ notes, hand, isSelected, onSelect }: BeatCellProps) {
  const { settings } = useSettings();
  const colorClass = hand === "right" ? "text-hand-right" : "text-hand-left";
  const isEmpty = notes.length === 0;
  const isPanScript = settings.noteMode === "panscript" || notes.some(n => n.startsWith("p"));

  if (isPanScript && !isEmpty) {
    const activePositions = notes
      .filter(n => n.startsWith("p"))
      .map(n => parseInt(n.slice(1), 10))
      .filter(n => !isNaN(n));

    const hslColor = hand === "right" ? settings.rightHandColor : settings.leftHandColor;

    return (
      <button
        className={`w-7 h-9 sm:w-8 sm:h-10 flex items-center justify-center rounded transition-all
          ${isSelected ? "ring-2 ring-ring bg-accent scale-110" : "hover:bg-secondary"}
          cursor-pointer select-none`}
        onClick={onSelect}
        title={`${hand === "right" ? "R" : "L"}: tap to select`}
      >
        <PanScriptGlyph
          fields={settings.panscriptFields}
          active={activePositions}
          size={hand === "right" ? 26 : 26}
          color={`hsl(${hslColor})`}
        />
      </button>
    );
  }

  const renderNote = (val: string, idx: number) => {
    const parsed = noteDisplayValue(val);
    if (parsed.type === "icon") {
      return <IconNote key={idx} name={parsed.value} size={12} />;
    }
    return <span key={idx} className="leading-none">{parsed.value}</span>;
  };

  return (
    <button
      className={`w-7 h-9 sm:w-8 sm:h-10 flex flex-col items-center justify-center gap-px text-xs font-mono rounded transition-all
        ${isEmpty ? "text-beat-empty hover:text-muted-foreground" : colorClass + " font-semibold"}
        ${isSelected ? "ring-2 ring-ring bg-accent scale-110" : "hover:bg-secondary"}
        cursor-pointer select-none`}
      onClick={onSelect}
      title={`${hand === "right" ? "R" : "L"}: tap to select`}
    >
      {isEmpty ? (
        <span className="text-sm">·</span>
      ) : (
        notes.map((v, i) => renderNote(v, i))
      )}
    </button>
  );
}
