import type { Hand } from "@/lib/composer-state";
import type { Settings } from "@/lib/settings";
import { getNotes } from "./Notes";

export const NoteGlyph = ({
  noteId,
  hand,
  settings,
}: {
  noteId: string;
  hand: Hand;
  settings: Settings;
}) => {
  const note = getNotes(settings)[noteId];

  return (
    note && (
      <note.Component
        {...note.props}
        noteId={noteId}
        hand={hand}
        settings={settings}
      />
    )
  );
};
