// Composition model: a flat array of Bars. Each Bar has its own length (number
// of beats) and a `breakBefore` flag that begins a new row. The first bar
// implicitly starts the first row regardless of its flag.
export type Hand = "right" | "left" | "any" | "none";
export type Note = { value: string; hand: Hand };
export type Beat = Note[];

export interface Bar {
  beats: Beat[];
  breakBefore: boolean;
}

export interface ComposerState {
  notesPerCount: number;
  bars: Bar[];
}

const DEFAULT_BEATS_PER_BAR = 4;

const DEFAULT_STATE: ComposerState = {
  notesPerCount: 1,
  bars: [{ beats: emptyBeats(DEFAULT_BEATS_PER_BAR), breakBefore: true }],
};

const beatSplit = ".";
const noteSplit = "-";
const barSplit = ",";

function emptyBeats(n: number): Beat[] {
  return Array.from({ length: n }, () => []);
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

/** Encode a single bar: `[len][!]beat.beat.beat` */
function encodeBar(bar: Bar): string {
  const head = `${bar.beats.length}${bar.breakBefore ? "!" : ""}`;
  return head + bar.beats.map(encodeBeat).join(beatSplit);
}

function decodeBar(barStr: string): Bar | null {
  const m = barStr.match(/^(\d+)(!?)(.*)$/);
  if (!m) return null;
  const len = parseInt(m[1], 10);
  const breakBefore = m[2] === "!";
  const rest = m[3];
  // Split into exactly `len` beats (preserving empties)
  const beatStrs = rest === "" ? [] : rest.split(beatSplit);
  const beats: Beat[] = Array.from(
    { length: len },
    (_, i): Beat => decodeBeat(beatStrs[i] ?? ""),
  );
  return { beats, breakBefore };
}

export function encodeState(state: ComposerState): string {
  const bars = state.bars.map(encodeBar).join(barSplit);
  const parts = [`n=${state.notesPerCount}`];
  if (bars) parts.push(`bars=${encodeURIComponent(bars)}`);
  return parts.join("&");
}

export function decodeState(search: string): ComposerState {
  const params = new URLSearchParams(search);
  const n = parseInt(params.get("n") || "1", 10) || 1;
  const barsParam = params.get("bars");

  if (barsParam) {
    const bars = barsParam
      .split(barSplit)
      .map(decodeBar)
      .filter((b): b is Bar => b !== null);
    if (bars.length > 0) {
      // Ensure the very first bar starts a row.
      bars[0] = { ...bars[0], breakBefore: true };
      return { notesPerCount: n, bars };
    }
  }

  // ─── BEGIN LEGACY MIGRATION ─────────────────────────────────────────────
  // Old schema: b=beatsPerBar, r=barsPerRow, d=row (one per row, beats joined
  // by ".", with each row containing beatsPerBar*barsPerRow beats).
  // Remove this block once no legacy URLs/saves are in circulation.
  const legacyB = parseInt(params.get("b") || "", 10);
  const legacyR = parseInt(params.get("r") || "", 10);
  const legacyD = params.getAll("d");
  if (legacyB && legacyR && legacyD.length > 0) {
    const bars: Bar[] = [];
    for (const rowStr of legacyD) {
      const allBeats = rowStr.split(beatSplit).map(decodeBeat);
      for (let bi = 0; bi < legacyR; bi++) {
        const beats: Beat[] = Array.from(
          { length: legacyB },
          (_, i): Beat => allBeats[bi * legacyB + i] ?? [],
        );
        bars.push({ beats, breakBefore: bi === 0 });
      }
    }
    if (bars.length > 0) {
      bars[0] = { ...bars[0], breakBefore: true };
      return { notesPerCount: n, bars };
    }
  }
  // ─── END LEGACY MIGRATION ───────────────────────────────────────────────

  return {
    notesPerCount: n,
    bars: [{ beats: emptyBeats(DEFAULT_BEATS_PER_BAR), breakBefore: true }],
  };
}

/** Group bars into rows by their breakBefore flag. */
export function groupIntoRows(bars: Bar[]): Array<{ start: number; bars: Bar[] }> {
  const rows: Array<{ start: number; bars: Bar[] }> = [];
  bars.forEach((bar, i) => {
    if (i === 0 || bar.breakBefore) {
      rows.push({ start: i, bars: [bar] });
    } else {
      rows[rows.length - 1].bars.push(bar);
    }
  });
  return rows;
}

/** Suggested length for a newly-added bar: last bar length, else rounded
 * average, else DEFAULT_BEATS_PER_BAR. */
export function nextBarLength(bars: Bar[]): number {
  if (bars.length === 0) return DEFAULT_BEATS_PER_BAR;
  const last = bars[bars.length - 1].beats.length;
  if (last) return last;
  const total = bars.reduce((s, b) => s + b.beats.length, 0);
  if (total > 0) return Math.max(1, Math.round(total / bars.length));
  return DEFAULT_BEATS_PER_BAR;
}

export function createEmptyBar(length: number, breakBefore = false): Bar {
  return { beats: emptyBeats(length), breakBefore };
}

export function resizeBar(bar: Bar, length: number): Bar {
  if (length < 1) return bar;
  const beats: Beat[] = Array.from(
    { length },
    (_, i): Beat => bar.beats[i] ?? [],
  );
  return { ...bar, beats };
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

export { DEFAULT_STATE, DEFAULT_BEATS_PER_BAR };
