import { noteDisplayValue, useSettings, handColorClass } from "@/lib/settings";
import { IconNote } from "./IconNote";
import { PanScriptGlyph, CompositeGlyph } from "./PanScriptGlyph";
import { beatAllNotes, type Beat } from "@/lib/composer-state";

interface UnifiedBeatCellProps {
  beat: Beat;
  isSelected: boolean;
  onSelect: () => void;
}

export function BeatCell({ beat, isSelected, onSelect }: UnifiedBeatCellProps) {
  const { settings } = useSettings();
  const allNotes = beatAllNotes(beat);
  const isEmpty = allNotes.length === 0;

  const isPanScript = allNotes.some(n => n.value.startsWith("p"));

  if (isPanScript && !isEmpty) {
    const parsePositions = (notes: string[]) =>
      notes.filter(n => n.startsWith("p")).map(n => parseInt(n.slice(1), 10)).filter(n => !isNaN(n));

    const rightPos = parsePositions(beat[0]);
    const leftPos = parsePositions(beat[1]);
    const anyPos = parsePositions(beat[2]);

    return (
      <button
        className={`w-7 h-9 sm:w-8 sm:h-10 flex items-center justify-center rounded transition-all
          ${isSelected ? "ring-2 ring-ring bg-accent scale-110" : "hover:bg-secondary"}
          cursor-pointer select-none`}
        onClick={onSelect}
      >
        <CompositeGlyph
          fields={settings.panscriptFields}
          rightActive={[...rightPos, ...anyPos]}
          leftActive={[...leftPos, ...anyPos]}
          size={26}
          rightColor={`hsl(${settings.rightHandColor})`}
          leftColor={`hsl(${settings.leftHandColor})`}
        />
      </button>
    );
  }

  return (
    <button
      className={`w-7 h-9 sm:w-8 sm:h-10 flex flex-col items-center justify-center gap-px text-xs font-mono rounded transition-all
        ${isEmpty ? "text-beat-empty hover:text-muted-foreground" : "font-semibold"}
        ${isSelected ? "ring-2 ring-ring bg-accent scale-110" : "hover:bg-secondary"}
        cursor-pointer select-none`}
      onClick={onSelect}
    >
      {isEmpty ? (
        <span className="text-sm">·</span>
      ) : (
        allNotes.map((n, i) => {
          const colorCls = handColorClass(n.hand);
          const parsed = noteDisplayValue(n.value);
          if (parsed.type === "icon") {
            return <span key={i} className={colorCls}><IconNote name={parsed.value} size={10} /></span>;
          }
          return <span key={i} className={`leading-none text-[10px] ${colorCls}`}>{parsed.value}</span>;
        })
      )}
    </button>
  );
}
