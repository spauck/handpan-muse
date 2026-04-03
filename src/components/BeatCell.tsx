import { useSettings } from "@/lib/settings";
import { CompositeGlyph } from "./PanScriptGlyph";
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

  const parsePositions = (notes: string[]) =>
    notes.map(n => parseInt(n, 10)).filter(n => !isNaN(n));

  const rightPos = parsePositions(beat[0]);
  const leftPos = parsePositions(beat[1]);
  const anyPos = parsePositions(beat[2]);

  return (
    <button
      className={`aspect-[7/9] w-full flex items-center justify-center rounded transition-all
        ${isSelected ? "ring-2 ring-ring bg-accent scale-110" : "hover:bg-secondary"}
        ${isEmpty ? "text-beat-empty" : ""}
        cursor-pointer select-none p-0.5`}
      onClick={onSelect}
    >
      {isEmpty ? (
        <span className="text-[0.6em]">·</span>
      ) : (
        <CompositeGlyph
          fields={settings.panscriptFields}
          rightActive={[...rightPos, ...anyPos]}
          leftActive={[...leftPos, ...anyPos]}
          rightColor={`hsl(${settings.rightHandColor})`}
          leftColor={`hsl(${settings.leftHandColor})`}
          fluid
        />
      )}
    </button>
  );
}
