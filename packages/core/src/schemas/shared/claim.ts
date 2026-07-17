import { z } from "zod";

/**
 * Every claim-bearing field across every module (persona traits, usability
 * findings, accessibility issues, recommendations, ...) uses this shape.
 * Because it's part of the output JSON schema sent to Claude via tool-use,
 * classification isn't a suggestion the model can skip — it's required to
 * produce valid output at all.
 */
export const ConfidenceLevel = z.enum(["evidence", "inference", "assumption", "unknown"]);
export type ConfidenceLevel = z.infer<typeof ConfidenceLevel>;

export const ClaimSchema = z.object({
  statement: z.string(),
  confidence: ConfidenceLevel,
  rationale: z.string(),
});
export type Claim = z.infer<typeof ClaimSchema>;
