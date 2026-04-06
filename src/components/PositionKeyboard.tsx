import { Eraser } from "lucide-react";
import { useMemo, useState } from "react";
import {
  type Beat,
  beatAllNotes,
  type Hand,
  handIndex,
  type Row,
} from "@/lib/composer-state";
import { handColorClass, useSettings } from "@/lib/settings";
import { ICON_NAMES, IconNote, isIconNote, getIconName } from "./IconNote";
import { CompositeGlyph, RadialGlyph } from "./PanScriptGlyph";

interface SelectedCell {
  rowIdx: number;
  beatIdx: number;
}

interface PositionKeyboardProps {
  selectedCell: SelectedCell | null;
  activeNotes: Array<{ value: string; hand: Hand }>;
  rows: Row[];
  onAssignNote: (value: string, hand: Hand) => void;
  onRemoveNote: (value: string) => void;
  onClearAll: () => void;
}

const HAND_OPTIONS: { hand: Hand; label: string; short: string }[] = [
  { hand: "right", label: "Right", short: "R" },
  { hand: "left", label: "Left", short: "L" },
  { hand: "any", label: "Any", short: "A" },
];

type KeyboardTab = "positions" | "icons" | "chords";

/** A chord is a unique combination of notes with their hand assignments */
interface Chord {
  key: string; // serialized identity
  notes: Array<{ value: string; hand: Hand }>;
}

function serializeChord(notes: Array<{ value: string; hand: Hand }>): string {
  return notes
    .map((n) => `${n.hand}:${n.value}`)
    .sort()
    .join("|");
}

function extractChords(rows: Row[]): Chord[] {
  const seen = new Map<string, Chord>();
  for (const row of rows) {
    for (const beat of row) {
      const notes = beatAllNotes(beat);
      if (notes.length === 0) continue;
      const key = serializeChord(notes);
      if (!seen.has(key)) {
        seen.set(key, { key, notes });
      }
    }
  }
  return Array.from(seen.values());
}

