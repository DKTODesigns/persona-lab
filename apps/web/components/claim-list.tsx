import type { Claim } from "@personalab/core";
import { FOCUS_RING_CLASSES } from "@/lib/a11y";
import { cn } from "@/lib/cn";
import { CONFIDENCE_ORDER, ConfidenceBadge } from "./confidence-badge";

function sortByConfidence(claims: Claim[]): Claim[] {
  return [...claims].sort(
    (a, b) => CONFIDENCE_ORDER.indexOf(a.confidence) - CONFIDENCE_ORDER.indexOf(b.confidence)
  );
}

export function ClaimList({ claims }: { claims: Claim[] }) {
  if (claims.length === 0) {
    return <p className="text-sm text-slate-400">None identified.</p>;
  }

  return (
    <ul className="space-y-4">
      {sortByConfidence(claims).map((claim, index) => (
        <li key={index} className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-2.5">
          <ConfidenceBadge level={claim.confidence} />
          <div className="flex-1">
            <p className="text-base text-slate-800">{claim.statement}</p>
            <details className="mt-1">
              <summary
                className={cn(
                  "cursor-pointer select-none text-sm font-medium text-blue-700",
                  FOCUS_RING_CLASSES
                )}
              >
                Why?
              </summary>
              <p className="mt-1 text-sm text-slate-600">{claim.rationale}</p>
            </details>
          </div>
        </li>
      ))}
    </ul>
  );
}
