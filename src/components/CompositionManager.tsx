import { Download, FolderOpen, Save, Trash2, Upload } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { type ComposerState, encodeState } from "@/lib/composer-state";
import {
  compositionExists,
  deleteComposition,
  listSavedCompositions,
  type SavedComposition,
  saveComposition,
} from "@/lib/composition-storage";

interface Props {
  state: ComposerState;
  loadedName: string | null;
  onLoad: (queryString: string, name: string) => void;
  hasUnsavedChanges: boolean;
  onSaved: (name: string) => void;
}

export function CompositionManager({
  state,
  loadedName,
  onLoad,
  hasUnsavedChanges,
  onSaved,
}: Props) {
  /* ── Save dialog ── */
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [confirmOverwrite, setConfirmOverwrite] = useState(false);

  const openSave = useCallback(() => {
    setSaveName(loadedName ?? "");
    setSaveOpen(true);
  }, [loadedName]);

  const doSave = useCallback(() => {
    const trimmed = saveName.trim();
    if (!trimmed) return;
    // If overwriting a different name than the one we loaded, confirm
    if (compositionExists(trimmed) && trimmed !== loadedName) {
      setConfirmOverwrite(true);
      return;
    }
    saveComposition(trimmed, encodeState(state));
    onSaved(trimmed);
    setSaveOpen(false);
  }, [saveName, state, loadedName, onSaved]);

  const confirmAndSave = useCallback(() => {
    const trimmed = saveName.trim();
    saveComposition(trimmed, encodeState(state));
    onSaved(trimmed);
    setConfirmOverwrite(false);
    setSaveOpen(false);
  }, [saveName, state, onSaved]);

  /* ── Load dialog ── */
  const [loadOpen, setLoadOpen] = useState(false);
  const [compositions, setCompositions] = useState<SavedComposition[]>([]);
  const [pendingLoad, setPendingLoad] = useState<SavedComposition | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SavedComposition | null>(
    null,
  );

  const openLoad = useCallback(() => {
    setCompositions(listSavedCompositions());
    setLoadOpen(true);
  }, []);

  const handleLoadClick = useCallback(
    (comp: SavedComposition) => {
      if (hasUnsavedChanges) {
        setPendingLoad(comp);
      } else {
        onLoad(comp.queryString, comp.name);
        setLoadOpen(false);
      }
    },
    [hasUnsavedChanges, onLoad],
  );

  const confirmLoad = useCallback(() => {
    if (pendingLoad) {
      onLoad(pendingLoad.queryString, pendingLoad.name);
      setPendingLoad(null);
      setLoadOpen(false);
    }
  }, [pendingLoad, onLoad]);

  const confirmDelete = useCallback(() => {
    if (deleteTarget) {
      deleteComposition(deleteTarget.name);
      setCompositions(listSavedCompositions());
      setDeleteTarget(null);
    }
  }, [deleteTarget]);

  return (
    <>
      {/* Toolbar buttons */}
      <button
        type="button"
        onClick={openSave}
        className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded transition-colors border text-muted-foreground hover:text-foreground border-border hover:border-primary/50"
        title="Save composition"
      >
        <Save className="w-3.5 h-3.5" />
        Save
      </button>
      <button
        type="button"
        onClick={openLoad}
        className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded transition-colors border text-muted-foreground hover:text-foreground border-border hover:border-primary/50"
        title="Load composition"
      >
        <FolderOpen className="w-3.5 h-3.5" />
        Load
      </button>

      {/* ── Save dialog ── */}
      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Save Composition</DialogTitle>
            <DialogDescription>
              Enter a name for this composition.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            placeholder="My Composition"
            onKeyDown={(e) => {
              if (e.key === "Enter") doSave();
            }}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveOpen(false)}>
              Cancel
            </Button>
            <Button onClick={doSave} disabled={!saveName.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Overwrite confirmation ── */}
      <AlertDialog open={confirmOverwrite} onOpenChange={setConfirmOverwrite}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Overwrite "{saveName.trim()}"?</AlertDialogTitle>
            <AlertDialogDescription>
              A composition with this name already exists. Saving will replace
              it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAndSave}>
              Overwrite
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Load dialog ── */}
      <Dialog open={loadOpen} onOpenChange={setLoadOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Load Composition</DialogTitle>
            <DialogDescription>
              Select a saved composition to load.
            </DialogDescription>
          </DialogHeader>
          {compositions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No saved compositions yet.
            </p>
          ) : (
            <div className="max-h-60 overflow-y-auto space-y-1">
              {compositions.map((comp) => (
                <div
                  key={comp.name}
                  className="flex items-center justify-between px-3 py-2 rounded hover:bg-accent/50 transition-colors group"
                >
                  <button
                    type="button"
                    className="flex-1 text-left text-sm text-foreground"
                    onClick={() => handleLoadClick(comp)}
                  >
                    <span className="font-medium">{comp.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {new Date(comp.savedAt).toLocaleDateString()}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(comp)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity p-1"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Confirm load over unsaved ── */}
      <AlertDialog
        open={!!pendingLoad}
        onOpenChange={(o) => {
          if (!o) setPendingLoad(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Loading a new composition will discard
              them.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmLoad}>
              Load anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Confirm delete ── */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => {
          if (!o) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This composition will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
