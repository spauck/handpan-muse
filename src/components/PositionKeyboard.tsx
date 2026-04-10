/** biome-ignore-all lint/suspicious/noArrayIndexKey: because */

import { Eraser } from "lucide-react";
import { useMemo, useState } from "react";
import type { Beat, Hand, Row } from "@/lib/composer-state";
import { handColorClass, useSettings } from "@/lib/settings";
import { handColor } from "./handColor";
import { NoteGlyph } from "./NoteGlyph";
import { getNotes } from "./Notes";

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
  onSetBeat: (beat: Beat) => void;
}

const HAND_OPTIONS: { hand: Hand; label: string; short: string }[] = [
  { hand: "right", label: "Right", short: "R" },
  { hand: "left", label: "Left", short: "L" },
  { hand: "any", label: "Any", short: "A" },
  { hand: "none", label: "None", short: "N" },
];

type KeyboardTab = "notes" | "chords";

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
    for (const notes of row) {
      if (notes.length < 2) continue;
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
  onSetBeat,
}: PositionKeyboardProps) {
  const { settings } = useSettings();
  const [pendingNote, setPendingNote] = useState<string | null>(null);
  const [tab, setTab] = useState<KeyboardTab>("notes");

  const chords = useMemo(() => extractChords(rows), [rows]);

  if (!selectedCell) return null;

  const activeMap = new Map(activeNotes.map((n) => [n.value, n.hand]));
  const totalNotes = activeNotes.length;

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
    onSetBeat(chord.notes);
  };

  const existingHand = pendingNote
    ? (activeMap.get(pendingNote) ?? null)
    : null;
  const isNewNote = pendingNote !== null && !activeMap.has(pendingNote);

  const currentChordKey = totalNotes > 0 ? serializeChord(activeNotes) : null;

  const TAB_OPTIONS: { id: KeyboardTab; label: string }[] = [
    { id: "notes", label: "Notes" },
    ...(chords.length > 0
      ? [{ id: "chords" as KeyboardTab, label: `Chords (${chords.length})` }]
      : []),
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
                onClick={() => {
                  setTab(id);
                  setPendingNote(null);
                }}
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
          {tab === "notes" &&
            Object.entries(getNotes(settings)).map(([val, note]) => {
              const noteHand = activeMap.get(val);
              const isActive = noteHand !== undefined;
              const isPending = pendingNote === val;

              return (
                <button
                  type="button"
                  key={val}
                  onClick={() => handleTap(val)}
                  className={`shrink-0 w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-lg transition-colors border
                    ${
                      isPending
                        ? "ring-2 ring-ring bg-accent border-ring"
                        : isActive
                          ? "bg-secondary border-current"
                          : "bg-secondary hover:bg-accent text-foreground border-border"
                    }`}
                  style={isActive ? { color: handColor(noteHand) } : undefined}
                  title={val === "0" ? "Ding" : `Field ${val}`}
                >
                  <note.Component
                    {...note.props}
                    noteId={val}
                    hand={noteHand ?? "none"}
                    settings={settings}
                    className="relative inset-0 flex items-center justify-center"
                  />
                </button>
              );
            })}

          {tab === "chords" &&
            chords.map((chord) => {
              const isCurrentChord = currentChordKey === chord.key;
              // Separate position notes and icon notes

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
                  title={chord.notes
                    .map((n) => `${n.hand[0].toUpperCase()}:${n.value}`)
                    .join(", ")}
                >
                  {chord.notes.map((n, i) => (
                    <span
                      key={i}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <NoteGlyph
                        key={i}
                        noteId={n.value}
                        hand={n.hand}
                        settings={settings}
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
