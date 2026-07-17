import { z } from "zod";
import { defineModule } from "../engine/defineModule";
import { ClaimSchema } from "../schemas/shared/claim";

export const PersonaGeneratorInputSchema = z.object({
  productDescription: z.string().min(1, "Describe the product or feature being researched."),
  targetContext: z.string().optional(),
  /** Real research notes/transcripts, if any — the only permissible source of `evidence`-tagged claims. */
  knownUserData: z.string().optional(),
  personaCount: z.number().int().min(1).max(6).default(3),
});
export type PersonaGeneratorInput = z.infer<typeof PersonaGeneratorInputSchema>;

export const PersonaSchema = z.object({
  name: z.string(),
  summary: z.string(),
  goals: z.array(ClaimSchema),
  frustrations: z.array(ClaimSchema),
  behaviors: z.array(ClaimSchema),
  accessibilityConsiderations: z.array(ClaimSchema),
  contextOfUse: z.array(ClaimSchema),
});
export type Persona = z.infer<typeof PersonaSchema>;

export const PersonaGeneratorOutputSchema = z.object({
  personas: z.array(PersonaSchema),
  openQuestions: z.array(z.string()),
  overallConfidenceNote: z.string(),
});
export type PersonaGeneratorOutput = z.infer<typeof PersonaGeneratorOutputSchema>;

// A minimal, illustrative example of the exact response shape — one persona
// with one claim per category, kept intentionally short. Content is
// placeholder only; the model must not reuse it. This exists purely to
// anchor structure (three required top-level fields; openQuestions as
// discrete array elements, never one combined string) after a real
// production incident where the model returned openQuestions as a single
// string and omitted overallConfidenceNote entirely.
const EXAMPLE_OUTPUT_JSON = JSON.stringify(
  {
    personas: [
      {
        name: "Example Persona",
        summary: "One-sentence behavioral summary — not a fictional biography.",
        goals: [{ statement: "Placeholder goal.", confidence: "inference", rationale: "Placeholder reasoning." }],
        frustrations: [
          { statement: "Placeholder frustration.", confidence: "assumption", rationale: "Placeholder reasoning." },
        ],
        behaviors: [{ statement: "Placeholder behavior.", confidence: "unknown", rationale: "Placeholder reasoning." }],
        accessibilityConsiderations: [
          { statement: "Placeholder consideration.", confidence: "unknown", rationale: "Placeholder reasoning." },
        ],
        contextOfUse: [
          { statement: "Placeholder context.", confidence: "assumption", rationale: "Placeholder reasoning." },
        ],
      },
    ],
    openQuestions: [
      "Each question is its own array element, like this one.",
      "Never combine multiple questions into a single string.",
    ],
    overallConfidenceNote:
      "Required — one or two sentences summarizing how much of this output is grounded evidence versus inference, assumption, or unknown.",
  },
  null,
  2
);

export const personaGeneratorModule = defineModule({
  id: "persona-generator",
  name: "Persona Generator",
  description:
    "Generates evidence-aware personas from product context, tagging every trait as evidence, inference, assumption, or unknown.",
  category: "Research",
  version: "0.1.1",
  inputSchema: PersonaGeneratorInputSchema,
  outputSchema: PersonaGeneratorOutputSchema,
  buildPrompt: (input) => ({
    system: [
      [
        "You are the Persona Generator module of PersonaLab.",
        "Ground personas as tightly as possible in the information given.",
        "If `knownUserData` is provided, treat it as the only permissible source of evidence-tagged claims — never tag anything else as evidence, no matter how likely it seems.",
        "Everything else must be tagged inference (a reasonable deduction), assumption (an unsupported guess), or unknown.",
        "Describe personas as behavioral archetypes grounded in context and needs, not as decorative fictional biographies.",
        "Do not invent precise demographic details (exact age, income, named location, ethnicity, family status) unless directly supported by the supplied research notes.",
        "When accessibility needs aren't stated, describe them as open considerations to investigate (tagged assumption or unknown) rather than asserting a specific disability the persona has.",
        "The response has exactly three required top-level fields: `personas` (an array), `openQuestions`, and `overallConfidenceNote`.",
        "`openQuestions` is a required array of research questions that would validate the highest-risk assumptions and unknowns across all personas — prioritize what matters most, not an exhaustive list. Each question is its own separate string array element; never combine multiple questions into one string.",
        "`overallConfidenceNote` is a required string — one or two sentences summarizing how much of the output is grounded evidence versus inference, assumption, or unknown. It must never be omitted, even when the response is long.",
      ].join(" "),
      "Minimal structural example (placeholder content only — do not reuse it):",
      EXAMPLE_OUTPUT_JSON,
    ].join("\n\n"),
    user: [
      `Product description: ${input.productDescription}`,
      input.targetContext ? `Target context: ${input.targetContext}` : null,
      input.knownUserData
        ? `Known user data (treat as the evidence source): ${input.knownUserData}`
        : "No user research data was provided — every persona trait must be inference, assumption, or unknown.",
      `Generate ${input.personaCount} distinct persona(s). Avoid stereotyping based on age, gender, culture, disability, ethnicity, family status, profession, or geography.`,
      "Include both required top-level fields alongside `personas`: `openQuestions` (an array of individual question strings validating the highest-risk assumptions and unknowns) and `overallConfidenceNote` (a required summary string).",
    ]
      .filter(Boolean)
      .join("\n"),
  }),
});
