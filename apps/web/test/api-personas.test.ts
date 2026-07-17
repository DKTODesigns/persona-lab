import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const runMock = vi.fn();

vi.mock("@personalab/core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@personalab/core")>();
  return {
    ...actual,
    personaGeneratorModule: {
      ...actual.personaGeneratorModule,
      run: runMock,
    },
  };
});

const { POST } = await import("../app/api/personas/route");

const VALID_INPUT = {
  productDescription: "A budgeting app for freelancers.",
  targetContext: "",
  knownUserData: "",
  personaCount: 2,
};

const FAKE_OUTPUT = {
  personas: [
    {
      name: "Test Persona",
      summary: "A sample persona for route testing.",
      goals: [{ statement: "Wants clarity", confidence: "inference", rationale: "Derived from context." }],
      frustrations: [],
      behaviors: [],
      accessibilityConsiderations: [],
      contextOfUse: [],
    },
  ],
  openQuestions: ["Is this true for real users?"],
  overallConfidenceNote: "No user research was provided.",
};

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/personas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/personas", () => {
  beforeEach(() => {
    runMock.mockReset();
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
    vi.stubEnv("USE_MOCK_PERSONAS", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns a valid generation response for valid input", async () => {
    runMock.mockResolvedValue({
      meta: { moduleId: "persona-generator", moduleVersion: "0.1.0", model: "claude-sonnet-5", generatedAt: "now" },
      output: FAKE_OUTPUT,
    });

    const response = await POST(makeRequest(VALID_INPUT));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.result.personas).toHaveLength(1);
    expect(body.result.personas[0].name).toBe("Test Persona");
  });

  it("forwards the requested persona count to the generator module", async () => {
    runMock.mockResolvedValue({ meta: {}, output: FAKE_OUTPUT });

    await POST(makeRequest({ ...VALID_INPUT, personaCount: 5 }));

    expect(runMock).toHaveBeenCalledTimes(1);
    const [calledInput] = runMock.mock.calls[0]!;
    expect(calledInput.personaCount).toBe(5);
  });

  it("returns a safe error on API/module failure without leaking internal details", async () => {
    runMock.mockRejectedValue(new Error("upstream exploded: dumping request payload xyz"));

    const response = await POST(makeRequest(VALID_INPUT));
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body.error.type).toBe("generation_failed");
    expect(body.error.message).not.toMatch(/upstream exploded/i);
    expect(body.error.message).not.toMatch(/payload/i);
  });

  it("returns a safe 'not configured' error and never calls the model when the API key is missing", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");

    const response = await POST(makeRequest(VALID_INPUT));
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error.type).toBe("not_configured");
    expect(runMock).not.toHaveBeenCalled();
  });

  it("rejects invalid input before calling the model", async () => {
    const response = await POST(makeRequest({ productDescription: "" }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.type).toBe("invalid_input");
    expect(runMock).not.toHaveBeenCalled();
  });

  it("uses the mock generator and never calls the model when USE_MOCK_PERSONAS is true", async () => {
    vi.stubEnv("USE_MOCK_PERSONAS", "true");

    const response = await POST(
      makeRequest({
        productDescription: "Aurora Calm is an AI-powered emotional wellness application for stress and coping.",
        targetContext: "",
        knownUserData: "",
        personaCount: 2,
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(runMock).not.toHaveBeenCalled();
    const names = body.result.personas.map((persona: { name: string }) => persona.name);
    expect(names).toContain("Alex Rivera");
  });

  it("mock mode still respects the requested persona count", async () => {
    vi.stubEnv("USE_MOCK_PERSONAS", "true");

    const response = await POST(makeRequest({ ...VALID_INPUT, personaCount: 4 }));
    const body = await response.json();

    expect(body.result.personas).toHaveLength(4);
  });
});
