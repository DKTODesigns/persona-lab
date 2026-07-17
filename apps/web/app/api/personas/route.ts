import { NextResponse } from "next/server";
import {
  PersonaGeneratorInputSchema,
  ReasoningEngine,
  SessionContext,
  personaGeneratorModule,
  type PersonaGeneratorInput,
} from "@personalab/core";
import { generateMockPersonaOutput } from "@/lib/mock-data";
import type { PersonaFormValues } from "@/lib/types";

// Runs on the Node.js server runtime (Next's default for route handlers) —
// never bundled to the client, so this is the one place ANTHROPIC_API_KEY is
// read. Nothing in this file is reachable from client-side code.

type ErrorType = "invalid_input" | "not_configured" | "generation_failed";

function errorResponse(status: number, type: ErrorType, message: string) {
  return NextResponse.json({ error: { type, message } }, { status });
}

function toFormValues(input: PersonaGeneratorInput): PersonaFormValues {
  return {
    productDescription: input.productDescription,
    targetContext: input.targetContext ?? "",
    knownUserData: input.knownUserData ?? "",
    personaCount: input.personaCount,
  };
}

export async function POST(request: Request) {
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return errorResponse(400, "invalid_input", "The request could not be read.");
  }

  const parsedInput = PersonaGeneratorInputSchema.safeParse(rawBody);
  if (!parsedInput.success) {
    return errorResponse(
      400,
      "invalid_input",
      "The submitted research brief is incomplete or invalid. Add a product description and try again."
    );
  }

  if (process.env.USE_MOCK_PERSONAS === "true") {
    const result = generateMockPersonaOutput(toFormValues(parsedInput.data));
    return NextResponse.json({ result });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    // Safe to log that the key is missing; never log the key itself or any
    // submitted content.
    console.error("[api/personas] ANTHROPIC_API_KEY is not set.");
    return errorResponse(
      503,
      "not_configured",
      "Persona generation isn't available right now because the server isn't configured with an API key."
    );
  }

  try {
    const engine = new ReasoningEngine();
    const session = new SessionContext();
    const { output } = await personaGeneratorModule.run(parsedInput.data, session, engine);
    return NextResponse.json({ result: output });
  } catch (error) {
    // Log only the error message (schema/SDK-level, e.g. "invalid_api_key",
    // "rate_limited", or a Zod validation summary) — never the full error
    // object, and never the submitted product description or research notes.
    console.error(
      "[api/personas] generation failed:",
      error instanceof Error ? error.message : "unknown error"
    );
    return errorResponse(
      502,
      "generation_failed",
      "PersonaLab couldn't generate personas from that input just now. This wasn't caused by anything you entered — please try again."
    );
  }
}
