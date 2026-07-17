import type { ConfidenceLevel, Persona } from "@personalab/core";
import { ClaimList } from "../claim-list";
import { CONFIDENCE_ORDER, ConfidenceBadge } from "../confidence-badge";
import { PersonaAvatar } from "../persona-avatar";
import { Button } from "../ui/button";

interface PersonaContextPanelProps {
  persona: Persona;
  onChangePersona: () => void;
}

function countByConfidence(persona: Persona): Record<ConfidenceLevel, number> {
  const counts: Record<ConfidenceLevel, number> = { evidence: 0, inference: 0, assumption: 0, unknown: 0 };
  const categories = [
    persona.goals,
    persona.frustrations,
    persona.behaviors,
    persona.contextOfUse,
    persona.accessibilityConsiderations,
  ];
  for (const claims of categories) {
    for (const claim of claims) {
      counts[claim.confidence] += 1;
    }
  }
  return counts;
}

export function PersonaContextPanel({ persona, onChangePersona }: PersonaContextPanelProps) {
  const counts = countByConfidence(persona);

  return (
    <section aria-labelledby="persona-context-heading" className="rounded-lg border border-slate-200 bg-white p-5">
      <h2 id="persona-context-heading" className="sr-only">
        Persona context
      </h2>

      <div className="flex items-start gap-3">
        <PersonaAvatar name={persona.name} className="h-12 w-12 shrink-0 text-base" />
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-slate-900">{persona.name}</p>
          <p className="mt-1 text-sm text-slate-600">{persona.summary}</p>
        </div>
      </div>

      <div className="mt-5">
        <h3 className="text-sm font-semibold text-slate-800">Goals</h3>
        <div className="mt-2">
          <ClaimList claims={persona.goals} />
        </div>
      </div>

      <div className="mt-5">
        <h3 className="text-sm font-semibold text-slate-800">Frustrations</h3>
        <div className="mt-2">
          <ClaimList claims={persona.frustrations} />
        </div>
      </div>

      <div className="mt-5">
        <h3 className="text-sm font-semibold text-slate-800">Claim confidence summary</h3>
        <ul className="mt-2 space-y-1.5">
          {CONFIDENCE_ORDER.map((level) => (
            <li key={level} className="flex items-center gap-2">
              <ConfidenceBadge level={level} />
              <span className="ml-auto text-sm font-semibold text-slate-900">
                {counts[level]}
                <span className="sr-only"> claims</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <Button variant="ghost" className="mt-5 w-full" onClick={onChangePersona}>
        Change persona
      </Button>
    </section>
  );
}
