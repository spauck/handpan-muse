// Each beat: [rightHandNotes[], leftHandNotes[], anyHandNotes[]] where each array holds 0-3 note strings
export type Hand = "right" | "left" | "any";
export type Beat = [string[], string[], string[]];
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

function initRow(beatsPerBar: number, barsPerRow: number): Row {
  return Array.from({ length: beatsPerBar * barsPerRow }, () => [[], [], []]);
}

function encodeHand(notes: string[]): string {
  return notes.length === 0 ? "" : notes.join("+");
}

function encodeBeat(beat: Beat): string {
  return `${encodeHand(beat[0])}/${encodeHand(beat[1])}/${encodeHand(beat[2])}`;
}

function decodeHand(part: string): string[] {
  if (!part) return [];
  return part.split("+").filter(Boolean);
}

function decodeBeat(beatStr: string): Beat {
  const parts = beatStr.split("/");
  if (parts.length >= 3) {
    return [decodeHand(parts[0]), decodeHand(parts[1]), decodeHand(parts[2])];
  }
  if (parts.length === 2) {
    return [decodeHand(parts[0]), decodeHand(parts[1]), []];
  }
  // Legacy "r.l" format
  const dotIdx = beatStr.indexOf(".");
  if (dotIdx === -1) return [[], [], []];
  const r = beatStr.slice(0, dotIdx);
  const l = beatStr.slice(dotIdx + 1);
  const toArr = (v: string) => (v === "" || v === "." ? [] : [v]);
  return [toArr(r), toArr(l), []];
}

export function encodeState(state: ComposerState): string {
  const rows = state.rows.map((row) => row.map(encodeBeat).join(",")).join("|");
  return `b=${state.beatsPerBar}&r=${state.barsPerRow}&n=${state.notesPerCount}&d=${encodeURIComponent(rows)}`;
}

export function decodeState(search: string): ComposerState {
  const params = new URLSearchParams(search);
  const b = parseInt(params.get("b") || "", 10);
  const r = parseInt(params.get("r") || "", 10);
  const n = parseInt(params.get("n") || "1", 10) || 1;
  const d = params.get("d");

  if (!b || !r || !d) {
    return {
      ...DEFAULT_STATE,
      rows: [initRow(DEFAULT_STATE.beatsPerBar, DEFAULT_STATE.barsPerRow)],
    };
  }

  const rows: Row[] = d
    .split("|")
    .map((rowStr) => rowStr.split(",").map(decodeBeat));

  return { beatsPerBar: b, barsPerRow: r, notesPerCount: n, rows };
}

export function createEmptyRow(beatsPerBar: number, barsPerRow: number): Row {
  return initRow(beatsPerBar, barsPerRow);
}

/** Get the hand index for a Hand type */
export function handIndex(hand: Hand): 0 | 1 | 2 {
  return hand === "right" ? 0 : hand === "left" ? 1 : 2;
}

/** Get all notes in a beat across all hands with their hand labels */
export function beatAllNotes(beat: Beat): Array<{ value: string; hand: Hand }> {
  const result: Array<{ value: string; hand: Hand }> = [];
  for (const v of beat[0]) result.push({ value: v, hand: "right" });
  for (const v of beat[1]) result.push({ value: v, hand: "left" });
  for (const v of beat[2]) result.push({ value: v, hand: "any" });
  return result;
}

/** Find which hand a note belongs to in a beat, or null */
export function findNoteHand(beat: Beat, value: string): Hand | null {
  if (beat[0].includes(value)) return "right";
  if (beat[1].includes(value)) return "left";
  if (beat[2].includes(value)) return "any";
  return null;
}

export { DEFAULT_STATE };
