import { decodeState, encodeState } from "./composer-state";

export interface SavedComposition {
  name: string;
  queryString: string;
  savedAt: number;
}

const STORAGE_KEY = "handpan-composer-saved";

export function listSavedCompositions(): SavedComposition[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedComposition[];
  } catch {
    return [];
  }
}

export function saveComposition(name: string, queryString: string): void {
  const list = listSavedCompositions();
  const idx = list.findIndex((c) => c.name === name);
  const entry: SavedComposition = { name, queryString, savedAt: Date.now() };
  if (idx >= 0) {
    list[idx] = entry;
  } else {
    list.push(entry);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function deleteComposition(name: string): void {
  const list = listSavedCompositions().filter((c) => c.name !== name);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function compositionExists(name: string): boolean {
  return listSavedCompositions().some((c) => c.name === name);
}

export function exportAllCompositions(): string {
  return JSON.stringify(listSavedCompositions(), null, 2);
}

export function importCompositions(json: string, overwrite = false): number {
  const incoming = JSON.parse(json) as SavedComposition[];
  if (!Array.isArray(incoming)) throw new Error("Invalid format");
  const existing = listSavedCompositions();
  const map = new Map(existing.map((c) => [c.name, c]));
  let count = 0;
  for (const comp of incoming) {
    if (!comp.name || !comp.queryString) continue;
    if (!map.has(comp.name) || overwrite) {
      // Re-encode to ensure compatibility with current version
      map.set(comp.name, {
        ...comp,
        queryString: encodeState(decodeState(comp.queryString)),
      });
      count++;
    }
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(map.values())));
  return count;
}
