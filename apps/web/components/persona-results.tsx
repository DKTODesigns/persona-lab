"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { ConfidenceLevel, Persona, PersonaGeneratorInput, PersonaGeneratorOutput } from "@personalab/core";
import { FOCUS_RING_CLASSES } from "@/lib/a11y";
import { cn } from "@/lib/cn";
import { toMarkdown } from "@/lib/to-markdown";
import { ClaimList } from "./claim-list";
import { CONFIDENCE_ORDER, ConfidenceBadge } from "./confidence-badge";
import {
  AccessibilityIcon,
  InfoIcon,
  MapPinIcon,
  RepeatIcon,
  TargetIcon,
  TriangleAlertIcon,
} from "./icons";
import { PersonaAvatar } from "./persona-avatar";
import { Button } from "./ui/button";

interface PersonaResultsProps {
  input: PersonaGeneratorInput;
  result: PersonaGeneratorOutput;
  onRegenerate: () => void;
  onStartInterview: (personaIndex: number) => void;
}

type ClaimCategory = "goals" | "frustrations" | "behaviors" | "contextOfUse" | "accessibilityConsiderations";

const CATEGORY_LABELS: Record<ClaimCategory, string> = {
  goals: "Goals",
  frustrations: "Frustrations",
  behaviors: "Behaviors",
  contextOfUse: "Context of Use",
  accessibilityConsiderations: "Accessibility Considerations",
};

const CATEGORY_ICONS: Record<ClaimCategory, typeof TargetIcon> = {
  goals: TargetIcon,
  frustrations: TriangleAlertIcon,
  behaviors: RepeatIcon,
  contextOfUse: MapPinIcon,
  accessibilityConsiderations: AccessibilityIcon,
};

const CATEGORY_KEYS = Object.keys(CATEGORY_LABELS) as ClaimCategory[];

const CONFIDENCE_TEXT_LABELS: Record<ConfidenceLevel, string> = {
  evidence: "Evidence",
  inference: "Inference",
  assumption: "Assumption",
  unknown: "Unknown",
};

// Solid fills for the compact distribution bar — same hue family as the
// outlined ConfidenceBadge colors, adapted for a filled segment rather than
// a bordered pill.
const DISTRIBUTION_BAR_COLORS: Record<ConfidenceLevel, string> = {
  evidence: "bg-emerald-600",
  inference: "bg-blue-600",
  assumption: "bg-amber-500",
  unknown: "bg-slate-400",
};

function personaHasEvidence(persona: Persona): boolean {
  return CATEGORY_KEYS.some((key) => persona[key].some((claim) => claim.confidence === "evidence"));
}

/** Tallies every classified claim across all five categories for the given
 * persona. Purely derived from data already on the persona — no API call,
 * no schema change — so it's always in sync with whichever persona is
 * selected. */
function countClaimsByConfidence(persona: Persona): Record<ConfidenceLevel, number> {
  const counts: Record<ConfidenceLevel, number> = { evidence: 0, inference: 0, assumption: 0, unknown: 0 };
  for (const key of CATEGORY_KEYS) {
    for (const claim of persona[key]) {
      counts[claim.confidence] += 1;
    }
  }
  return counts;
}

