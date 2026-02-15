import { useState, useRef, useEffect } from "react";

interface BeatCellProps {
  value: number | null;
  hand: "right" | "left";
  onChange: (val: number | null) => void;
}

export function BeatCell({ value, hand, onChange }: BeatCellProps) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commit = () => {
    setEditing(false);
    const trimmed = input.trim();
    if (trimmed === "" || trimmed === ".") {
      onChange(null);
    } else {
      const n = parseInt(trimmed);
      if (!isNaN(n)) onChange(n);
    }
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        className="w-7 h-7 sm:w-8 sm:h-8 text-center text-sm font-mono bg-secondary rounded border border-ring outline-none text-foreground"
        value={input}
        maxLength={2}
        onChange={(e) => setInput(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") setEditing(false);
        }}
      />
    );
  }

  const colorClass = hand === "right" ? "text-hand-right" : "text-hand-left";
  const isEmpty = value === null;

  return (
    <button
      className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-sm font-mono rounded transition-colors
        ${isEmpty ? "text-beat-empty hover:text-muted-foreground" : colorClass + " font-semibold"}
        hover:bg-secondary cursor-pointer select-none`}
      onClick={() => {
        setInput(value !== null ? String(value) : "");
        setEditing(true);
      }}
      title={`${hand === "right" ? "R" : "L"}: click to edit`}
    >
      {isEmpty ? "·" : value}
    </button>
  );
}
