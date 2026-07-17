import { InfoIcon } from "./icons";

export function TrustBanner({ compact = false }: { compact?: boolean }) {
  return (
    <div className="border-b border-blue-100 bg-blue-50 px-6 py-3">
      <p className="flex items-start gap-2 text-base text-blue-900">
        <InfoIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span>
          {compact
            ? "Hypotheses only — validate with real users."
            : "These are hypotheses to validate with real users — not confirmed research findings."}
        </span>
      </p>
    </div>
  );
}
