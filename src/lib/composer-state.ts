// Each beat: [rightHandNote, leftHandNote] where null = no note
export type Beat = [number | null, number | null];
export type Row = Beat[];

export interface ComposerState {
  beatsPerBar: number;
  barsPerRow: number;
  rows: Row[];
}

const DEFAULT_STATE: ComposerState = {
  beatsPerBar: 4,
  barsPerRow: 2,
  rows: [[]],
};

function initRow(beatsPerBar: number, barsPerRow: number): Row {
  return Array.from({ length: beatsPerBar * barsPerRow }, () => [null, null]);
}

export function encodeState(state: ComposerState): string {
  // Compact: b=beatsPerBar,r=barsPerRow,d=row1|row2...
  // Each row: beat1,beat2... each beat: R.L (dot for null)
  const rows = state.rows.map(row =>
    row.map(([r, l]) => `${r ?? '.'}.${l ?? '.'}`).join(',')
  ).join('|');
  return `b=${state.beatsPerBar}&r=${state.barsPerRow}&d=${encodeURIComponent(rows)}`;
}

export function decodeState(search: string): ComposerState {
  const params = new URLSearchParams(search);
  const b = parseInt(params.get('b') || '');
  const r = parseInt(params.get('r') || '');
  const d = params.get('d');

  if (!b || !r || !d) {
    const state = { ...DEFAULT_STATE, rows: [initRow(DEFAULT_STATE.beatsPerBar, DEFAULT_STATE.barsPerRow)] };
    return state;
  }

  const rows: Row[] = d.split('|').map(rowStr => {
    return rowStr.split(',').map(beatStr => {
      const [right, left] = beatStr.split('.');
      return [
        right === '.' || right === '' ? null : parseInt(right),
        left === '.' || left === '' ? null : parseInt(left),
      ] as Beat;
    });
  });

  return { beatsPerBar: b, barsPerRow: r, rows };
}

export function createEmptyRow(beatsPerBar: number, barsPerRow: number): Row {
  return initRow(beatsPerBar, barsPerRow);
}

export { DEFAULT_STATE };
