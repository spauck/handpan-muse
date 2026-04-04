/** biome-ignore-all lint/suspicious/noArrayIndexKey: because */

import { Circle, Dot } from "lucide-react";
import { type Beat, beatAllNotes, type Hand } from "@/lib/composer-state";
import type { Settings } from "@/lib/settings";
import { useSettings } from "@/lib/settings";
import { getIconName, IconNote, isIconNote } from "./IconNote";
import { RadialGlyph } from "./PanScriptGlyph";

interface UnifiedBeatCellProps {
  beat: Beat;
  isSelected: boolean;
  onSelect: () => void;
}

export function BeatCell({ beat, isSelected, onSelect }: UnifiedBeatCellProps) {
  const { settings } = useSettings();
  const allNotes = beatAllNotes(beat);
  const isEmpty = allNotes.length === 0;

  return (
    <button
      type="button"
      className={`aspect-[7/9] w-full flex items-center justify-center rounded transition-all relative
        ${isSelected ? "ring-2 ring-ring bg-accent scale-110" : "hover:bg-secondary"}
        ${isEmpty ? "text-beat-empty" : ""}
        cursor-pointer select-none p-0`}
      onClick={onSelect}
    >
      {isEmpty ? (
        <span className="absolute inset-0 flex items-center justify-center">
          <Dot />
        </span>
      ) : (
        <>
          <span className="absolute inset-0 flex items-center justify-center">
            <Circle className="text-beat-empty" size={58} strokeWidth={1} />
          </span>
          {allNotes.map((n, i) => {
            return (
              <span
                key={i}
                className="absolute inset-0 flex items-center justify-center"
              >
                <NoteGlyph key={i} note={n} settings={settings} />
              </span>
            );
          })}
        </>
      )}
    </button>
  );
}

const handColor = (settings: Settings, hand: "right" | "left" | "any") => {
  return `hsl(${settings[`${hand}HandColor`]})`;
};

const NoteGlyph = ({
  note,
  settings,
}: {
  note: { value: string; hand: Hand };
  settings: Settings;
}) => {
  if (isIconNote(note.value)) {
    return (
      <IconNote
        name={getIconName(note.value)}
        color={handColor(settings, note.hand)}
        size="80%"
      />
    );
  }
  const pos = parseInt(note.value, 10);
  if (Number.isNaN(pos)) return null;

  return (
    <RadialGlyph
      fluid
      className="absolute inset-0 flex items-center justify-center"
      settings={settings}
      active={[pos]}
      color={handColor(settings, note.hand)}
      size={94}
    />
  );
};
