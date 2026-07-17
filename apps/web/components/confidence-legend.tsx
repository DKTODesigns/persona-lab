import type { ConfidenceLevel } from "@personalab/core";
import { CONFIDENCE_ORDER, ConfidenceBadge } from "./confidence-badge";

export const CONFIDENCE_DEFINITIONS: Record<ConfidenceLevel, string> = {
  evidence: "Directly grounded in the research notes you provided.",
  inference: "A reasonable deduction from the information given.",
  assumption: "An unverified guess made where no information was given.",
  unknown: "An open question the input doesn't address.",
};

// Shared source of truth for what each confidence tag means — used as the
// Workflow Legend on the input screen and the Interpretation Panel on the
// pipeline screen, so the explanation never drifts between the two.
export function ConfidenceLegend({ title }: { title: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      <ul className="mt-4 space-y-3">
        {CONFIDENCE_ORDER.map((level) => (
          <li key={level} className="flex items-start gap-3">
            <ConfidenceBadge level={level} />
            <p className="text-base text-slate-600">{CONFIDENCE_DEFINITIONS[level]}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
