import type { Persona } from "@personalab/core";
import type { InterviewNotes } from "./types";

/** Reveals notes gradually as the mock interview progresses, rather than
 * dumping everything at once — deterministic, based purely on how many
 * participant turns have happened so far. */
function reveal<T>(items: T[], participantTurns: number): T[] {
  if (participantTurns <= 0 || items.length === 0) return [];
  const count = Math.min(items.length, Math.max(1, Math.ceil(participantTurns / 2)));
  return items.slice(0, count);
}

function isLikelyAddressed(question: string, askedQuestions: string[]): boolean {
  const questionWords = question.toLowerCase().match(/[a-z]{4,}/g) ?? [];
  if (questionWords.length === 0) return false;
  const askedText = askedQuestions.join(" ").toLowerCase();
  return questionWords.some((word) => askedText.includes(word));
}

/**
 * Deterministic mock notes derived from the persona's own claims plus the
 * conversation so far — no Claude call, no extraction logic. `openQuestions`
 * is reused directly from the already-generated PersonaGeneratorOutput
 * rather than inventing new question text.
 */
export function generateMockInterviewNotes(
  persona: Persona,
  openQuestions: string[],
  participantTurns: number,
  askedQuestions: string[]
): InterviewNotes {
  const insightsSource = [...persona.goals, ...persona.behaviors].map((claim) => claim.statement);
  const painPointsSource = persona.frustrations.map((claim) => claim.statement);
  const opportunitiesSource = [...persona.accessibilityConsiderations, ...persona.contextOfUse].map(
    (claim) => claim.statement
  );

  // Before the interview starts, nothing has been "unanswered" yet in any
  // meaningful sense — show the full original list. Once questions have
  // actually been asked, drop any open question that shares a topic word
  // with something already asked.
  const unansweredQuestions =
    participantTurns > 0 ? openQuestions.filter((q) => !isLikelyAddressed(q, askedQuestions)) : openQuestions;

  return {
    emergingInsights: reveal(insightsSource, participantTurns),
    painPoints: reveal(painPointsSource, participantTurns),
    opportunities: reveal(opportunitiesSource, participantTurns),
    unansweredQuestions,
  };
}
