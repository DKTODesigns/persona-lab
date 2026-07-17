import { NextResponse } from "next/server";
import { InterviewResponseInputSchema, ReasoningEngine, SessionContext, interviewResponseModule } from "@personalab/core";

// Runs on the Node.js server runtime (Next's default for route handlers) —
// never bundled to the client, so this is the one place ANTHROPIC_API_KEY is
// read. Nothing in this file is reachable from client-side code.

type ErrorType = "invalid_input" | "not_configured" | "generation_failed";

function errorResponse(status: number, type: ErrorType, message: string) {
  return NextResponse.json({ error: { type, message } }, { status });
}

// Interview answers are short (2-6 sentences) — a much smaller budget than
// full persona generation, which keeps latency down and makes a truncated,
// unusable response far less likely in the first place.
const INTERVIEW_MAX_OUTPUT_TOKENS = 1536;

export async function POST(request: Request) {
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return errorResponse(400, "invalid_input", "The request could not be read.");
  }

  const parsedInput = InterviewResponseInputSchema.safeParse(rawBody);
  if (!parsedInput.success) {
    return errorResponse(400, "invalid_input", "The interview request was incomplete or invalid.");
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    // Safe to log that the key is missing; never log the key itself or any
    // submitted content.
    console.error("[api/interview] ANTHROPIC_API_KEY is not set.");
    return errorResponse(
      503,
      "not_configured",
      "Live interview responses aren't available right now because the server isn't configured with an API key."
    );
  }

  try {
    const engine = new ReasoningEngine({ maxOutputTokens: INTERVIEW_MAX_OUTPUT_TOKENS });
    const session = new SessionContext();
    const { output } = await interviewResponseModule.run(parsedInput.data, session, engine);
    return NextResponse.json({ result: output });
  } catch (error) {
    // Log only the error message (schema/SDK-level) — never the full error
    // object, and never the submitted question or persona/research content.
    console.error(
      "[api/interview] generation failed:",
      error instanceof Error ? error.message : "unknown error"
    );
    return errorResponse(
      502,
      "generation_failed",
      "PersonaLab couldn't generate a response just now. This wasn't caused by anything you asked — please try again."
    );
  }
}
