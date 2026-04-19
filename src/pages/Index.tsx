import {
  Download,
  Eye,
  FilePlus,
  FolderOpen,
  Infinity as InfinityLucide,
  Link,
  Menu,
  Pencil,
  RotateCcw,
  Save,
  Upload,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { ComposerGrid } from "@/components/ComposerGrid";
import { CompositionManager } from "@/components/CompositionManager";
import { InfoDialog } from "@/components/InfoDialog";
import { PositionKeyboard } from "@/components/PositionKeyboard";
import { SettingsPanel } from "@/components/SettingsPanel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  type Bar,
  type Beat,
  type ComposerState,
  createEmptyBar,
  decodeState,
  encodeState,
  type Hand,
  nextBarLength,
  resizeBar,
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
  barIdx: number;
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

  const handleSelectCell = useCallback((cell: SelectedCell | null) => {
    setSelectedCell(cell);
  }, []);

  const [loadedName, setLoadedName] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("name") || null;
  });
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
      const params = new URLSearchParams(queryString);
      params.set("name", name);
      setSearchParams(params.toString(), { replace: true });
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

  const moveRow = useCallback(
    (rowIdx: number, direction: -1 | 1) => {
      const rowStarts: number[] = [];
      state.bars.forEach((bar, i) => {
        if (i === 0 || bar.breakBefore) rowStarts.push(i);
      });
      const targetIdx = rowIdx + direction;
      if (targetIdx < 0 || targetIdx >= rowStarts.length) return;

      const rowEnd = (idx: number) =>
        idx + 1 < rowStarts.length ? rowStarts[idx + 1] : state.bars.length;

      const aIdx = Math.min(rowIdx, targetIdx);
      const bIdx = Math.max(rowIdx, targetIdx);
      const aStart = rowStarts[aIdx];
      const aEnd = rowEnd(aIdx);
      const bStart = rowStarts[bIdx];
      const bEnd = rowEnd(bIdx);

      const before = state.bars.slice(0, aStart);
      const rowA = state.bars.slice(aStart, aEnd);
      const rowB = state.bars.slice(bStart, bEnd);
      const after = state.bars.slice(bEnd);

      const swapped = [...before, ...rowB, ...rowA, ...after].map(
        (bar, i): Bar => {
          // First bar overall, and the first bar of each swapped chunk,
          // need breakBefore=true to preserve row boundaries.
          if (
            i === 0 ||
            i === before.length ||
            i === before.length + rowB.length
          ) {
            return { ...bar, breakBefore: true };
          }
          return bar;
        },
      );
      updateState({ ...state, bars: swapped });
      setSelectedCell(null);
    },
    [state, updateState],
  );

  const duplicateRow = useCallback(
    (rowIdx: number) => {
      const rowStarts: number[] = [];
      state.bars.forEach((bar, i) => {
        if (i === 0 || bar.breakBefore) rowStarts.push(i);
      });
      const start = rowStarts[rowIdx];
      const end =
        rowIdx + 1 < rowStarts.length
          ? rowStarts[rowIdx + 1]
          : state.bars.length;
      const rowBars = state.bars.slice(start, end);
      // Deep clone beats so the duplicate is independent.
      const cloned: Bar[] = rowBars.map((bar, i) => ({
        breakBefore: i === 0 ? true : bar.breakBefore,
        beats: bar.beats.map((beat) => beat.map((n) => ({ ...n }))),
      }));
      const newBars = [
        ...state.bars.slice(0, end),
        ...cloned,
        ...state.bars.slice(end),
      ];
      updateState({ ...state, bars: newBars });
    },
    [state, updateState],
  );

  const deleteRow = useCallback(
    (rowIdx: number) => {
      const rowStarts: number[] = [];
      state.bars.forEach((bar, i) => {
        if (i === 0 || bar.breakBefore) rowStarts.push(i);
      });
      const start = rowStarts[rowIdx];
      const end =
        rowIdx + 1 < rowStarts.length
          ? rowStarts[rowIdx + 1]
          : state.bars.length;
      // Don't allow deleting the only row.
      if (end - start >= state.bars.length) return;
      const newBars = state.bars
        .slice(0, start)
        .concat(state.bars.slice(end))
        .map((bar, i): Bar =>
          i === 0 ? { ...bar, breakBefore: true } : bar,
        );
      updateState({ ...state, bars: newBars });
      if (selectedCell) {
        if (selectedCell.barIdx >= start && selectedCell.barIdx < end) {
          setSelectedCell(null);
        } else if (selectedCell.barIdx >= end) {
          setSelectedCell({
            ...selectedCell,
            barIdx: selectedCell.barIdx - (end - start),
          });
        }
      }
    },
    [state, updateState, selectedCell],
  );

  const activeNotes = useMemo<Array<{ value: string; hand: Hand }>>(() => {
    if (!selectedCell) return [];
    return state.bars[selectedCell.barIdx]?.beats[selectedCell.beatIdx] ?? [];
  }, [selectedCell, state]);

  const mapSelectedBeat = useCallback(
    (transform: (beat: Beat) => Beat): Bar[] => {
      if (!selectedCell) return state.bars;
      const { barIdx, beatIdx } = selectedCell;
      return state.bars.map((bar, bi): Bar => {
        if (bi !== barIdx) return bar;
        return {
          ...bar,
          beats: bar.beats.map(
            (beat, idx): Beat => (idx !== beatIdx ? beat : transform(beat)),
          ),
        };
      });
    },
    [selectedCell, state.bars],
  );

  const advanceSelection = useCallback(() => {
    if (!selectedCell) return;
    const { barIdx, beatIdx } = selectedCell;
    const bar = state.bars[barIdx];
    if (!bar) return;
    if (beatIdx + 1 < bar.beats.length) {
      setSelectedCell({ barIdx, beatIdx: beatIdx + 1 });
    } else if (barIdx + 1 < state.bars.length) {
      setSelectedCell({ barIdx: barIdx + 1, beatIdx: 0 });
    }
  }, [selectedCell, state.bars]);

  const handleAssignNote = useCallback(
    (value: string, hand: Hand) => {
      if (!selectedCell) return;
      const wasEmpty = activeNotes.length === 0;
      const newBars = mapSelectedBeat((beat) => [
        ...beat.filter((n) => n.value !== value),
        { value, hand },
      ]);
      updateState({ ...state, bars: newBars });
      if (wasEmpty) advanceSelection();
    },
    [
      selectedCell,
      state,
      updateState,
      activeNotes,
      mapSelectedBeat,
      advanceSelection,
    ],
  );

  const handleRemoveNote = useCallback(
    (value: string) => {
      if (!selectedCell) return;
      const newBars = mapSelectedBeat((beat) =>
        beat.filter((n) => n.value !== value),
      );
      updateState({ ...state, bars: newBars });
    },
    [selectedCell, state, updateState, mapSelectedBeat],
  );

  const handleClearAll = useCallback(() => {
    if (!selectedCell) return;
    const newBars = mapSelectedBeat(() => []);
    updateState({ ...state, bars: newBars });
  }, [selectedCell, state, updateState, mapSelectedBeat]);

  const handleSetBeat = useCallback(
    (beat: Beat) => {
      if (!selectedCell) return;
      const wasEmpty = activeNotes.length === 0;
      const newBars = mapSelectedBeat(() => beat);
      updateState({ ...state, bars: newBars });
      if (wasEmpty) advanceSelection();
    },
    [
      selectedCell,
      state,
      updateState,
      activeNotes,
      mapSelectedBeat,
      advanceSelection,
    ],
  );

  const addBar = useCallback(
    (position: number, currentBar: Bar, where: "before" | "after") => {
      const length = nextBarLength(state.bars);
      const newBar = createEmptyBar(
        length,
        where === "before" && currentBar.breakBefore,
      );
      const replacementBar = {
        ...currentBar,
        breakBefore: where === "after" && currentBar.breakBefore,
      };
      updateState({
        ...state,
        bars: [
          ...state.bars.slice(0, position),
          where === "before" ? newBar : replacementBar,
          where === "after" ? newBar : replacementBar,
          ...state.bars.slice(position + 1),
        ],
      });
    },
    [state, updateState],
  );

  const deleteBar = useCallback(
    (idx: number) => {
      if (state.bars.length <= 1) return;
      const breakBefore = state.bars[idx].breakBefore;
      const newBars = state.bars
        .filter((_, i) => i !== idx)
        .map(
          (bar, i): Bar =>
            i === 0 || (i === idx && breakBefore)
              ? { ...bar, breakBefore: true }
              : bar,
        );
      updateState({ ...state, bars: newBars });
      if (selectedCell?.barIdx === idx) setSelectedCell(null);
      else if (selectedCell && selectedCell.barIdx > idx)
        setSelectedCell({
          ...selectedCell,
          barIdx: selectedCell.barIdx - 1,
        });
    },
    [state, updateState, selectedCell],
  );

  const changeBarLength = useCallback(
    (idx: number, delta: number) => {
      const bar = state.bars[idx];
      if (!bar) return;
      const newLen = bar.beats.length + delta;
      if (newLen < 1 || newLen > 32) return;
      const newBars = state.bars.map((b, i) =>
        i === idx ? resizeBar(b, newLen) : b,
      );
      updateState({ ...state, bars: newBars });
      if (selectedCell?.barIdx === idx && selectedCell.beatIdx >= newLen) {
        setSelectedCell({ barIdx: idx, beatIdx: newLen - 1 });
      }
    },
    [state, updateState, selectedCell],
  );

  const setBreak = useCallback(
    (idx: number, breakBefore: boolean) => {
      if (idx === 0) return; // first bar always starts a row
      const newBars = state.bars.map((b, i) =>
        i === idx ? { ...b, breakBefore } : b,
      );
      updateState({ ...state, bars: newBars });
    },
    [state, updateState],
  );

  const handleNotesPerCountChange = useCallback(
    (val: number) => {
      if (val < 1 || val > 16) return;
      updateState({ ...state, notesPerCount: val });
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
    const url = new URL(window.location.href);
    if (loadedName) {
      url.searchParams.set("name", loadedName);
    } else {
      url.searchParams.delete("name");
    }
    navigator.clipboard.writeText(url.toString()).then(
      () => toast.success("Link copied to clipboard!"),
      () => toast.error("Failed to copy link"),
    );
  }, [loadedName]);

  const toggleViewMode = useCallback(() => {
    setViewMode((v) => {
      if (!v) setSelectedCell(null);
      return !v;
    });
  }, []);

  const compositionManager = CompositionManager({
    state,
    loadedName,
    onLoad: handleLoad,
    hasUnsavedChanges,
    onSaved: handleSaved,
  });

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
              {loadedName && (
                <span className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {loadedName}
                  </span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!viewMode && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded transition-colors border text-muted-foreground hover:text-foreground border-border hover:border-primary/50"
                    >
                      <Menu className="w-3.5 h-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem onClick={startFresh}>
                      <FilePlus className="w-3.5 h-3.5 mr-2" />
                      New
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={compositionManager.openSave}>
                      <Save className="w-3.5 h-3.5 mr-2" />
                      Save
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={compositionManager.openLoad}>
                      <FolderOpen className="w-3.5 h-3.5 mr-2" />
                      Load
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={shareUrl}>
                      <Link className="w-3.5 h-3.5 mr-2" />
                      Share
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={compositionManager.handleExport}>
                      <Download className="w-3.5 h-3.5 mr-2" />
                      Export
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={compositionManager.handleImport}>
                      <Upload className="w-3.5 h-3.5 mr-2" />
                      Import
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={reset}>
                      <RotateCcw className="w-3.5 h-3.5 mr-2" />
                      Reset
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
              <InfoDialog />
              {!viewMode && <SettingsPanel />}
            </div>
          </div>

          {/* Config */}
          {!viewMode && (
            <div className="flex flex-wrap items-center gap-4 mb-5 bg-card rounded-lg p-3 border border-border">
              <label className="flex items-center gap-2 text-sm text-secondary-foreground">
                <span className="text-muted-foreground">Notes/count</span>
                <select
                  value={state.notesPerCount}
                  onChange={(e) =>
                    handleNotesPerCountChange(parseInt(e.target.value, 10))
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
              <span className="text-xs text-muted-foreground">
                Bar length is configured per bar below.
              </span>
            </div>
          )}

          {/* Grid */}
          <ComposerGrid
            bars={state.bars}
            notesPerCount={state.notesPerCount}
            viewMode={viewMode}
            selectedCell={selectedCell}
            onSelectCell={handleSelectCell}
            onDeleteBar={deleteBar}
            onChangeBarLength={changeBarLength}
            onSetBreak={setBreak}
            onAddBar={addBar}
            onMoveRow={moveRow}
            onDuplicateRow={duplicateRow}
            onDeleteRow={deleteRow}
          />
        </div>
      </div>

      {!viewMode && (
        <PositionKeyboard
          selectedCell={selectedCell}
          activeNotes={activeNotes}
          bars={state.bars}
          onAssignNote={handleAssignNote}
          onRemoveNote={handleRemoveNote}
          onClearAll={handleClearAll}
          onSetBeat={handleSetBeat}
        />
      )}
      {compositionManager.dialogs}
    </SettingsContext.Provider>
  );
};

export default Index;
