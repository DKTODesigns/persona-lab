import { cn } from "@/lib/cn";

function initialsFor(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0]!.slice(0, 2).toUpperCase();
  return `${words[0]!.charAt(0)}${words[words.length - 1]!.charAt(0)}`.toUpperCase();
}

// Deliberately a neutral initials avatar, never a photograph — nothing about
// a persona's appearance is known, so nothing should imply otherwise.
export function PersonaAvatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700",
        className
      )}
    >
      {initialsFor(name)}
    </span>
  );
}