export function PositionKeyboard({
  selectedCell,
  activeNotes,
  rows,
  onAssignNote,
  onRemoveNote,
  onClearAll,
}: PositionKeyboardProps) {
  const { settings } = useSettings();
  const [pendingNote, setPendingNote] = useState<string | null>(null);
  const [tab, setTab] = useState<KeyboardTab>("positions");

  const chords = useMemo(() => extractChords(rows), [rows]);

  if (!selectedCell) return null;

  const activeMap = new Map(activeNotes.map((n) => [n.value, n.hand]));
  const totalNotes = activeNotes.length;
  const positions = [
    0,
    ...Array.from({ length: settings.panscriptFields }, (_, i) => i + 1),
  ];

  const handleTap = (val: string) => {
    if (activeMap.has(val)) {
      onRemoveNote(val);
    } else {
      setPendingNote(pendingNote === val ? null : val);
    }
  };

  const handleHandPick = (hand: Hand) => {
    if (!pendingNote) return;
    onAssignNote(pendingNote, hand);
    setPendingNote(null);
  };

  const handleChordTap = (chord: Chord) => {
    // Clear current beat then assign all chord notes
    onClearAll();
    // Use setTimeout to ensure clear happens first
    setTimeout(() => {
      for (const n of chord.notes) {
        onAssignNote(n.value, n.hand);
      }
    }, 0);
  };

  const existingHand = pendingNote
    ? (activeMap.get(pendingNote) ?? null)
    : null;
  const isNewNote = pendingNote !== null && !activeMap.has(pendingNote);

  const currentChordKey = totalNotes > 0 ? serializeChord(activeNotes) : null;

  const handColor = (hand: Hand) => {
    return hand === "right"
      ? `hsl(${settings.rightHandColor})`
      : hand === "left"
        ? `hsl(${settings.leftHandColor})`
        : `hsl(${settings.anyHandColor})`;
  };

  const TAB_OPTIONS: { id: KeyboardTab; label: string }[] = [
    { id: "positions", label: "Positions" },
    { id: "icons", label: "Icons" },
    ...(chords.length > 0 ? [{ id: "chords" as KeyboardTab, label: `Chords (${chords.length})` }] : []),
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur border-t border-border px-3 py-2 safe-bottom">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-1 mb-1.5">
          <span className="text-[10px] text-muted-foreground">
            Row {selectedCell.rowIdx + 1}, Beat {selectedCell.beatIdx + 1}
          </span>
          {totalNotes > 0 && (
            <span className="text-[10px] text-muted-foreground ml-1">
              · {totalNotes} note{totalNotes !== 1 ? "s" : ""}
            </span>
          )}
          <div className="ml-auto flex items-center gap-1">
            {TAB_OPTIONS.map(({ id, label }) => (
              <button
                type="button"
                key={id}
                onClick={() => { setTab(id); setPendingNote(null); }}
                className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                  tab === id
                    ? "bg-accent border-ring text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Hand picker */}
        {pendingNote !== null && tab !== "chords" && (
          <div className="flex items-center gap-1.5 mb-1.5 bg-secondary/50 rounded-lg px-2 py-1.5 border border-border">
            <span className="text-xs text-muted-foreground mr-1">
              {isNewNote ? "Add to:" : "Move to:"}
            </span>
            {HAND_OPTIONS.map(({ hand, label, short }) => {
              const isCurrentHand = existingHand === hand;
              const colorCls = handColorClass(hand);
              return (
                <button
                  type="button"
                  key={hand}
                  onClick={() => handleHandPick(hand)}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-colors border ${
                    isCurrentHand
                      ? `${colorCls} border-ring bg-accent`
                      : `${colorCls} border-border hover:border-ring/50 hover:bg-accent/50`
                  }`}
                >
                  {short} · {label}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setPendingNote(null)}
              className="ml-auto text-[10px] text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Note buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {tab === "positions" &&
            positions.map((pos) => {
              const val = String(pos);
              const noteHand = activeMap.get(val);
              const isActive = noteHand !== undefined;
              const isPending = pendingNote === val;
              const activeColor = isActive ? handColor(noteHand) : undefined;

              return (
                <button
                  type="button"
                  key={pos}
                  onClick={() => handleTap(val)}
                  className={`shrink-0 w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-lg transition-colors border
                    ${
                      isPending
                        ? "ring-2 ring-ring bg-accent border-ring"
                        : isActive
                          ? "bg-secondary border-current"
                          : "bg-secondary hover:bg-accent text-foreground border-border"
                    }`}
                  style={isActive ? { color: activeColor } : undefined}
                  title={pos === 0 ? "Ding" : `Field ${pos}`}
                >
                  <RadialGlyph
                    settings={settings}
                    active={[pos]}
                    color={activeColor}
                    size={24}
                  />
                </button>
              );
            })}

          {tab === "icons" &&
            ICON_NAMES.map((name) => {
              const val = `icon:${name}`;
              const noteHand = activeMap.get(val);
              const isActive = noteHand !== undefined;
              const isPending = pendingNote === val;
              const activeColor = isActive ? handColor(noteHand) : undefined;

              return (
                <button
                  type="button"
                  key={name}
                  onClick={() => handleTap(val)}
                  className={`shrink-0 w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-lg transition-colors border
                    ${
                      isPending
                        ? "ring-2 ring-ring bg-accent border-ring"
                        : isActive
                          ? "bg-secondary border-current"
                          : "bg-secondary hover:bg-accent text-foreground border-border"
                    }`}
                  style={isActive ? { color: activeColor } : undefined}
                  title={name}
                >
                  <IconNote name={name} color={activeColor} size={20} />
                </button>
              );
            })}

          {tab === "chords" &&
            chords.map((chord) => {
              const isCurrentChord = currentChordKey === chord.key;
              // Separate position notes and icon notes
              const posNotes = chord.notes.filter((n) => !isIconNote(n.value));
              const iconNotes = chord.notes.filter((n) => isIconNote(n.value));
              const posEntries = posNotes.map((n) => ({
                position: parseInt(n.value, 10),
                color: handColor(n.hand),
              }));

              return (
                <button
                  type="button"
                  key={chord.key}
                  onClick={() => handleChordTap(chord)}
                  className={`shrink-0 w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-lg transition-colors border relative
                    ${
                      isCurrentChord
                        ? "ring-2 ring-ring bg-accent border-ring"
                        : "bg-secondary hover:bg-accent border-border"
                    }`}
                  title={chord.notes.map((n) => `${n.hand[0].toUpperCase()}:${n.value}`).join(", ")}
                >
                  {posEntries.length > 0 && (
                    <CompositeGlyph
                      settings={settings}
                      entries={posEntries}
                      size={32}
                    />
                  )}
                  {iconNotes.map((n, i) => (
                    <span key={i} className="absolute inset-0 flex items-center justify-center">
                      <IconNote
                        name={getIconName(n.value)}
                        color={handColor(n.hand)}
                        size={20}
                      />
                    </span>
                  ))}
                </button>
              );
            })}

          {tab !== "chords" && (
            <button
              type="button"
              onClick={onClearAll}
              className="shrink-0 w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-lg bg-secondary hover:bg-destructive/20 text-muted-foreground hover:text-destructive font-mono text-sm transition-colors border border-border"
              title="Clear all notes"
            >
              <Eraser size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
