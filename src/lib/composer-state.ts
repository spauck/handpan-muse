// Each beat: [rightHandNotes[], leftHandNotes[]] where each array holds 0-3 note strings
export type Beat = [string[], string[]];
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
  return Array.from({ length: beatsPerBar * barsPerRow }, () => [[], []]);
}

// Encode a single hand's notes array: empty → "" , one note → "1", multiple → "1+2+3"
function encodeHand(notes: string[]): string {
  return notes.length === 0 ? "" : notes.join("+");
}

// Encode beat as "rightPart/leftPart"
function encodeBeat(beat: Beat): string {
  return `${encodeHand(beat[0])}/${encodeHand(beat[1])}`;
}

function decodeHand(part: string): string[] {
  if (!part) return [];
  return part.split("+").filter(Boolean);
}

function decodeBeat(beatStr: string): Beat {
  const slashIdx = beatStr.indexOf("/");
  if (slashIdx === -1) {
    // Legacy format: "r.l" — migrate on the fly
    const dotIdx = beatStr.indexOf(".");
    if (dotIdx === -1) return [[], []];
    const r = beatStr.slice(0, dotIdx);
    const l = beatStr.slice(dotIdx + 1);
    const toArr = (v: string) => (v === "" || v === ".") ? [] : [v];
    return [toArr(r), toArr(l)];
  }
  const r = beatStr.slice(0, slashIdx);
  const l = beatStr.slice(slashIdx + 1);
  return [decodeHand(r), decodeHand(l)];
}

export function encodeState(state: ComposerState): string {
  const rows = state.rows.map(row =>
    row.map(encodeBeat).join(",")
  ).join("|");
  return `b=${state.beatsPerBar}&r=${state.barsPerRow}&n=${state.notesPerCount}&d=${encodeURIComponent(rows)}`;
}

export function decodeState(search: string): ComposerState {
  const params = new URLSearchParams(search);
  const b = parseInt(params.get("b") || "");
  const r = parseInt(params.get("r") || "");
  const n = parseInt(params.get("n") || "1") || 1;
  const d = params.get("d");

  if (!b || !r || !d) {
    return { ...DEFAULT_STATE, rows: [initRow(DEFAULT_STATE.beatsPerBar, DEFAULT_STATE.barsPerRow)] };
  }

  const rows: Row[] = d.split("|").map(rowStr =>
    rowStr.split(",").map(decodeBeat)
  );

  return { beatsPerBar: b, barsPerRow: r, notesPerCount: n, rows };
}

export function createEmptyRow(beatsPerBar: number, barsPerRow: number): Row {
  return initRow(beatsPerBar, barsPerRow);
}

export { DEFAULT_STATE };