export function PersonaResults({ input, result, onRegenerate, onStartInterview }: PersonaResultsProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied">("idle");

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const selectedPersona = result.personas[selectedIndex] ?? result.personas[0]!;
  const showEvidenceSources = Boolean(input.knownUserData) && personaHasEvidence(selectedPersona);
  const confidenceCounts = countClaimsByConfidence(selectedPersona);
  const totalClaims = CONFIDENCE_ORDER.reduce((sum, level) => sum + confidenceCounts[level], 0);
  const distributionLabel =
    totalClaims > 0
      ? `Claim distribution: ${CONFIDENCE_ORDER.map(
          (level) => `${CONFIDENCE_TEXT_LABELS[level]} ${confidenceCounts[level]}`
        ).join(", ")}`
      : "No claims classified yet";

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const count = result.personas.length;
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % count;
    else if (event.key === "ArrowLeft") nextIndex = (index - 1 + count) % count;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = count - 1;

    if (nextIndex === null) return;
    event.preventDefault();
    setSelectedIndex(nextIndex);
    tabRefs.current[nextIndex]?.focus();
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(toMarkdown(input, result));
    setCopyStatus("copied");
    setTimeout(() => setCopyStatus("idle"), 2000);
  }

  function handleDownload() {
    const blob = new Blob([toMarkdown(input, result)], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "personalab-personas.md";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-6 py-8 sm:px-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Persona Results</p>
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="mt-1 text-2xl font-semibold text-slate-900 focus:outline-none"
        >
          Your personas
        </h1>
        <p className="mt-1 text-base text-slate-600">Generated from your product description.</p>
        <details className="mt-2 text-base">
          <summary className={cn("cursor-pointer select-none font-medium text-blue-700", FOCUS_RING_CLASSES)}>
            View what you entered
          </summary>
          <dl className="mt-2 space-y-1 rounded-md border border-slate-200 bg-white p-4 text-slate-600">
            <div>
              <dt className="inline font-medium">Product description: </dt>
              <dd className="inline">{input.productDescription}</dd>
            </div>
            {input.targetContext ? (
              <div>
                <dt className="inline font-medium">Target context: </dt>
                <dd className="inline">{input.targetContext}</dd>
              </div>
            ) : null}
            {input.knownUserData ? (
              <div>
                <dt className="inline font-medium">Known user data: </dt>
                <dd className="inline">{input.knownUserData}</dd>
              </div>
            ) : null}
          </dl>
        </details>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="flex items-center gap-1.5 text-base font-semibold text-slate-900">
          <InfoIcon className="h-4 w-4 text-blue-700" aria-hidden="true" />
          Confidence overview
        </h2>
        <p className="mt-1 text-base text-slate-600">{result.overallConfidenceNote}</p>
      </div>

      <div className="grid grid-cols-1 gap-8 pt-6 lg:grid-cols-[1fr_320px]">
        <div>
          {/*
            Sticky only at lg: (matches the aside's breakpoint below). The
            scroll container is <main> in app-shell.tsx, and the header lives
            outside it, so top-8 only needs to clear this element's own edge.
            bg-slate-50 matches the page background so scrolled content
            doesn't show through behind/between the cards, and pb-4 gives the
            sticky band a clean trailing edge before the panel below. No
            overflow is set here, so there's no internal scroll area and the
            selected card's shadow/scale are never clipped.
          */}
          <div className="lg:sticky lg:top-8 lg:z-10 lg:-mx-1 lg:bg-slate-50 lg:px-1 lg:pb-4">
            <div role="tablist" aria-label="Personas" className="flex flex-wrap gap-4">
              {result.personas.map((persona, index) => {
                const selected = index === selectedIndex;
                return (
                  <button
                    key={persona.name}
                    ref={(el) => {
                      tabRefs.current[index] = el;
                    }}
                    type="button"
                    role="tab"
                    id={`persona-tab-${index}`}
                    aria-selected={selected}
                    aria-controls={`persona-panel-${index}`}
                    tabIndex={selected ? 0 : -1}
                    onClick={() => setSelectedIndex(index)}
                    onKeyDown={(event) => handleTabKeyDown(event, index)}
                    className={cn(
                      "flex w-44 shrink-0 origin-center cursor-pointer flex-col items-center gap-3 rounded-lg border px-5 py-5 text-center transition-all duration-200 ease-out sm:w-52",
                      FOCUS_RING_CLASSES,
                      selected
                        ? "scale-[1.03] border-2 border-blue-700 bg-blue-50 shadow-lg"
                        : "border-slate-200 bg-white shadow-none hover:border-slate-300 hover:shadow-md"
                    )}
                  >
                    <PersonaAvatar name={persona.name} className="h-12 w-12 text-base" />
                    <span className="w-full truncate text-base font-semibold text-slate-900">{persona.name}</span>
                    <span
                      className={cn(
                        "w-full truncate text-sm",
                        selected ? "text-slate-600" : "text-slate-500"
                      )}
                    >
                      {persona.summary}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div
            role="tabpanel"
            id={`persona-panel-${selectedIndex}`}
            aria-labelledby={`persona-tab-${selectedIndex}`}
            tabIndex={0}
            className="mt-6 rounded-lg border border-slate-200 bg-white p-6"
          >
            <div className="flex items-start gap-4">
              <PersonaAvatar name={selectedPersona.name} className="h-14 w-14 text-lg" />
              <div>
                <h2 className="text-xl font-semibold text-slate-900">{selectedPersona.name}</h2>
                <p className="mt-1 text-base text-slate-600">{selectedPersona.summary}</p>
              </div>
            </div>

            <div className="mt-5">
              <p className="text-sm font-medium text-slate-500">Claim confidence summary</p>
              <div
                role="img"
                aria-label={distributionLabel}
                className="mt-2 flex h-2 w-full overflow-hidden rounded-full bg-slate-200"
              >
                {totalClaims > 0
                  ? CONFIDENCE_ORDER.map((level) =>
                      confidenceCounts[level] > 0 ? (
                        <div
                          key={level}
                          className={DISTRIBUTION_BAR_COLORS[level]}
                          style={{ width: `${(confidenceCounts[level] / totalClaims) * 100}%` }}
                        />
                      ) : null
                    )
                  : null}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {CONFIDENCE_ORDER.map((level) => (
                  <div
                    key={level}
                    className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2"
                  >
                    <ConfidenceBadge level={level} />
                    <span className="ml-auto text-base font-semibold text-slate-900">
                      {confidenceCounts[level]}
                      <span className="sr-only"> claims</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 space-y-8">
              {CATEGORY_KEYS.map((key) => {
                const CategoryIcon = CATEGORY_ICONS[key];
                return (
                  <div key={key}>
                    <h3 className="flex items-center gap-2 text-base font-semibold text-slate-800">
                      <CategoryIcon className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                      {CATEGORY_LABELS[key]}
                    </h3>
                    <div className="mt-3">
                      <ClaimList claims={selectedPersona[key]} />
                    </div>
                  </div>
                );
              })}
            </div>

            {showEvidenceSources ? (
              <div className="mt-6 rounded-md border border-emerald-200 bg-emerald-50 p-4">
                <h3 className="text-base font-semibold text-emerald-900">Evidence sources</h3>
                <p className="mt-1 text-base text-emerald-800">From the research notes you provided:</p>
                <blockquote className="mt-2 whitespace-pre-wrap border-l-2 border-emerald-300 pl-3 text-base text-emerald-900">
                  {input.knownUserData}
                </blockquote>
              </div>
            ) : null}
          </div>
        </div>

        {/*
          lg:self-start keeps this grid item sized to its own content instead
          of stretching to match the (much taller) main column, which is what
          gives lg:sticky room to actually travel/stick as the page scrolls.
          Sticky/self-start only apply at lg: — below that, the grid collapses
          to a single column and this returns to normal document flow. The
          scroll container is <main> in app-shell.tsx (not the document), and
          the app header lives outside <main>, so top-8 only needs to clear
          this panel's own edge, not the header.
        */}
        <aside className="rounded-lg border border-slate-200 bg-white p-6 lg:sticky lg:top-8 lg:self-start">
          <h2 className="text-lg font-semibold text-slate-900">Research Questions to Validate Next</h2>
          <ol className="mt-3 list-decimal space-y-3 pl-5 text-base text-slate-700">
            {result.openQuestions.map((question, index) => (
              <li key={index}>{question}</li>
            ))}
          </ol>
        </aside>
      </div>

      <div className="space-y-3 border-t border-slate-200 pt-6">
        <p className="text-base font-medium text-slate-600">Remember: validate before you rely on this.</p>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={handleCopy}>
            {copyStatus === "copied" ? "Copied!" : "Copy to clipboard"}
          </Button>
          <Button variant="secondary" onClick={handleDownload}>
            Export as Markdown
          </Button>
          <Button variant="ghost" onClick={onRegenerate}>
            Adjust inputs &amp; regenerate
          </Button>
          <Button variant="secondary" onClick={() => onStartInterview(selectedIndex)}>
            Start interview
          </Button>
        </div>
        <p aria-live="polite" className="sr-only">
          {copyStatus === "copied" ? "Copied to clipboard" : ""}
        </p>
      </div>
    </div>
  );
}
