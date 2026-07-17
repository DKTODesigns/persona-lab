import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const runMock = vi.fn();

vi.mock("@personalab/core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@personalab/core")>();
  return {
    ...actual,
    interviewResponseModule: {
      ...actual.interviewResponseModule,
      run: runMock,
    },
  };
});

const { POST } = await import("../app/api/interview/route");

const BASE_PERSONA = {
  name: "Test Persona",
  summary: "A sample persona for route testing.",
  goals: [{ statement: "Wants a quick answer.", confidence: "evidence", rationale: "From the notes." }],
  frustrations: [],
  behaviors: [],
  contextOfUse: [],
  accessibilityConsiderations: [],
};

const VALID_INPUT = {
  persona: BASE_PERSONA,
  messages: [],
  question: "What usually happens?",
  productDescription: "A test product.",
};

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/interview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/interview", () => {
  beforeEach(() => {
    runMock.mockReset();
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns a valid structured response for valid input", async () => {
    runMock.mockResolvedValue({
      meta: {},
      output: { answer: "Usually, I just deal with it as it comes up.", confidence: "inference", confidenceRationale: "r" },
    });

    const response = await POST(makeRequest(VALID_INPUT));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.result.answer).toBe("Usually, I just deal with it as it comes up.");
    expect(body.result.confidence).toBe("inference");
  });

  it.each(["evidence", "inference", "assumption", "mixed", "unknown"])(
    "passes through confidence value %s",
    async (confidence) => {
      runMock.mockResolvedValue({ meta: {}, output: { answer: "ok", confidence, confidenceRationale: "r" } });

      const response = await POST(makeRequest(VALID_INPUT));
      const body = await response.json();

      expect(body.result.confidence).toBe(confidence);
    }
  );

  it("rejects invalid input before calling the model", async () => {
    const response = await POST(makeRequest({ ...VALID_INPUT, question: "" }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.type).toBe("invalid_input");
    expect(runMock).not.toHaveBeenCalled();
  });

  it("rejects a request missing the persona entirely", async () => {
    const { persona, ...withoutPersona } = VALID_INPUT;
    const response = await POST(makeRequest(withoutPersona));

    expect(response.status).toBe(400);
    expect(runMock).not.toHaveBeenCalled();
  });

  it("returns a safe error on module failure without leaking internal details", async () => {
    runMock.mockRejectedValue(new Error("upstream exploded: dumping prompt content xyz"));

    const response = await POST(makeRequest(VALID_INPUT));
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body.error.type).toBe("generation_failed");
    expect(body.error.message).not.toMatch(/upstream exploded/i);
  });

  it("returns a safe 'not configured' error and never calls the model when the API key is missing", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");

    const response = await POST(makeRequest(VALID_INPUT));
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error.type).toBe("not_configured");
    expect(runMock).not.toHaveBeenCalled();
  });
});
