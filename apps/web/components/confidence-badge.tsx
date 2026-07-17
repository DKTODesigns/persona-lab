import type { ConfidenceLevel } from "@personalab/core";
import { cn } from "@/lib/cn";
import { AssumptionIcon, EvidenceIcon, InferenceIcon, UnknownIcon } from "./icons";

// Every claim's confidence is encoded through five independent channels —
// icon, text label, border style, label typography, and sort order — so it
// still reads correctly without relying on color at all (grayscale, print,
// colorblind users). Color is a bonus sixth layer, never the only one.
const CONFIDENCE_META: Record<
  ConfidenceLevel,
  { label: string; Icon: typeof EvidenceIcon; badgeClass: string; labelClass: string }
> = {
  evidence: {
    label: "Evidence",
    Icon: EvidenceIcon,
    badgeClass: "border-2 border-emerald-700 bg-emerald-50 text-emerald-800",
    labelClass: "font-medium",
  },
  inference: {
    label: "Inference",
    Icon: InferenceIcon,
    badgeClass: "border border-blue-700 bg-blue-50 text-blue-800",
    labelClass: "font-medium",
  },
  assumption: {
    label: "Assumption",
    Icon: AssumptionIcon,
    badgeClass: "border border-dashed border-amber-700 bg-amber-50 text-amber-800",
    labelClass: "italic",
  },
  unknown: {
    label: "Unknown",
    Icon: UnknownIcon,
    badgeClass: "border border-dotted border-slate-400 bg-slate-100 text-slate-700",
    labelClass: "italic",
  },
};

export const CONFIDENCE_ORDER: ConfidenceLevel[] = ["evidence", "inference", "assumption", "unknown"];

export function ConfidenceBadge({ level }: { level: ConfidenceLevel }) {
  const meta = CONFIDENCE_META[level];
  const Icon = meta.Icon;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs",
        meta.badgeClass,
        meta.labelClass
      )}
    >
      <Icon aria-hidden="true" className="h-3.5 w-3.5" />
      {meta.label}
    </span>
  );
}
