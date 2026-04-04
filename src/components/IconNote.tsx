import {
  Circle,
  CircleDashed,
  CircleDot,
  CircleSmall,
  Ghost,
  LoaderCircle,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  circle: Circle,
  ghost: Ghost,
  dash: CircleDashed,
  ding: CircleSmall,
  ding2: CircleDot,
  crescent: LoaderCircle,
};

export const ICON_NAMES = Object.keys(ICON_MAP);

export function isIconNote(value: string): boolean {
  return value.startsWith("icon:");
}

export function getIconName(value: string): string {
  return value.replace("icon:", "");
}

interface IconNoteProps {
  name: string;
  color?: string;
  size?: number | string;
  className?: string;
}

export function IconNote({ name, color, size = 16, className }: IconNoteProps) {
  const Icon = ICON_MAP[name];
  if (!Icon) return <span className={className}>?</span>;
  return (
    <Icon size={size} color={color} className={className} strokeWidth={2.5} />
  );
}
