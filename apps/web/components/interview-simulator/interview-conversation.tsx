"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { Persona } from "@personalab/core";
import { cn } from "@/lib/cn";
import { FOCUS_RING_CLASSES } from "@/lib/a11y";
import { AlertIcon } from "../icons";
import { PersonaAvatar } from "../persona-avatar";
import { Button } from "../ui/button";
import type { AnswerConfidenceLabel, InterviewMessage } from "./types";

const STARTER_QUESTIONS = [
  "Can you walk me through a recent time you needed something like this?",
  "What's the most frustrating part of how you currently handle this?",
  "How would this fit into your day-to-day routine?",
];

const CONFIDENCE_DISPLAY_LABELS: Record<AnswerConfidenceLabel, string> = {
  evidence: "Evidence",
  inference: "Inference",
  assumption: "Assumption",
  mixed: "Mixed",
  unknown: "Unknown",
};

interface InterviewConversationProps {
  persona: Persona;
  conversation: InterviewMessage[];
  onSendQuestion: (questionText: string) => void;
  isSending: boolean;
  error: string | null;
  onRetry: () => void;
  onUseMockResponse: () => void;
  onCancel: () => void;
}

export function InterviewConversation({
  persona,
  conversation,
  onSendQuestion,
  isSending,
  error,
  onRetry,
  onUseMockResponse,
  onCancel,
}: InterviewConversationProps) {
  const [draft, setDraft] = useState("");
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [conversation.length, isSending, error]);

  function send(text: string) {
    if (isSending) return; // duplicate-submission guard
    const trimmed = text.trim();
    if (!trimmed) return;
    onSendQuestion(trimmed);
    setDraft("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      send(draft);
    }
  }

  return (
    <section
      aria-labelledby="interview-conversation-heading"
      className="flex flex-col rounded-lg border border-slate-200 bg-white p-5"
    >
      <h2 id="interview-conversation-heading" className="sr-only">
        Conversation
      </h2>

      <div className="flex-1">
        {conversation.length === 0 ? (
          <div className="rounded-md border border-dashed border-slate-300 p-5 text-center">
            <p className="text-sm text-slate-600">
              Ask an opening question to start the simulated interview, or try one of these:
            </p>
            <div className="mt-3 flex flex-col gap-2">
              {STARTER_QUESTIONS.map((question) => (
                <button
                  key={question}
                  type="button"
                  disabled={isSending}
                  onClick={() => send(question)}
                  className={cn(
                    "rounded-md border border-slate-300 bg-white px-3 py-2 text-left text-sm text-slate-700 hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50",
                    FOCUS_RING_CLASSES
                  )}
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <ol className="space-y-4">
            {conversation.map((message, index) => (
              <li
                key={index}
                className={cn("flex gap-3", message.role === "researcher" ? "flex-row-reverse" : "flex-row")}
              >
                {message.role === "participant" ? (
                  <PersonaAvatar name={persona.name} className="h-8 w-8 shrink-0 text-xs" />
                ) : (
                  <span
                    aria-hidden="true"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-800"
                  >
                    You
                  </span>
                )}
                <div
                  className={cn(
                    "max-w-[75%] rounded-lg border px-4 py-3",
                    message.role === "researcher" ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-slate-50"
                  )}
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {message.role === "researcher" ? "Researcher" : persona.name}
                  </p>
                  <p className="mt-1 whitespace-pre-line text-base text-slate-800">{message.text}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {message.confidenceLabel ? (
                      <span className="inline-block rounded-full border border-slate-300 bg-white px-2 py-0.5 text-xs font-medium text-slate-600">
                        {CONFIDENCE_DISPLAY_LABELS[message.confidenceLabel]}
                      </span>
                    ) : null}
                    {message.source === "mock" ? (
                      <span className="inline-block rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
                        Mock response
                      </span>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}

        {isSending ? (
          <div className="mt-4 flex items-center gap-3" role="status" aria-live="polite">
            <PersonaAvatar name={persona.name} className="h-8 w-8 shrink-0 text-xs" />
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-sm text-slate-500">{persona.name} is responding…</p>
            </div>
          </div>
        ) : null}

        {error ? (
          <div role="alert" className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <AlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
            <div>
              <p className="text-sm text-red-800">{error}</p>
              <p className="mt-1 text-xs text-red-700">Your question is still in the composer below — nothing was lost.</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button variant="secondary" onClick={onRetry}>
                  Retry
                </Button>
                <Button variant="ghost" onClick={onUseMockResponse}>
                  Use mock response
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        <div ref={endOfMessagesRef} />
      </div>

      <form
        className="mt-5 flex items-end gap-2 border-t border-slate-200 pt-4"
        onSubmit={(event) => {
          event.preventDefault();
          send(draft);
        }}
      >
        <div className="flex-1">
          <label htmlFor="interview-question" className="sr-only">
            Next interview question
          </label>
          <textarea
            id="interview-question"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            disabled={isSending}
            placeholder="Ask the next question… (Enter to send, Shift+Enter for a new line)"
            className="block w-full rounded-md border border-slate-300 px-3 py-2 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-700 disabled:cursor-not-allowed disabled:bg-slate-50"
          />
        </div>
        {isSending ? (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        ) : (
          <Button type="submit" variant="primary" disabled={isSending}>
            Send
          </Button>
        )}
      </form>
    </section>
  );
}
