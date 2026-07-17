"use client";

import { useEffect, useRef, useState } from "react";
import type { PersonaGeneratorInput, PersonaGeneratorOutput } from "@personalab/core";
import { PIPELINE_STAGES } from "@/lib/pipeline-stages";
import { DEFAULT_PERSONA_FORM_VALUES, type PersonaFormValues } from "@/lib/types";
import { ApiErrorState } from "./api-error-state";
import { AppShell } from "./app-shell";
import { ConfidenceLegend } from "./confidence-legend";
import { GeneratingState } from "./generating-state";
import { LightbulbIcon, LockIcon } from "./icons";
import { PersonaInputForm } from "./persona-input-form";
import { PersonaResults } from "./persona-results";
import { TrustBanner } from "./trust-banner";

type Screen = "input" | "generating" | "results" | "error";

const GENERIC_ERROR_MESSAGE =
  "PersonaLab couldn't generate personas from that input just now. This wasn't caused by anything you entered — please try again.";

function toModuleInput(values: PersonaFormValues): PersonaGeneratorInput {
  return {
    productDescription: values.productDescription,
    targetContext: values.targetContext || undefined,
    knownUserData: values.knownUserData || undefined,
    personaCount: values.personaCount,
  };
}

interface ApiErrorPayload {
  error?: { type?: string; message?: string };
}

export function ResearchWorkflow() {
  const [screen, setScreen] = useState<Screen>("input");
  const [formValues, setFormValues] = useState<PersonaFormValues>(DEFAULT_PERSONA_FORM_VALUES);
  const [result, setResult] = useState<PersonaGeneratorOutput | null>(null);
  const [pipelineStage, setPipelineStage] = useState(0);
  const [errorMessage, setErrorMessage] = useState(GENERIC_ERROR_MESSAGE);
  const abortRef = useRef<AbortController | null>(null);
  // Tracks whether *we* intentionally aborted the in-flight request (Cancel /
  // Return to Brief). An AbortError can also arrive from something outside
  // our control (a proxy or security software killing a long-lived
  // connection) — in that case this stays false, and we must still surface
  // an error instead of leaving the UI frozen on the loading screen forever.
  const cancelledRef = useRef(false);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  async function runGeneration(values: PersonaFormValues) {
    cancelledRef.current = false;
    setFormValues(values);
    setScreen("generating");
    // Stages 0-1 (validating/preparing) happen client-side before the
    // request is sent, so by the time this screen is visible they're done —
    // stage 2 is the real, unknown-duration network call.
    setPipelineStage(2);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch("/api/personas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toModuleInput(values)),
        signal: controller.signal,
      });

      const payload = (await response.json()) as ApiErrorPayload & { result?: PersonaGeneratorOutput };

      if (!response.ok || !payload.result) {
        setErrorMessage(payload.error?.message ?? GENERIC_ERROR_MESSAGE);
        setScreen("error");
        return;
      }

      // Claim classification and question generation happen inside the same
      // model response, so once it's back, every stage is genuinely done.
      setPipelineStage(PIPELINE_STAGES.length);
      setResult(payload.result);
      setScreen("results");
    } catch (err) {
      if (cancelledRef.current) {
        // We aborted this ourselves (Cancel / Return to Brief) — the screen
        // is already back on "input"; nothing to show.
        return;
      }
      setErrorMessage(GENERIC_ERROR_MESSAGE);
      setScreen("error");
    } finally {
      abortRef.current = null;
    }
  }

  function goToInput() {
    cancelledRef.current = true;
    abortRef.current?.abort();
    setScreen("input");
  }

  function goToPersonas() {
    if (result) setScreen("results");
  }

  function handleRetry() {
    void runGeneration(formValues);
  }

  return (
    <AppShell
      activeSection={screen === "results" ? "personas" : "start-research"}
      personasEnabled={result !== null}
      onNavigateStartResearch={goToInput}
      onNavigatePersonas={goToPersonas}
    >
      <TrustBanner compact={screen !== "input"} />

      {screen === "input" ? (
        <div className="mx-auto max-w-3xl px-6 py-8 sm:px-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Research Workspace</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">Start a Research Exploration</h1>
          <p className="mt-2 text-base text-slate-600">
            Describe what you&rsquo;re building, what you already know, and what still needs validation.
          </p>

          <div className="mt-8">
            <PersonaInputForm initialValues={formValues} onSubmit={(values) => void runGeneration(values)} />
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ConfidenceLegend title="Workflow legend" />
            <div className="space-y-6">
              <div className="rounded-lg border border-slate-200 bg-white p-6">
                <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                  <LockIcon className="h-4 w-4 text-slate-500" aria-hidden="true" />
                  Session privacy
                </h2>
                <p className="mt-2 text-base text-slate-600">
                  Your product description, context, and research notes are sent to Anthropic&rsquo;s
                  Claude API to generate personas, and are not otherwise stored or logged by this
                  application. Nothing is saved after you close or refresh this page.
                </p>
              </div>
              <div className="rounded-lg border border-blue-100 bg-blue-50 p-6">
                <h2 className="flex items-center gap-2 text-base font-semibold text-blue-900">
                  <LightbulbIcon className="h-4 w-4 text-blue-700" aria-hidden="true" />
                  Research tip
                </h2>
                <p className="mt-2 text-base text-blue-900">
                  The more specific your product description, the more useful your open research
                  questions will be.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {screen === "generating" ? (
        <GeneratingState activeStageIndex={pipelineStage} onCancel={goToInput} />
      ) : null}

      {screen === "error" ? (
        <ApiErrorState message={errorMessage} onRetry={handleRetry} onReturnToBrief={goToInput} />
      ) : null}

      {screen === "results" && result ? (
        <PersonaResults input={toModuleInput(formValues)} result={result} onRegenerate={goToInput} />
      ) : null}
    </AppShell>
  );
}
