import { createContext, useContext } from "react";

export interface Settings {
  rightHandColor: string;
  leftHandColor: string;
  anyHandColor: string;
  panscriptFields: number;
}

const DEFAULT_SETTINGS: Settings = {
  rightHandColor: "210 80% 60%",
  leftHandColor: "0 70% 58%",
  anyHandColor: "140 60% 45%",
  panscriptFields: 8,
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
