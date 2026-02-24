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
