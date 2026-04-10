import type { Hand } from "@/lib/composer-state";

export const handColor = (hand: Hand | null | undefined) => {
  return `hsl(var(--hand-${hand ?? "none"}))`;
};
