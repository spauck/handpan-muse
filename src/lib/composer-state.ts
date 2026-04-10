// Each beat: [rightHandNotes[], leftHandNotes[], anyHandNotes[]] where each array holds 0-3 note strings
export type Hand = "right" | "left" | "any" | "none";
export type Note = { value: string; hand: Hand };
export type Beat = Note[];
export type Row = Beat[];

export interface ComposerState {
  beatsPerBar: number;
  barsPerRow: number;
  notesPerCount: number;
  rows: Row[];
}

const DEFAULT_STATE: ComposerState = {
  beatsPerBar: 4,
  barsPerRow: 2,
  notesPerCount: 1,
  rows: [[]],
};

const _rowSplit = "|";
const beatSplit = ".";
const noteSplit = "-";

function initRow(beatsPerBar: number, barsPerRow: number): Row {
  return Array.from({ length: beatsPerBar * barsPerRow }, () => []);
}

function encodeBeat(beat: Beat): string {
  return beat.map((note) => handShort[note.hand] + note.value).join(noteSplit);
}

function decodeBeat(beatStr: string): Beat {
  const notes = beatStr.split(noteSplit).filter(Boolean);
  return notes.map((note) => ({
    value: note.slice(1),
    hand: shortHand[note[0]],
  }));
}

export function encodeState(state: ComposerState): string {
  const rows = state.rows.map((row) => row.map(encodeBeat).join(beatSplit));
  return `b=${state.beatsPerBar}&r=${state.barsPerRow}&n=${state.notesPerCount}&${rows
    .map(encodeURIComponent)
    .map((row) => `d=${row}`)
    .join("&")}`;
}

export function decodeState(search: string): ComposerState {
  const params = new URLSearchParams(search);
  const b = parseInt(params.get("b") || "", 10);
  const r = parseInt(params.get("r") || "", 10);
  const n = parseInt(params.get("n") || "2", 10) || 1;
  const d = params.getAll("d");

  if (!b || !r || !d) {
    return {
      ...DEFAULT_STATE,
      rows: [initRow(DEFAULT_STATE.beatsPerBar, DEFAULT_STATE.barsPerRow)],
    };
  }

  const rows: Row[] = d.map((rowStr) =>
    rowStr.split(beatSplit).map(decodeBeat),
  );

  return { beatsPerBar: b, barsPerRow: r, notesPerCount: n, rows };
}

export function createEmptyRow(beatsPerBar: number, barsPerRow: number): Row {
  return initRow(beatsPerBar, barsPerRow);
}

export const shortHand: Record<string, Hand> = {
  r: "right",
  l: "left",
  a: "any",
  n: "none",
};

export const handShort: Record<Hand, string> = {
  right: "r",
  left: "l",
  any: "a",
  none: "n",
};

export { DEFAULT_STATE };
