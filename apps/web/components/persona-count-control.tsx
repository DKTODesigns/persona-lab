"use client";

import { useRef, type KeyboardEvent } from "react";
import { cn } from "@/lib/cn";

const OPTIONS = [1, 2, 3, 4, 5, 6];

interface PersonaCountControlProps {
  value: number;
  onChange: (next: number) => void;
  labelledBy: string;
}

// Accessible segmented control implemented as a WAI-ARIA radiogroup with
// roving tabindex: Tab enters/exits the group once, Left/Right/Home/End move
// and select within it.
export function PersonaCountControl({ value, onChange, labelledBy }: PersonaCountControlProps) {
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % OPTIONS.length;
    else if (event.key === "ArrowLeft") nextIndex = (index - 1 + OPTIONS.length) % OPTIONS.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = OPTIONS.length - 1;

    if (nextIndex === null) return;
    event.preventDefault();
    onChange(OPTIONS[nextIndex]!);
    buttonRefs.current[nextIndex]?.focus();
  }

  return (
    <div role="radiogroup" aria-labelledby={labelledBy} className="inline-flex overflow-hidden rounded-md border border-slate-300">
      {OPTIONS.map((option, index) => {
        const selected = option === value;
        return (
          <button
            key={option}
            ref={(el) => {
              buttonRefs.current[index] = el;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(option)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={cn(
              "border-r border-slate-300 px-4 py-2 text-base font-medium last:border-r-0 focus:outline-none focus-visible:relative focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700",
              selected ? "bg-blue-700 text-white" : "bg-white text-slate-700 hover:bg-slate-50"
            )}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
