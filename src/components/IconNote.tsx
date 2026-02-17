import React, { lazy, Suspense } from "react";
import type { LucideProps } from "lucide-react";
import dynamicIconImports from "lucide-react/dynamicIconImports";

interface IconNoteProps extends Omit<LucideProps, "ref"> {
  name: string;
}

const iconCache: Record<string, React.LazyExoticComponent<React.ComponentType<Omit<LucideProps, "ref">>>> = {};

function getIcon(name: string) {
  if (!(name in dynamicIconImports)) return null;
  if (!iconCache[name]) {
    iconCache[name] = lazy(dynamicIconImports[name as keyof typeof dynamicIconImports]);
  }
  return iconCache[name];
}

export function IconNote({ name, ...props }: IconNoteProps) {
  const Icon = getIcon(name);
  if (!Icon) return <span className="text-[8px]">{name}</span>;
  return (
    <Suspense fallback={<span className="w-3 h-3 bg-muted rounded" />}>
      <Icon {...props} />
    </Suspense>
  );
}

export function isValidIconName(name: string): boolean {
  return name in dynamicIconImports;
}

export function getAllIconNames(): string[] {
  return Object.keys(dynamicIconImports);
}
