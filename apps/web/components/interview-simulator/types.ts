export type InterviewMessageRole = "researcher" | "participant";

/** Confidence classification for a single participant answer — matches the
 * value set returned by the live /api/interview route (and reused by the
 * mock engine) so both paths produce the same badge values. */
export type AnswerConfidenceLabel = "evidence" | "inference" | "assumption" | "mixed" | "unknown";

export interface InterviewMessage {
  role: InterviewMessageRole;
  text: string;
  /** Only ever set on participant messages. */
  confidenceLabel?: AnswerConfidenceLabel;
  /** Only set when a participant message came from the explicit mock
   * fallback rather than a live Claude response — always rendered with a
   * visible label so mock content is never presented as a live answer. */
  source?: "mock";
}

export interface InterviewNotes {
  emergingInsights: string[];
  painPoints: string[];
  opportunities: string[];
  unansweredQuestions: string[];
}
