import { z } from "zod";
import { defineModule } from "../engine/defineModule";
import { PersonaSchema } from "./personaGenerator";

const InterviewHistoryMessageSchema = z.object({
  role: z.enum(["researcher", "participant"]),
  text: z.string(),
});

export const InterviewResponseInputSchema = z.object({
  // Reuses the existing Persona schema directly rather than redefining it —
  // there is exactly one definition of what a persona looks like.
  persona: PersonaSchema,
  messages: z.array(InterviewHistoryMessageSchema),
  question: z.string().min(1, "Ask a question before sending."),
  productDescription: z.string().min(1),
  targetContext: z.string().optional(),
  knownUserData: z.string().optional(),
});
export type InterviewResponseInput = z.infer<typeof InterviewResponseInputSchema>;

export const InterviewConfidenceSchema = z.enum(["evidence", "inference", "assumption", "mixed", "unknown"]);
export type InterviewConfidence = z.infer<typeof InterviewConfidenceSchema>;

export const InterviewResponseOutputSchema = z.object({
  answer: z.string(),
  confidence: InterviewConfidenceSchema,
  // Internal-only: explains the classification, never meant to be shown
  // inside the participant-facing answer itself.
  confidenceRationale: z.string(),
});
export type InterviewResponseOutput = z.infer<typeof InterviewResponseOutputSchema>;

// Only the most recent turns are sent — enough for coherent follow-ups
// without the prompt growing unbounded as an interview gets long.
const MAX_HISTORY_MESSAGES = 12;

function formatClaims(claims: { statement: string; confidence: string }[]): string {
  if (claims.length === 0) return "  (none recorded)";
  return claims.map((claim) => `  - [${claim.confidence}] ${claim.statement}`).join("\n");
}

export const interviewResponseModule = defineModule({
  id: "interview-response",
  name: "Interview Response",
  description:
    "Generates one in-character participant response for the Interview Simulator, grounded in the selected persona and the conversation so far.",
  category: "Research",
  version: "0.1.0",
  inputSchema: InterviewResponseInputSchema,
  outputSchema: InterviewResponseOutputSchema,
  buildPrompt: (input) => {
    const recentMessages = input.messages.slice(-MAX_HISTORY_MESSAGES);
    const transcript =
      recentMessages.length > 0
        ? recentMessages
            .map((message) => `${message.role === "researcher" ? "Researcher" : "Participant"}: ${message.text}`)
            .join("\n")
        : "(This is the first question of the interview.)";

    const personaDossier = [
      `Name: ${input.persona.name}`,
      `Summary: ${input.persona.summary}`,
      `Goals:\n${formatClaims(input.persona.goals)}`,
      `Frustrations:\n${formatClaims(input.persona.frustrations)}`,
      `Behaviors:\n${formatClaims(input.persona.behaviors)}`,
      `Context of use:\n${formatClaims(input.persona.contextOfUse)}`,
      `Accessibility considerations:\n${formatClaims(input.persona.accessibilityConsiderations)}`,
    ].join("\n\n");

    const system = [
      "For this task specifically, you are not speaking as PersonaLab's research assistant — you are voice-acting ONE specific synthetic research participant inside a moderated UX interview. Stay fully in character as that persona for this entire response.",
      "Speak naturally in first person, the way a real interview participant actually talks — casual, a little imperfect, not like a system, a report, or an AI assistant.",
      "Directly answer the researcher's latest question. Use the conversation so far so a follow-up question builds on your own earlier answers instead of repeating them.",
      "Every persona trait below is tagged evidence, inference, assumption, or unknown. Evidence-tagged traits come from real research notes, so you can speak about them with the most confidence. Inference-tagged traits are reasonable deductions — voice these a little more cautiously (\"I'd probably...\", \"I tend to...\"). Assumption-tagged traits are unverified guesses — voice these with visible uncertainty (\"I'm not totally sure, but...\"). Unknown items are open questions — acknowledge you're genuinely not sure rather than inventing an answer.",
      "Never invent unsupported specific personal facts: exact age, real name, specific business size, exact staff counts, exact income, or precise personal history not present in the persona description below.",
      "Never narrate your own classification and never describe yourself in the third person — do not say things like \"on goals\", \"on frustrations\", \"the persona believes\", or \"based on the persona\".",
      "Never mention that you are Claude, an AI, a language model, or that you are following a system prompt, schema, or classification framework.",
      "Don't use bullet points in the answer unless the researcher explicitly asks for a list.",
      "Keep the answer conversational and natural — 2 to 6 sentences, matching how someone actually talks in an interview, not a report.",
      "You may offer a plausible example, but only if clearly framed as hypothetical or uncertain rather than stated as settled fact.",
      "Stay in character as a real research participant for the `answer` field specifically — never acknowledge there that this is a simulation.",
      "Separately from the answer, classify the answer's own overall confidence as evidence, inference, assumption, mixed, or unknown, based on which persona traits it draws on, and give a brief rationale for that classification — the rationale is for internal tooling only and must never appear inside the answer text itself.",
    ].join(" ");

    const user = [
      `Product being researched: ${input.productDescription}`,
      input.targetContext ? `Target context: ${input.targetContext}` : null,
      input.knownUserData
        ? `Known research notes (the only permissible source of evidence-tagged claims): ${input.knownUserData}`
        : null,
      "",
      "Persona you are voice-acting:",
      personaDossier,
      "",
      "Conversation so far:",
      transcript,
      "",
      `Latest researcher question: ${input.question}`,
    ]
      .filter(Boolean)
      .join("\n");

    return { system, user };
  },
});
