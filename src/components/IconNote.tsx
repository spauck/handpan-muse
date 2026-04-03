import {
  Star, Heart, Circle, Triangle, Square, Zap, Music, Flame,
  Droplets, Wind, Sun, Moon, CloudRain, Sparkles, Ghost, Skull,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  star: Star,
  heart: Heart,
  circle: Circle,
  triangle: Triangle,
  square: Square,
  zap: Zap,
  music: Music,
  flame: Flame,
  droplets: Droplets,
  wind: Wind,
  sun: Sun,
  moon: Moon,
  rain: CloudRain,
  sparkles: Sparkles,
  ghost: Ghost,
  skull: Skull,
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
  return <Icon size={size} color={color} className={className} strokeWidth={2.5} />;
}
