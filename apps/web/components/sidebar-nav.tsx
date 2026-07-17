"use client";

import { FOCUS_RING_CLASSES } from "@/lib/a11y";
import { cn } from "@/lib/cn";

export type SidebarSection = "start-research" | "personas";

interface SidebarNavProps {
  activeSection: SidebarSection;
  personasEnabled: boolean;
  onNavigateStartResearch: () => void;
  onNavigatePersonas: () => void;
}

const UPCOMING_MODULES = [
  "Interview Simulator",
  "Journey Mapping",
  "Accessibility Review",
  "Usability Analysis",
  "Research Synthesis",
  "Research Reports",
];

export function SidebarNav({
  activeSection,
  personasEnabled,
  onNavigateStartResearch,
  onNavigatePersonas,
}: SidebarNavProps) {
  return (
    <nav aria-label="Research modules" className="flex h-full flex-col gap-1 overflow-y-auto p-4">
      <SidebarItem label="Start Research" active={activeSection === "start-research"} onClick={onNavigateStartResearch} />
      <SidebarItem
        label="Personas"
        active={activeSection === "personas"}
        disabled={!personasEnabled}
        disabledHint="Generate personas to view results"
        onClick={onNavigatePersonas}
      />

      <div className="mt-6 border-t border-slate-200 pt-4">
        <p className="px-3 text-sm font-semibold uppercase tracking-wide text-slate-500">More modules</p>
        <ul className="mt-2 space-y-1">
          {UPCOMING_MODULES.map((label) => (
            <li key={label}>
              <button
                type="button"
                disabled
                title={`${label} — not yet available`}
                className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-base text-slate-400 disabled:cursor-not-allowed"
              >
                <span>{label}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                  Soon
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

function SidebarItem({
  label,
  active,
  disabled,
  disabledHint,
  onClick,
}: {
  label: string;
  active: boolean;
  disabled?: boolean;
  disabledHint?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-current={active ? "page" : undefined}
      title={disabled ? disabledHint : undefined}
      className={cn(
        "rounded-md px-3 py-2 text-left text-base font-medium transition-colors",
        FOCUS_RING_CLASSES,
        disabled
          ? "cursor-not-allowed text-slate-300"
          : active
            ? "bg-blue-50 text-blue-800"
            : "text-slate-700 hover:bg-slate-100"
      )}
    >
      {label}
    </button>
  );
}
