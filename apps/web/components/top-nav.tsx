"use client";

import type { RefObject } from "react";
import { FOCUS_RING_CLASSES } from "@/lib/a11y";
import { cn } from "@/lib/cn";
import { BellIcon, MenuIcon, SearchIcon, UserIcon } from "./icons";

interface TopNavProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  toggleButtonRef: RefObject<HTMLButtonElement | null>;
}

const NAV_LINKS = ["Dashboard", "Projects", "Archive"];

export function TopNav({ sidebarOpen, onToggleSidebar, toggleButtonRef }: TopNavProps) {
  return (
    <header className="relative z-50 flex h-16 shrink-0 items-center gap-4 border-b border-slate-200 bg-white px-4 sm:px-6">
      <button
        ref={toggleButtonRef}
        type="button"
        onClick={onToggleSidebar}
        aria-expanded={sidebarOpen}
        aria-controls="primary-sidebar"
        aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        className={cn("rounded-md p-2 text-slate-600 hover:bg-slate-100 md:hidden", FOCUS_RING_CLASSES)}
      >
        <MenuIcon className="h-5 w-5" aria-hidden="true" />
      </button>

      <div className="flex min-w-0 flex-col leading-tight">
        <span className="truncate text-lg font-semibold tracking-tight text-slate-900">PersonaLab</span>
        <span className="truncate text-xs text-slate-500">Research Intelligence Platform</span>
      </div>

      <nav aria-label="Primary" className="ml-4 hidden items-center gap-1 lg:flex">
        {NAV_LINKS.map((label) => (
          <button
            key={label}
            type="button"
            disabled
            title={`${label} — not yet available`}
            className={cn(
              "rounded-md px-3 py-2 text-base font-medium text-slate-400 disabled:cursor-not-allowed",
              FOCUS_RING_CLASSES
            )}
          >
            {label}
          </button>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-2">
        <div className="relative hidden sm:block">
          <SearchIcon
            className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            disabled
            placeholder="Search projects (coming soon)"
            aria-label="Search projects (coming soon)"
            className="w-56 rounded-md border border-slate-300 bg-slate-50 py-2 pl-9 pr-3 text-base text-slate-400 placeholder:text-slate-400 disabled:cursor-not-allowed"
          />
        </div>
        <button
          type="button"
          disabled
          title="Notifications — not yet available"
          className={cn("rounded-md p-2 text-slate-400 disabled:cursor-not-allowed", FOCUS_RING_CLASSES)}
        >
          <BellIcon className="h-5 w-5" aria-hidden="true" />
          <span className="sr-only">Notifications (coming soon)</span>
        </button>
        <button
          type="button"
          disabled
          title="Profile — not yet available"
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-400 disabled:cursor-not-allowed",
            FOCUS_RING_CLASSES
          )}
        >
          <UserIcon className="h-5 w-5" aria-hidden="true" />
          <span className="sr-only">Profile (coming soon)</span>
        </button>
      </div>
    </header>
  );
}
