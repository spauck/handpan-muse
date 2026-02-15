import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { ComposerGrid } from "@/components/ComposerGrid";
import { decodeState, encodeState, createEmptyRow, type ComposerState, type Beat } from "@/lib/composer-state";
import { Plus, RotateCcw } from "lucide-react";

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const state = useMemo(() => decodeState(searchParams.toString()), [searchParams]);

  const updateState = useCallback((newState: ComposerState) => {
    setSearchParams(encodeState(newState), { replace: true });
  }, [setSearchParams]);

  const handleBeatChange = useCallback((rowIdx: number, beatIdx: number, hand: "right" | "left", val: number | null) => {
    const newRows = state.rows.map((row, ri) => {
      if (ri !== rowIdx) return row;
      return row.map((beat, bi): Beat => {
        if (bi !== beatIdx) return beat;
        return hand === "right" ? [val, beat[1]] : [beat[0], val];
      });
    });
    updateState({ ...state, rows: newRows });
  }, [state, updateState]);

  const addRow = useCallback(() => {
    updateState({
      ...state,
      rows: [...state.rows, createEmptyRow(state.beatsPerBar, state.barsPerRow)],
    });
  }, [state, updateState]);

  const deleteRow = useCallback((idx: number) => {
    if (state.rows.length <= 1) return;
    updateState({ ...state, rows: state.rows.filter((_, i) => i !== idx) });
  }, [state, updateState]);

  const handleConfigChange = useCallback((field: "beatsPerBar" | "barsPerRow", val: number) => {
    if (val < 1 || val > 16) return;
    const newState = { ...state, [field]: val };
    // Rebuild all rows with new dimensions
    const totalBeats = newState.beatsPerBar * newState.barsPerRow;
    newState.rows = newState.rows.map(row => {
      const newRow: Beat[] = Array.from({ length: totalBeats }, (_, i) => row[i] ?? [null, null]);
      return newRow;
    });
    updateState(newState);
  }, [state, updateState]);

  const reset = useCallback(() => {
    setSearchParams("", { replace: true });
  }, [setSearchParams]);

  return (
    <div className="min-h-screen bg-background p-3 sm:p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            🪘 Handpan Composer
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tap beats to add notes · <span className="text-hand-right">Right</span> · <span className="text-hand-left">Left</span> · Share via URL
          </p>
        </div>

        {/* Config */}
        <div className="flex flex-wrap items-center gap-4 mb-5 bg-card rounded-lg p-3 border border-border">
          <label className="flex items-center gap-2 text-sm text-secondary-foreground">
            <span className="text-muted-foreground">Beats/bar</span>
            <select
              value={state.beatsPerBar}
              onChange={(e) => handleConfigChange("beatsPerBar", parseInt(e.target.value))}
              className="bg-secondary text-foreground rounded px-2 py-1 text-sm font-mono border border-border"
            >
              {[2, 3, 4, 5, 6, 7, 8].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-secondary-foreground">
            <span className="text-muted-foreground">Bars/row</span>
            <select
              value={state.barsPerRow}
              onChange={(e) => handleConfigChange("barsPerRow", parseInt(e.target.value))}
              className="bg-secondary text-foreground rounded px-2 py-1 text-sm font-mono border border-border"
            >
              {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <button
            onClick={reset}
            className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            title="Reset composition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>

        {/* Grid */}
        <ComposerGrid
          rows={state.rows}
          beatsPerBar={state.beatsPerBar}
          barsPerRow={state.barsPerRow}
          onBeatChange={handleBeatChange}
          onDeleteRow={deleteRow}
        />

        {/* Add row */}
        <button
          onClick={addRow}
          className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Add row
        </button>
      </div>
    </div>
  );
};

export default Index;
