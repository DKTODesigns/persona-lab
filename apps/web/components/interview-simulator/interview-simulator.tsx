"use client";

import { useEffect, useRef } from "react";
import type { Persona } from "@personalab/core";
import { InfoIcon } from "../icons";
import { InterviewConversation } from "./interview-conversation";
import { InterviewNotesPanel } from "./interview-notes-panel";
import { PersonaContextPanel } from "./persona-context-panel";
import type { InterviewMessage } from "./types";

interface InterviewSimulatorProps {
  persona: Persona;
  openQuestions: string[];
  conversation: InterviewMessage[];
  onSendQuestion: (questionText: string) => void;
  onChangePersona: () => void;
  isSending: boolean;
  error: string | null;
  onRetry: () => void;
  onUseMockResponse: () => void;
  onCancel: () => void;
}

export function InterviewSimulator({
  persona,
  openQuestions,
  conversation,
  onSendQuestion,
  onChangePersona,
  isSending,
  error,
  onRetry,
  onUseMockResponse,
  onCancel,
}: InterviewSimulatorProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, [persona.name]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-6 py-8 sm:px-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Interview Simulator</p>
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="mt-1 text-2xl font-semibold text-slate-900 focus:outline-none"
        >
          Interviewing: {persona.name}
        </h1>
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
        <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
        <p className="text-sm text-amber-900">
          This is a synthetic interview with an AI-simulated persona, not a real person. Treat every
          response as a hypothesis — validate anything important with real research participants before
          acting on it.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr_320px]">
        <PersonaContextPanel persona={persona} onChangePersona={onChangePersona} />
        <InterviewConversation
          persona={persona}
          conversation={conversation}
          onSendQuestion={onSendQuestion}
          isSending={isSending}
          error={error}
          onRetry={onRetry}
          onUseMockResponse={onUseMockResponse}
          onCancel={onCancel}
        />
        <InterviewNotesPanel persona={persona} openQuestions={openQuestions} conversation={conversation} />
      </div>
    </div>
  );
}
