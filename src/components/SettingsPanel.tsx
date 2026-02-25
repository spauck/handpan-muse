import { useState, useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Settings, X, Plus } from "lucide-react";
import { useSettings, type KeyboardKey } from "@/lib/settings";
import { IconNote, getAllIconNames } from "./IconNote";
import { Input } from "@/components/ui/input";

const COLOR_PRESETS = [
  { label: "Red", hsl: "0 70% 58%" },
  { label: "Green", hsl: "140 60% 45%" },
  { label: "Blue", hsl: "210 80% 60%" },
  { label: "Neutral", hsl: "220 10% 55%" },
] as const;

export function SettingsPanel() {
  const { settings, updateSettings } = useSettings();
  const [addMode, setAddMode] = useState<"number" | "icon">("number");
  const [numberInput, setNumberInput] = useState("");
  const [iconSearch, setIconSearch] = useState("");

  const allIcons = useMemo(() => getAllIconNames(), []);
  const filteredIcons = useMemo(() => {
    if (!iconSearch.trim()) return allIcons.slice(0, 50);
    const q = iconSearch.toLowerCase();
    return allIcons.filter(n => n.includes(q)).slice(0, 50);
  }, [iconSearch, allIcons]);

  const removeKey = (idx: number) => {
    const keys = settings.keyboardKeys.filter((_, i) => i !== idx);
    updateSettings({ ...settings, keyboardKeys: keys });
  };

  const addNumberKey = () => {
    const v = numberInput.trim();
    if (!v) return;
    updateSettings({
      ...settings,
      keyboardKeys: [...settings.keyboardKeys, { type: "number", value: v }],
    });
    setNumberInput("");
  };

  const addIconKey = (name: string) => {
    updateSettings({
      ...settings,
      keyboardKeys: [...settings.keyboardKeys, { type: "icon", value: name }],
    });
    setIconSearch("");
  };

  const setColor = (hand: "rightHandColor" | "leftHandColor", hsl: string) => {
    updateSettings({ ...settings, [hand]: hsl });
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors" title="Settings">
          <Settings className="w-4 h-4" />
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Settings</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Colors */}
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-3">Hand Colors</h3>
            <div className="space-y-3">
              {(["rightHandColor", "leftHandColor"] as const).map(hand => (
                <div key={hand} className="space-y-1.5">
                  <span className="text-sm text-muted-foreground">{hand === "rightHandColor" ? "Right Hand" : "Left Hand"}</span>
                  <div className="flex gap-1.5">
                    {COLOR_PRESETS.map(preset => {
                      const isActive = settings[hand] === preset.hsl;
                      return (
                        <button
                          key={preset.label}
                          onClick={() => setColor(hand, preset.hsl)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs border transition-colors ${
                            isActive
                              ? "border-ring bg-accent text-foreground font-semibold"
                              : "border-border text-muted-foreground hover:text-foreground hover:border-ring/50"
                          }`}
                        >
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: `hsl(${preset.hsl})` }}
                          />
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* PanScript Fields */}
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-3">PanScript Tone Fields</h3>
            <p className="text-xs text-muted-foreground mb-2">Number of tone fields on your handpan (excluding ding)</p>
            <select
              value={settings.panscriptFields}
              onChange={(e) => updateSettings({ ...settings, panscriptFields: parseInt(e.target.value) })}
              className="bg-secondary text-foreground rounded px-2 py-1 text-sm font-mono border border-border"
            >
              {[7, 8, 9, 10, 11, 12].map(n => (
                <option key={n} value={n}>{n} ({n}+1)</option>
              ))}
            </select>
          </section>

          {/* Keyboard Keys */}
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-3">Keyboard Keys</h3>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {settings.keyboardKeys.map((key, i) => (
                <div key={i} className="flex items-center gap-1 bg-secondary rounded px-2 py-1 text-sm border border-border">
                  {key.type === "icon" ? (
                    <IconNote name={key.value} size={14} />
                  ) : (
                    <span className="font-mono">{key.value}</span>
                  )}
                  <button onClick={() => removeKey(i)} className="text-muted-foreground hover:text-destructive ml-0.5">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>

            {/* Add key */}
            <div className="space-y-3">
              <div className="flex gap-2">
                <button
                  onClick={() => setAddMode("number")}
                  className={`text-xs px-3 py-1 rounded ${addMode === "number" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
                >
                  Number
                </button>
                <button
                  onClick={() => setAddMode("icon")}
                  className={`text-xs px-3 py-1 rounded ${addMode === "icon" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
                >
                  Icon
                </button>
              </div>

              {addMode === "number" ? (
                <div className="flex gap-2">
                  <Input
                    value={numberInput}
                    onChange={(e) => setNumberInput(e.target.value)}
                    placeholder="e.g. 10"
                    className="h-8 text-sm"
                    onKeyDown={(e) => e.key === "Enter" && addNumberKey()}
                  />
                  <button onClick={addNumberKey} className="shrink-0 h-8 px-3 bg-primary text-primary-foreground rounded text-sm flex items-center gap-1">
                    <Plus size={14} /> Add
                  </button>
                </div>
              ) : (
                <div>
                  <Input
                    value={iconSearch}
                    onChange={(e) => setIconSearch(e.target.value)}
                    placeholder="Search icons..."
                    className="h-8 text-sm mb-2"
                  />
                  <div className="grid grid-cols-6 gap-1 max-h-48 overflow-y-auto">
                    {filteredIcons.map((name) => (
                      <button
                        key={name}
                        onClick={() => addIconKey(name)}
                        className="flex flex-col items-center gap-0.5 p-1.5 rounded hover:bg-accent text-foreground transition-colors"
                        title={name}
                      >
                        <IconNote name={name} size={16} />
                        <span className="text-[8px] text-muted-foreground truncate w-full text-center">{name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
