import type { Claim, PersonaGeneratorInput, PersonaGeneratorOutput } from "@personalab/core";

const CONFIDENCE_LABEL: Record<Claim["confidence"], string> = {
  evidence: "Evidence",
  inference: "Inference",
  assumption: "Assumption",
  unknown: "Unknown",
};

function claimsToMarkdown(title: string, claims: Claim[]): string {
  if (claims.length === 0) {
    return `**${title}:** None identified.`;
  }
  const lines = claims.map(
    (claim) => `- [${CONFIDENCE_LABEL[claim.confidence]}] ${claim.statement}\n  _Why:_ ${claim.rationale}`
  );
  return `**${title}**\n${lines.join("\n")}`;
}

export function toMarkdown(input: PersonaGeneratorInput, result: PersonaGeneratorOutput): string {
  const sections: string[] = [
    "# PersonaLab personas",
    `_Generated from: ${input.productDescription}_`,
    "> These are hypotheses to validate with real users — not confirmed research findings.",
    `## Confidence overview\n${result.overallConfidenceNote}`,
  ];

  for (const persona of result.personas) {
    sections.push(`## ${persona.name}\n${persona.summary}`);
    sections.push(claimsToMarkdown("Goals", persona.goals));
    sections.push(claimsToMarkdown("Frustrations", persona.frustrations));
    sections.push(claimsToMarkdown("Behaviors", persona.behaviors));
    sections.push(claimsToMarkdown("Context of Use", persona.contextOfUse));
    sections.push(claimsToMarkdown("Accessibility Considerations", persona.accessibilityConsiderations));
  }

  sections.push(
    `## Research Questions to Validate Next\n${result.openQuestions
      .map((question, index) => `${index + 1}. ${question}`)
      .join("\n")}`
  );

  return sections.join("\n\n");
}
