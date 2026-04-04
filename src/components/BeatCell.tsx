import { type Beat, beatAllNotes } from "@/lib/composer-state";
import { useSettings } from "@/lib/settings";
import { getIconName, IconNote, isIconNote } from "./IconNote";
import { CompositeGlyph } from "./PanScriptGlyph";

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
    notes.map((n) => parseInt(n, 10)).filter((n) => !Number.isNaN(n));

  const rightPos = parsePositions(beat[0]);
  const leftPos = parsePositions(beat[1]);
  const anyPos = parsePositions(beat[2]);

  // Collect icon notes with their colors
  const iconNotes = allNotes.filter((n) => isIconNote(n.value));

  const hasGlyphNotes = rightPos.length + leftPos.length + anyPos.length > 0;

  const handColor = (hand: string) =>
    hand === "right"
      ? `hsl(${settings.rightHandColor})`
      : hand === "left"
        ? `hsl(${settings.leftHandColor})`
        : `hsl(${settings.anyHandColor})`;

  return (
    <button
      type="button"
      className={`aspect-[7/9] w-full flex items-center justify-center rounded transition-all relative
        ${isSelected ? "ring-2 ring-ring bg-accent scale-110" : "hover:bg-secondary"}
        ${isEmpty ? "text-beat-empty" : ""}
        cursor-pointer select-none p-0.5`}
      onClick={onSelect}
    >
      {isEmpty ? (
        <span className="text-[0.6em]">·</span>
      ) : (
        <>
          {hasGlyphNotes && (
            <CompositeGlyph
              fields={settings.panscriptFields}
              rightActive={[...rightPos, ...anyPos]}
              leftActive={[...leftPos, ...anyPos]}
              rightColor={`hsl(${settings.rightHandColor})`}
              leftColor={`hsl(${settings.leftHandColor})`}
              fluid
            />
          )}
          {iconNotes.map((n, i) => (
            <span
              // biome-ignore lint/suspicious/noArrayIndexKey: because
              key={i}
              className="absolute inset-0 flex items-center justify-center"
            >
              <IconNote
                name={getIconName(n.value)}
                color={handColor(n.hand)}
                size="60%"
              />
            </span>
          ))}
        </>
      )}
    </button>
  );
}
