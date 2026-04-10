import type { LucideIcon } from "lucide-react";
import { handColor } from "./handColor";
import type { BaseNoteProps } from "./Notes";

export function isIconNote(value: string): boolean {
  return value.startsWith("icon:");
}

interface IconNoteProps extends BaseNoteProps {
  size?: number | string;
  Icon: LucideIcon;
  strokeWidth?: number;
  className?: string;
}

export function IconNote({
  hand,
  size = 16,
  Icon,
  strokeWidth = 2,
  className,
}: IconNoteProps) {
  return (
    <Icon
      size={size}
      color={handColor(hand)}
      className={className}
      strokeWidth={strokeWidth}
    />
  );
}
