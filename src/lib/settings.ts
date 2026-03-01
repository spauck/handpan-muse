import { createContext, useContext } from "react";

export type NoteMode = "standard" | "panscript";

export interface KeyboardKey {
  type: "number" | "icon";
  value: string;
}

export interface Settings {
  rightHandColor: string; // HSL like "210 80% 60%"
  leftHandColor: string;
  anyHandColor: string;
  keyboardKeys: KeyboardKey[];
  noteMode: NoteMode;
  panscriptFields: number;
}

const DEFAULT_SETTINGS: Settings = {
  rightHandColor: "210 80% 60%",
  leftHandColor: "0 70% 58%",
  anyHandColor: "140 60% 45%",
  noteMode: "standard",
  panscriptFields: 8,
  keyboardKeys: [
    { type: "number", value: "1" },
    { type: "number", value: "2" },
    { type: "number", value: "3" },
    { type: "number", value: "4" },
    { type: "number", value: "5" },
    { type: "number", value: "6" },
    { type: "number", value: "7" },
    { type: "number", value: "8" },
    { type: "number", value: "9" },
    { type: "icon", value: "circle" },
    { type: "icon", value: "ghost" },
    { type: "icon", value: "music" },
    { type: "icon", value: "star" },
    { type: "icon", value: "heart" },
    { type: "icon", value: "zap" },
  ],
};

const STORAGE_KEY = "handpan-settings";

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch {}
  return { ...DEFAULT_SETTINGS };
}

export function saveSettings(settings: Settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function applyColorVars(settings: Settings) {
  document.documentElement.style.setProperty("--hand-right", settings.rightHandColor);
  document.documentElement.style.setProperty("--hand-left", settings.leftHandColor);
  document.documentElement.style.setProperty("--hand-any", settings.anyHandColor);
}

export function noteDisplayValue(val: string): { type: "number" | "icon"; value: string } {
  if (val.startsWith("icon:")) {
    return { type: "icon", value: val.slice(5) };
  }
  return { type: "number", value: val };
}

export function noteStorageValue(key: KeyboardKey): string {
  return key.type === "icon" ? `icon:${key.value}` : key.value;
}

export function handColorClass(hand: "right" | "left" | "any"): string {
  if (hand === "right") return "text-hand-right";
  if (hand === "left") return "text-hand-left";
  return "text-hand-any";
}

interface SettingsContextValue {
  settings: Settings;
  updateSettings: (s: Settings) => void;
}

export const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  updateSettings: () => {},
});

export function useSettings() {
  return useContext(SettingsContext);
}

export { DEFAULT_SETTINGS };
