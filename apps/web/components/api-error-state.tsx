"use client";

import { useEffect, useRef } from "react";
import { AlertIcon } from "./icons";
import { Button } from "./ui/button";

interface ApiErrorStateProps {
  message: string;
  onRetry: () => void;
  onReturnToBrief: () => void;
}

// The `message` prop is always a safe, pre-written string from the server
// route (see app/api/personas/route.ts) — never a raw error object or stack
// trace, by construction.
export function ApiErrorState({ message, onRetry, onReturnToBrief }: ApiErrorStateProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div
      role="alert"
      className="mx-auto flex max-w-md flex-col items-center gap-4 px-6 py-24 text-center"
    >
      <AlertIcon className="h-8 w-8 text-red-600" aria-hidden="true" />
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="text-xl font-semibold text-slate-900 focus:outline-none"
      >
        Something went wrong generating your personas
      </h1>
      <p className="text-base text-slate-600">{message}</p>
      <p className="text-sm text-slate-500">Nothing you entered was lost — your inputs are still here.</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button variant="primary" onClick={onRetry}>
          Retry
        </Button>
        <Button variant="secondary" onClick={onReturnToBrief}>
          Return to Brief
        </Button>
      </div>
    </div>
  );
}
