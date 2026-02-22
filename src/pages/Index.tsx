import { useCallback, useMemo, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { ComposerGrid } from "@/components/ComposerGrid";
import { VirtualKeyboard } from "@/components/VirtualKeyboard";
import { PanScriptKeyboard } from "@/components/PanScriptKeyboard";
import { SettingsPanel } from "@/components/SettingsPanel";
import { decodeState, encodeState, createEmptyRow, type ComposerState, type Beat } from "@/lib/composer-state";
import { SettingsContext, loadSettings, saveSettings, applyColorVars, type Settings } from "@/lib/settings";
import { Plus, RotateCcw, Eye, Pencil, Music, Circle } from "lucide-react";

interface SelectedCell {
  rowIdx: number;
  beatIdx: number;
  hand: "right" | "left";
}

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const state = useMemo(() => decodeState(searchParams.toString()), [searchParams]);
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null);
  const [viewMode, setViewMode] = useState(false);

  useEffect(() => {
    applyColorVars(settings);
  }, [settings]);

  const handleUpdateSettings = useCallback((s: Settings) => {
    setSettings(s);
    saveSettings(s);
    applyColorVars(s);
  }, []);

  const updateState = useCallback((newState: ComposerState) => {
    setSearchParams(encodeState(newState), { replace: true });
  }, [setSearchParams]);

  // Get notes currently set in the selected cell
  const activeNotes = useMemo<string[]>(() => {
    if (!selectedCell) return [];
    const { rowIdx, beatIdx, hand } = selectedCell;
    const beat = state.rows[rowIdx]?.[beatIdx];
    if (!beat) return [];
    return hand === "right" ? beat[0] : beat[1];
  }, [selectedCell, state]);

  // Toggle a note in the selected cell; auto-advance if adding a note to a new cell
  const handleKeyPress = useCallback((value: string) => {
    if (!selectedCell) return;
    const { rowIdx, beatIdx, hand } = selectedCell;
    const totalBeats = state.beatsPerBar * state.barsPerRow;

    const newRows = state.rows.map((row, ri): Beat[] => {
      if (ri !== rowIdx) return row;
      return row.map((beat, bi): Beat => {
        if (bi !== beatIdx) return beat;
        const handNotes = hand === "right" ? beat[0] : beat[1];
        let updated: string[];
        if (handNotes.includes(value)) {
          updated = handNotes.filter(n => n !== value);
        } else if (handNotes.length < 3) {
          updated = [...handNotes, value];
        } else {
          return beat;
        }
        return hand === "right" ? [updated, beat[1]] : [beat[0], updated];
      });
    });

    const wasEmpty = activeNotes.length === 0;
    updateState({ ...state, rows: newRows });

    if (wasEmpty && beatIdx + 1 < totalBeats) {
      setSelectedCell({ rowIdx, beatIdx: beatIdx + 1, hand });
    }
  }, [selectedCell, state, updateState, activeNotes]);

  const handleClearAll = useCallback(() => {
    if (!selectedCell) return;
    const { rowIdx, beatIdx, hand } = selectedCell;
    const newRows = state.rows.map((row, ri): Beat[] => {
      if (ri !== rowIdx) return row;
      return row.map((beat, bi): Beat => {
        if (bi !== beatIdx) return beat;
        return hand === "right" ? [[], beat[1]] : [beat[0], []];
      });
    });
    updateState({ ...state, rows: newRows });
  }, [selectedCell, state, updateState]);

  const addRow = useCallback(() => {
    updateState({
      ...state,
      rows: [...state.rows, createEmptyRow(state.beatsPerBar, state.barsPerRow)],
    });
  }, [state, updateState]);

  const deleteRow = useCallback((idx: number) => {
    if (state.rows.length <= 1) return;
    updateState({ ...state, rows: state.rows.filter((_, i) => i !== idx) });
    if (selectedCell?.rowIdx === idx) setSelectedCell(null);
  }, [state, updateState, selectedCell]);

  const handleConfigChange = useCallback((field: "beatsPerBar" | "barsPerRow" | "notesPerCount", val: number) => {
    if (val < 1 || val > 16) return;
    const newState = { ...state, [field]: val };
    if (field !== "notesPerCount") {
      const totalBeats = newState.beatsPerBar * newState.barsPerRow;
      newState.rows = newState.rows.map(row =>
        Array.from({ length: totalBeats }, (_, i): Beat => row[i] ?? [[], []])
      );
    }
    updateState(newState);
  }, [state, updateState]);

  const reset = useCallback(() => {
    setSearchParams("", { replace: true });
    setSelectedCell(null);
  }, [setSearchParams]);

  const toggleViewMode = useCallback(() => {
    setViewMode(v => {
      if (!v) setSelectedCell(null);
      return !v;
    });
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings: handleUpdateSettings }}>
      <div className={`min-h-screen bg-background p-3 sm:p-6 ${selectedCell && !viewMode ? "pb-28" : ""}`}>
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                🪘 Handpan Composer
              </h1>
              {!viewMode && (
                <p className="text-sm text-muted-foreground mt-1">
                  Tap a cell, then use the keyboard below · <span className="text-hand-right">Right</span> · <span className="text-hand-left">Left</span> · Share via URL
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleViewMode}
                className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded transition-colors border ${
                  viewMode
                    ? "bg-primary text-primary-foreground border-primary"
                    : "text-muted-foreground hover:text-foreground border-border hover:border-primary/50"
                }`}
                title={viewMode ? "Switch to edit mode" : "Switch to view mode"}
              >
                {viewMode ? <Pencil className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {viewMode ? "Edit" : "View"}
              </button>
              {!viewMode && (
                <button
                  onClick={() => {
                    const newMode = settings.noteMode === "standard" ? "panscript" : "standard";
                    handleUpdateSettings({ ...settings, noteMode: newMode });
                  }}
                  className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded transition-colors border ${
                    settings.noteMode === "panscript"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "text-muted-foreground hover:text-foreground border-border hover:border-primary/50"
                  }`}
                  title={settings.noteMode === "panscript" ? "Switch to standard mode" : "Switch to PanScript mode"}
                >
                  {settings.noteMode === "panscript" ? <Music className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                  {settings.noteMode === "panscript" ? "Standard" : "PanScript"}
                </button>
              )}
              {!viewMode && <SettingsPanel />}
            </div>
          </div>

          {/* Config — hidden in view mode */}
          {!viewMode && (
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
              <label className="flex items-center gap-2 text-sm text-secondary-foreground">
                <span className="text-muted-foreground">Notes/count</span>
                <select
                  value={state.notesPerCount}
                  onChange={(e) => handleConfigChange("notesPerCount", parseInt(e.target.value))}
                  className="bg-secondary text-foreground rounded px-2 py-1 text-sm font-mono border border-border"
                >
                  {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n}</option>)}
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
          )}

          {/* Grid */}
          <ComposerGrid
            rows={state.rows}
            beatsPerBar={state.beatsPerBar}
            barsPerRow={state.barsPerRow}
            notesPerCount={state.notesPerCount}
            viewMode={viewMode}
            selectedCell={selectedCell}
            onSelectCell={setSelectedCell}
            onDeleteRow={deleteRow}
          />

          {/* Add row — hidden in view mode */}
          {!viewMode && (
            <button
              onClick={addRow}
              className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              Add row
            </button>
          )}
        </div>
      </div>

      {/* Virtual Keyboard — hidden in view mode */}
      {!viewMode && settings.noteMode === "standard" && (
        <VirtualKeyboard
          selectedCell={selectedCell}
          activeNotes={activeNotes}
          onKeyPress={handleKeyPress}
          onClearAll={handleClearAll}
        />
      )}
      {!viewMode && settings.noteMode === "panscript" && (
        <PanScriptKeyboard
          fields={settings.panscriptFields}
          selectedCell={selectedCell}
          activeNotes={activeNotes}
          onKeyPress={handleKeyPress}
          onClearAll={handleClearAll}
        />
      )}
    </SettingsContext.Provider>
  );
};

export default Index;
