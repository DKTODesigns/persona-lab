"use client";

import { useEffect, useRef } from "react";
import { PIPELINE_STAGES } from "@/lib/pipeline-stages";
import { ConfidenceLegend } from "./confidence-legend";
import { EvidenceIcon, SpinnerIcon } from "./icons";
import { Button } from "./ui/button";

interface GeneratingStateProps {
  /**
   * Index of the stage currently in progress. Stages before it render as
   * completed, stages after as pending. Pass PIPELINE_STAGES.length once the
   * response has arrived to show everything as complete just before
   * navigating away. Driven by the real request lifecycle in
   * research-workflow.tsx — never a fixed timer.
   */
  activeStageIndex: number;
  onCancel: () => void;
}

type StageStatus = "completed" | "active" | "pending";

export function GeneratingState({ activeStageIndex, onCancel }: GeneratingStateProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const liveMessage =
    activeStageIndex < PIPELINE_STAGES.length
      ? `Now: ${PIPELINE_STAGES[activeStageIndex]} (stage ${activeStageIndex + 1} of ${PIPELINE_STAGES.length})`
      : "All steps complete.";

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 sm:px-8">
      <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">AI Research Pipeline</p>
      <div className="mt-2 flex items-center gap-3">
        <SpinnerIcon
          className="h-6 w-6 animate-spin text-blue-700 motion-reduce:animate-none"
          aria-hidden="true"
        />
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-2xl font-semibold text-slate-900 focus:outline-none"
        >
          Generating your personas…
        </h1>
      </div>
      <p className="mt-2 text-base text-slate-600">
        PersonaLab is working through the steps below. This can take a little while — you can cancel at
        any time.
      </p>

      <p role="status" aria-live="polite" className="sr-only">
        {liveMessage}
      </p>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        <ol className="space-y-4 rounded-lg border border-slate-200 bg-white p-6">
          {PIPELINE_STAGES.map((stage, index) => {
            const status: StageStatus =
              index < activeStageIndex ? "completed" : index === activeStageIndex ? "active" : "pending";
            return (
              <li key={stage} className="flex items-center gap-3">
                {status === "completed" ? (
                  <EvidenceIcon className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
                ) : status === "active" ? (
                  <span
                    className="h-3 w-3 shrink-0 animate-pulse rounded-full bg-blue-700 motion-reduce:animate-none"
                    aria-hidden="true"
                  />
                ) : (
                  <span
                    className="h-3 w-3 shrink-0 rounded-full border-2 border-slate-300"
                    aria-hidden="true"
                  />
                )}
                <span
                  className={
                    status === "pending"
                      ? "text-base text-slate-400"
                      : status === "active"
                        ? "text-base font-semibold text-slate-900"
                        : "text-base text-slate-500"
                  }
                >
                  {stage}
                </span>
                {status === "completed" ? <span className="sr-only"> — done</span> : null}
                {status === "active" ? <span className="sr-only"> — in progress</span> : null}
              </li>
            );
          })}
        </ol>

        <ConfidenceLegend title="Interpretation panel" />
      </div>

      <div className="mt-8">
        <Button variant="secondary" onClick={onCancel}>
          Cancel generation
        </Button>
      </div>
    </div>
  );
}
