"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { SidebarNav, type SidebarSection } from "./sidebar-nav";
import { TopNav } from "./top-nav";

interface AppShellProps {
  activeSection: SidebarSection;
  personasEnabled: boolean;
  onNavigateStartResearch: () => void;
  onNavigatePersonas: () => void;
  onNavigateInterviewSimulator: () => void;
  children: ReactNode;
}

export function AppShell({
  activeSection,
  personasEnabled,
  onNavigateStartResearch,
  onNavigatePersonas,
  onNavigateInterviewSimulator,
  children,
}: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (sidebarOpen) {
      sidebarRef.current?.focus();
    }
  }, [sidebarOpen]);

  useEffect(() => {
    if (!sidebarOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeSidebar();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sidebarOpen]);

  function closeSidebar() {
    setSidebarOpen(false);
    toggleButtonRef.current?.focus();
  }

  function handleNavigate(action: () => void) {
    action();
    if (sidebarOpen) closeSidebar();
  }

  return (
    <div className="flex h-screen flex-col">
      <TopNav
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((open) => !open)}
        toggleButtonRef={toggleButtonRef}
      />
      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen ? (
          <div
            className="fixed inset-0 z-30 bg-slate-900/30 md:hidden"
            aria-hidden="true"
            onClick={closeSidebar}
          />
        ) : null}
        <div
          id="primary-sidebar"
          ref={sidebarRef}
          tabIndex={-1}
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-72 -translate-x-full border-r border-slate-200 bg-white transition-transform duration-200 motion-reduce:transition-none md:static md:z-auto md:w-64 md:translate-x-0",
            sidebarOpen && "translate-x-0"
          )}
        >
          <SidebarNav
            activeSection={activeSection}
            personasEnabled={personasEnabled}
            onNavigateStartResearch={() => handleNavigate(onNavigateStartResearch)}
            onNavigatePersonas={() => handleNavigate(onNavigatePersonas)}
            onNavigateInterviewSimulator={() => handleNavigate(onNavigateInterviewSimulator)}
          />
        </div>
        <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
