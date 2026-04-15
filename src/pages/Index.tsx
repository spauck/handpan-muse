import {
  Download,
  Eye,
  FilePlus,
  FolderOpen,
  Infinity as InfinityLucide,
  Link,
  Menu,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Upload,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { ComposerGrid } from "@/components/ComposerGrid";
import { CompositionManager } from "@/components/CompositionManager";
import { PositionKeyboard } from "@/components/PositionKeyboard";
import { SettingsPanel } from "@/components/SettingsPanel";
import {
  type Beat,
  type ComposerState,
  createEmptyRow,
  decodeState,
  encodeState,
  type Hand,
} from "@/lib/composer-state";
import {
  applyColorVars,
  loadSettings,
  type Settings,
  SettingsContext,
  saveSettings,
} from "@/lib/settings";
import { applyTheme, loadTheme } from "@/lib/theme";

interface SelectedCell {
  rowIdx: number;
  beatIdx: number;
}

const AUTOSAVE_KEY = "handpan-composer-autosave";
const AUTOSAVE_INTERVAL = 3000;

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // On first load, restore from autosave if URL has no composition
  const initialQuery = useMemo(() => {
    const urlQuery = window.location.search.slice(1);
    if (urlQuery) return urlQuery;
    try {
      const saved = localStorage.getItem(AUTOSAVE_KEY);
      if (saved) return saved;
    } catch {}
    return "";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasRestoredRef = useRef(false);
  useEffect(() => {
    if (!hasRestoredRef.current && initialQuery && !searchParams.toString()) {
      hasRestoredRef.current = true;
      setSearchParams(initialQuery, { replace: true });
    }
  }, [initialQuery, searchParams, setSearchParams]);

  const state = useMemo(
    () => decodeState(searchParams.toString()),
    [searchParams],
  );
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null);
  const [viewMode, setViewMode] = useState(false);
  const [loadedName, setLoadedName] = useState<string | null>(null);
  const [lastSavedQuery, setLastSavedQuery] = useState<string | null>(null);

  // Auto-save to localStorage every few seconds
  const lastAutoSavedRef = useRef("");
  useEffect(() => {
    const timer = setInterval(() => {
      const q = encodeState(state);
      if (q && q !== lastAutoSavedRef.current) {
        localStorage.setItem(AUTOSAVE_KEY, q);
        lastAutoSavedRef.current = q;
      }
    }, AUTOSAVE_INTERVAL);
    return () => clearInterval(timer);
  }, [state]);

  const currentQuery = encodeState(state);
  const hasUnsavedChanges =
    lastSavedQuery !== null
      ? currentQuery !== lastSavedQuery
      : searchParams.toString() !== "";

  const handleLoad = useCallback(
    (queryString: string, name: string) => {
      setSearchParams(queryString, { replace: true });
      setLoadedName(name);
      setLastSavedQuery(queryString);
      setSelectedCell(null);
    },
    [setSearchParams],
  );

  const handleSaved = useCallback(
    (name: string) => {
      setLoadedName(name);
      setLastSavedQuery(encodeState(state));
    },
    [state],
  );

  useEffect(() => {
    applyTheme(loadTheme());
    applyColorVars(settings);
  }, [settings]);

  const handleUpdateSettings = useCallback((s: Settings) => {
    setSettings(s);
    saveSettings(s);
    applyColorVars(s);
  }, []);

  const updateState = useCallback(
    (newState: ComposerState) => {
      setSearchParams(encodeState(newState), { replace: true });
    },
    [setSearchParams],
  );

  const activeNotes = useMemo<Array<{ value: string; hand: Hand }>>(() => {
    if (!selectedCell) return [];
    return state.rows[selectedCell.rowIdx]?.[selectedCell.beatIdx] ?? [];
  }, [selectedCell, state]);

  const handleAssignNote = useCallback(
    (value: string, hand: Hand) => {
      if (!selectedCell) return;
      const { rowIdx, beatIdx } = selectedCell;
      const totalBeats = state.beatsPerBar * state.barsPerRow;

      const newRows = state.rows.map((row, ri): Beat[] => {
        if (ri !== rowIdx) return row;
        return row.map((beat, bi): Beat => {
          if (bi !== beatIdx) return beat;
          return [...beat.filter((n) => n.value !== value), { value, hand }];
        });
      });

      const wasEmpty = activeNotes.length === 0;
      updateState({ ...state, rows: newRows });

      if (wasEmpty && beatIdx + 1 < totalBeats) {
        setSelectedCell({ rowIdx, beatIdx: beatIdx + 1 });
      }
    },
    [selectedCell, state, updateState, activeNotes],
  );

  const handleRemoveNote = useCallback(
    (value: string) => {
      if (!selectedCell) return;
      const { rowIdx, beatIdx } = selectedCell;
      const newRows = state.rows.map((row, ri): Beat[] => {
        if (ri !== rowIdx) return row;
        return row.map((beat, bi): Beat => {
          if (bi !== beatIdx) return beat;
          return beat.filter((n) => n.value !== value);
        });
      });
      updateState({ ...state, rows: newRows });
    },
    [selectedCell, state, updateState],
  );

  const handleClearAll = useCallback(() => {
    if (!selectedCell) return;
    const { rowIdx, beatIdx } = selectedCell;
    const newRows = state.rows.map((row, ri): Beat[] => {
      if (ri !== rowIdx) return row;
      return row.map((beat, bi): Beat => {
        if (bi !== beatIdx) return beat;
        return [];
      });
    });
    updateState({ ...state, rows: newRows });
  }, [selectedCell, state, updateState]);

  const handleSetBeat = useCallback(
    (beat: Beat) => {
      if (!selectedCell) return;
      const { rowIdx, beatIdx } = selectedCell;
      const totalBeats = state.beatsPerBar * state.barsPerRow;
      const newRows = state.rows.map((row, ri): Beat[] => {
        if (ri !== rowIdx) return row;
        return row.map((b, bi): Beat => (bi !== beatIdx ? b : beat));
      });
      const wasEmpty = activeNotes.length === 0;
      updateState({ ...state, rows: newRows });
      if (wasEmpty && beatIdx + 1 < totalBeats) {
        setSelectedCell({ rowIdx, beatIdx: beatIdx + 1 });
      }
    },
    [selectedCell, state, updateState, activeNotes],
  );

  const addRow = useCallback(() => {
    updateState({
      ...state,
      rows: [
        ...state.rows,
        createEmptyRow(state.beatsPerBar, state.barsPerRow),
      ],
    });
  }, [state, updateState]);

  const deleteRow = useCallback(
    (idx: number) => {
      if (state.rows.length <= 1) return;
      updateState({ ...state, rows: state.rows.filter((_, i) => i !== idx) });
      if (selectedCell?.rowIdx === idx) setSelectedCell(null);
    },
    [state, updateState, selectedCell],
  );

  const handleConfigChange = useCallback(
    (field: "beatsPerBar" | "barsPerRow" | "notesPerCount", val: number) => {
      if (val < 1 || val > 16) return;
      const newState = { ...state, [field]: val };
      if (field !== "notesPerCount") {
        const totalBeats = newState.beatsPerBar * newState.barsPerRow;
        newState.rows = newState.rows.map((row) =>
          Array.from({ length: totalBeats }, (_, i): Beat => row[i] ?? []),
        );
      }
      updateState(newState);
    },
    [state, updateState],
  );

  const reset = useCallback(() => {
    setSearchParams("", { replace: true });
    setSelectedCell(null);
    setLoadedName(null);
    setLastSavedQuery(null);
    localStorage.removeItem(AUTOSAVE_KEY);
    lastAutoSavedRef.current = "";
  }, [setSearchParams]);

  const startFresh = useCallback(() => {
    reset();
  }, [reset]);

  const shareUrl = useCallback(() => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(
      () => toast.success("Link copied to clipboard!"),
      () => toast.error("Failed to copy link"),
    );
  }, []);

  const toggleViewMode = useCallback(() => {
    setViewMode((v) => {
      if (!v) setSelectedCell(null);
      return !v;
    });
  }, []);

  return (
    <SettingsContext.Provider
      value={{ settings, updateSettings: handleUpdateSettings }}
    >
      <div
        className={`min-h-screen bg-background p-3 sm:p-6 ${selectedCell && !viewMode ? "pb-28" : ""}`}
      >
        <div className="mx-auto">
          {/* Header */}
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                Note
                <InfinityLucide className="inline" size={40} />
              </h1>
              {!viewMode && (
                <p className="text-sm text-muted-foreground mt-1">
                  Tap a cell, pick a position ·{" "}
                  <span className="text-hand-right">R</span> ·{" "}
                  <span className="text-hand-left">L</span> ·{" "}
                  <span className="text-hand-any">A</span> ·{" "}
                  <span className="text-hand-none">N</span>
                </p>
              )}
              {!viewMode && loadedName && (
                <span className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {loadedName}
                  </span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {!viewMode && (
                <>
                  <button
                    type="button"
                    onClick={startFresh}
                    className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded transition-colors border text-muted-foreground hover:text-foreground border-border hover:border-primary/50"
                    title="Start a new composition"
                  >
                    <FilePlus className="w-3.5 h-3.5" />
                    New
                  </button>
                  <button
                    type="button"
                    onClick={shareUrl}
                    className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded transition-colors border text-muted-foreground hover:text-foreground border-border hover:border-primary/50"
                    title="Copy shareable link"
                  >
                    <Link className="w-3.5 h-3.5" />
                    Share
                  </button>
                  <CompositionManager
                    state={state}
                    loadedName={loadedName}
                    onLoad={handleLoad}
                    hasUnsavedChanges={hasUnsavedChanges}
                    onSaved={handleSaved}
                  />
                </>
              )}
              <button
                type="button"
                className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded transition-colors border ${
                  viewMode
                    ? "bg-primary text-primary-foreground border-primary"
                    : "text-muted-foreground hover:text-foreground border-border hover:border-primary/50"
                }`}
                title={viewMode ? "Switch to edit mode" : "Switch to view mode"}
                onClick={toggleViewMode}
              >
                {viewMode ? (
                  <Pencil className="w-3.5 h-3.5" />
                ) : (
                  <Eye className="w-3.5 h-3.5" />
                )}
                {viewMode ? "Edit" : "View"}
              </button>
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
                  onChange={(e) =>
                    handleConfigChange(
                      "beatsPerBar",
                      parseInt(e.target.value, 10),
                    )
                  }
                  className="bg-secondary text-foreground rounded px-2 py-1 text-sm font-mono border border-border"
                >
                  {[2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2 text-sm text-secondary-foreground">
                <span className="text-muted-foreground">Bars/row</span>
                <select
                  value={state.barsPerRow}
                  onChange={(e) =>
                    handleConfigChange(
                      "barsPerRow",
                      parseInt(e.target.value, 10),
                    )
                  }
                  className="bg-secondary text-foreground rounded px-2 py-1 text-sm font-mono border border-border"
                >
                  {[1, 2, 3, 4].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2 text-sm text-secondary-foreground">
                <span className="text-muted-foreground">Notes/count</span>
                <select
                  value={state.notesPerCount}
                  onChange={(e) =>
                    handleConfigChange(
                      "notesPerCount",
                      parseInt(e.target.value, 10),
                    )
                  }
                  className="bg-secondary text-foreground rounded px-2 py-1 text-sm font-mono border border-border"
                >
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
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
            notesPerCount={state.notesPerCount}
            viewMode={viewMode}
            selectedCell={selectedCell}
            onSelectCell={setSelectedCell}
            onDeleteRow={deleteRow}
          />

          {!viewMode && (
            <button
              type="button"
              onClick={addRow}
              className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              Add row
            </button>
          )}
        </div>
      </div>

      {!viewMode && (
        <PositionKeyboard
          selectedCell={selectedCell}
          activeNotes={activeNotes}
          rows={state.rows}
          onAssignNote={handleAssignNote}
          onRemoveNote={handleRemoveNote}
          onClearAll={handleClearAll}
          onSetBeat={handleSetBeat}
        />
      )}
    </SettingsContext.Provider>
  );
};

export default Index;
