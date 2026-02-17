import { useState, useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Settings, X, Plus } from "lucide-react";
import { useSettings, type KeyboardKey } from "@/lib/settings";
import { IconNote, getAllIconNames } from "./IconNote";
import { Input } from "@/components/ui/input";

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

  // Convert HSL string to hex for color input
  const hslToHex = (hsl: string): string => {
    const parts = hsl.match(/[\d.]+/g);
    if (!parts || parts.length < 3) return "#4488cc";
    const h = parseFloat(parts[0]);
    const s = parseFloat(parts[1]) / 100;
    const l = parseFloat(parts[2]) / 100;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, "0");
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  };

  // Convert hex to HSL string
  const hexToHsl = (hex: string): string => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const l = (max + min) / 2;
    if (max === min) return `0 0% ${Math.round(l * 100)}%`;
    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    let h = 0;
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
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
              <label className="flex items-center gap-3">
                <input
                  type="color"
                  value={hslToHex(settings.rightHandColor)}
                  onChange={(e) => setColor("rightHandColor", hexToHsl(e.target.value))}
                  className="w-8 h-8 rounded cursor-pointer border border-border"
                />
                <span className="text-sm" style={{ color: `hsl(${settings.rightHandColor})` }}>Right Hand</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="color"
                  value={hslToHex(settings.leftHandColor)}
                  onChange={(e) => setColor("leftHandColor", hexToHsl(e.target.value))}
                  className="w-8 h-8 rounded cursor-pointer border border-border"
                />
                <span className="text-sm" style={{ color: `hsl(${settings.leftHandColor})` }}>Left Hand</span>
              </label>
            </div>
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
