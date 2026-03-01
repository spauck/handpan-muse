import { useCallback, useMemo, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { ComposerGrid } from "@/components/ComposerGrid";
import { VirtualKeyboard } from "@/components/VirtualKeyboard";
import { PanScriptKeyboard } from "@/components/PanScriptKeyboard";
import { SettingsPanel } from "@/components/SettingsPanel";
import { CompositionManager } from "@/components/CompositionManager";
import { decodeState, encodeState, createEmptyRow, beatAllNotes, findNoteHand, handIndex, type ComposerState, type Beat, type Hand } from "@/lib/composer-state";
import { SettingsContext, loadSettings, saveSettings, applyColorVars, type Settings } from "@/lib/settings";
import { Plus, RotateCcw, Eye, Pencil, Music, Circle, ArrowLeftRight } from "lucide-react";

interface SelectedCell {
  rowIdx: number;
  beatIdx: number;
}

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const state = useMemo(() => decodeState(searchParams.toString()), [searchParams]);
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null);
  const [viewMode, setViewMode] = useState(false);
  const [loadedName, setLoadedName] = useState<string | null>(null);
  const [lastSavedQuery, setLastSavedQuery] = useState<string | null>(null);

  const currentQuery = encodeState(state);
  const hasUnsavedChanges = lastSavedQuery !== null ? currentQuery !== lastSavedQuery : searchParams.toString() !== "";

  const handleLoad = useCallback((queryString: string, name: string) => {
    setSearchParams(queryString, { replace: true });
    setLoadedName(name);
    setLastSavedQuery(queryString);
    setSelectedCell(null);
  }, [setSearchParams]);

  const handleSaved = useCallback((name: string) => {
    setLoadedName(name);
    setLastSavedQuery(encodeState(state));
  }, [state]);

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

  // Get all notes in the selected beat with hand info
  const activeNotes = useMemo<Array<{ value: string; hand: Hand }>>(() => {
    if (!selectedCell) return [];
    const beat = state.rows[selectedCell.rowIdx]?.[selectedCell.beatIdx];
    if (!beat) return [];
    return beatAllNotes(beat);
  }, [selectedCell, state]);

  // Assign a note to a specific hand (add or move)
  const handleAssignNote = useCallback((value: string, hand: Hand) => {
    if (!selectedCell) return;
    const { rowIdx, beatIdx } = selectedCell;
    const totalBeats = state.beatsPerBar * state.barsPerRow;

    const newRows = state.rows.map((row, ri): Beat[] => {
      if (ri !== rowIdx) return row;
      return row.map((beat, bi): Beat => {
        if (bi !== beatIdx) return beat;
        // Remove from all hands first
        const cleaned: Beat = [
          beat[0].filter(n => n !== value),
          beat[1].filter(n => n !== value),
          beat[2].filter(n => n !== value),
        ];
        // Add to target hand
        const hi = handIndex(hand);
        if (cleaned[hi].length < 3) {
          cleaned[hi] = [...cleaned[hi], value];
        }
        return cleaned;
      });
    });

    const wasEmpty = activeNotes.length === 0;
    updateState({ ...state, rows: newRows });

    if (wasEmpty && beatIdx + 1 < totalBeats) {
      setSelectedCell({ rowIdx, beatIdx: beatIdx + 1 });
    }
  }, [selectedCell, state, updateState, activeNotes]);

  // Remove a note from whichever hand it's in
  const handleRemoveNote = useCallback((value: string) => {
    if (!selectedCell) return;
    const { rowIdx, beatIdx } = selectedCell;

    const newRows = state.rows.map((row, ri): Beat[] => {
      if (ri !== rowIdx) return row;
      return row.map((beat, bi): Beat => {
        if (bi !== beatIdx) return beat;
        return [
          beat[0].filter(n => n !== value),
          beat[1].filter(n => n !== value),
          beat[2].filter(n => n !== value),
        ];
      });
    });
    updateState({ ...state, rows: newRows });
  }, [selectedCell, state, updateState]);

  const handleClearAll = useCallback(() => {
    if (!selectedCell) return;
    const { rowIdx, beatIdx } = selectedCell;
    const newRows = state.rows.map((row, ri): Beat[] => {
      if (ri !== rowIdx) return row;
      return row.map((beat, bi): Beat => {
        if (bi !== beatIdx) return beat;
        return [[], [], []];
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
        Array.from({ length: totalBeats }, (_, i): Beat => row[i] ?? [[], [], []])
      );
    }
    updateState(newState);
  }, [state, updateState]);

  const reset = useCallback(() => {
    setSearchParams("", { replace: true });
    setSelectedCell(null);
  }, [setSearchParams]);

  const handleTranslateNotes = useCallback(() => {
    const toPanscript = settings.noteMode === "standard";
    const newRows = state.rows.map(row =>
      row.map((beat): Beat => {
        const convert = (notes: string[]) =>
          notes.map(n => {
            if (n.startsWith("icon:")) return n;
            if (toPanscript) {
              const num = parseInt(n, 10);
              if (!isNaN(num) && num >= 0) return `p${num}`;
              return n;
            } else {
              if (n.startsWith("p")) {
                const num = parseInt(n.slice(1), 10);
                if (!isNaN(num)) return String(num);
              }
              return n;
            }
          });
        return [convert(beat[0]), convert(beat[1]), convert(beat[2])];
      })
    );
    const newMode = toPanscript ? "panscript" : "standard";
    handleUpdateSettings({ ...settings, noteMode: newMode });
    updateState({ ...state, rows: newRows });
  }, [settings, state, handleUpdateSettings, updateState]);

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
                  Tap a cell, pick a note, assign a hand · <span className="text-hand-right">R</span> · <span className="text-hand-left">L</span> · <span className="text-hand-any">A</span>
                </p>
              )}
              {!viewMode && loadedName && (
                <span className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{loadedName}</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {!viewMode && (
                <CompositionManager
                  state={state}
                  loadedName={loadedName}
                  onLoad={handleLoad}
                  hasUnsavedChanges={hasUnsavedChanges}
                  onSaved={handleSaved}
                />
              )}
              <button
                className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded transition-colors border ${
                  viewMode
                    ? "bg-primary text-primary-foreground border-primary"
                    : "text-muted-foreground hover:text-foreground border-border hover:border-primary/50"
                }`}
                title={viewMode ? "Switch to edit mode" : "Switch to view mode"}
                onClick={toggleViewMode}
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
              {!viewMode && (
                <button
                  onClick={handleTranslateNotes}
                  className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded transition-colors border text-muted-foreground hover:text-foreground border-border hover:border-primary/50"
                  title="Convert notes between standard and panscript"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  Translate
                </button>
              )}
              {!viewMode && <SettingsPanel />}
            </div>
          </div>

          {/* Config */}
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

      {!viewMode && settings.noteMode === "standard" && (
        <VirtualKeyboard
          selectedCell={selectedCell}
          activeNotes={activeNotes}
          onAssignNote={handleAssignNote}
          onRemoveNote={handleRemoveNote}
          onClearAll={handleClearAll}
        />
      )}
      {!viewMode && settings.noteMode === "panscript" && (
        <PanScriptKeyboard
          fields={settings.panscriptFields}
          selectedCell={selectedCell}
          activeNotes={activeNotes}
          onAssignNote={handleAssignNote}
          onRemoveNote={handleRemoveNote}
          onClearAll={handleClearAll}
        />
      )}
    </SettingsContext.Provider>
  );
};

export default Index;
