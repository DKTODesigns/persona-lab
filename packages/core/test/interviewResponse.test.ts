import { describe, expect, it, vi } from "vitest";
import { ReasoningEngine } from "../src/engine/reasoningEngine";
import { SessionContext } from "../src/engine/session";
import { interviewResponseModule } from "../src/modules/interviewResponse";
import type { InterviewResponseInput } from "../src/modules/interviewResponse";

function fakeAnthropicClient(responses: Array<{ stopReason?: string; input: unknown }>) {
  const create = vi.fn();
  for (const response of responses) {
    create.mockResolvedValueOnce({
      stop_reason: response.stopReason ?? "tool_use",
      content: [{ type: "tool_use", id: "toolu_1", name: "emit_interview_response", input: response.input }],
    });
  }
  return { messages: { create } };
}

const BASE_PERSONA = {
  name: "Test Persona",
  summary: "A sample persona for testing.",
  goals: [{ statement: "Wants a quick answer.", confidence: "evidence" as const, rationale: "From the notes." }],
  frustrations: [] as never[],
  behaviors: [] as never[],
  contextOfUse: [] as never[],
  accessibilityConsiderations: [] as never[],
};

const BASE_INPUT: InterviewResponseInput = {
  persona: BASE_PERSONA,
  messages: [],
  question: "What usually happens?",
  productDescription: "A test product.",
};

describe("interviewResponseModule", () => {
  it("returns a valid structured response", async () => {
    const output = { answer: "Usually, I just deal with it as it comes up.", confidence: "inference", confidenceRationale: "Based on an inferred goal." };
    const client = fakeAnthropicClient([{ input: output }]);
    const engine = new ReasoningEngine({ client: client as never });

    const result = await interviewResponseModule.run(BASE_INPUT, new SessionContext(), engine);

    expect(result.output.answer).toBe(output.answer);
    expect(result.output.confidence).toBe("inference");
    expect(client.messages.create).toHaveBeenCalledTimes(1);
  });

  it.each(["evidence", "inference", "assumption", "mixed", "unknown"] as const)(
    "accepts confidence value %s",
    async (confidence) => {
      const client = fakeAnthropicClient([{ input: { answer: "ok", confidence, confidenceRationale: "r" } }]);
      const engine = new ReasoningEngine({ client: client as never });

      const result = await interviewResponseModule.run(BASE_INPUT, new SessionContext(), engine);

      expect(result.output.confidence).toBe(confidence);
    }
  );

  it("retries once on malformed output and succeeds on the second attempt", async () => {
    const client = fakeAnthropicClient([
      { input: { answer: "ok", confidence: "not-a-real-value", confidenceRationale: "r" } },
      { input: { answer: "ok", confidence: "mixed", confidenceRationale: "r" } },
    ]);
    const engine = new ReasoningEngine({ client: client as never });

    const result = await interviewResponseModule.run(BASE_INPUT, new SessionContext(), engine);

    expect(client.messages.create).toHaveBeenCalledTimes(2);
    expect(result.output.confidence).toBe("mixed");
  });

  it("fails immediately without retrying when the model hits the token budget", async () => {
    const client = fakeAnthropicClient([{ stopReason: "max_tokens", input: {} }]);
    const engine = new ReasoningEngine({ client: client as never });

    await expect(interviewResponseModule.run(BASE_INPUT, new SessionContext(), engine)).rejects.toThrow(/truncated/i);
    expect(client.messages.create).toHaveBeenCalledTimes(1);
  });

  it("bounds the conversation history included in the prompt to the most recent turns", () => {
    const manyMessages: InterviewResponseInput["messages"] = Array.from({ length: 30 }, (_, index) => ({
      role: index % 2 === 0 ? "researcher" : "participant",
      text: `Message ${index}`,
    }));

    const prompt = interviewResponseModule.buildPrompt({ ...BASE_INPUT, messages: manyMessages }, new SessionContext());

    expect(prompt.user).not.toContain("Message 0");
    expect(prompt.user).not.toContain("Message 17");
    expect(prompt.user).toContain("Message 18");
    expect(prompt.user).toContain("Message 29");
  });

  it("instructs the model to stay in character and never narrate its own classification", () => {
    const prompt = interviewResponseModule.buildPrompt(BASE_INPUT, new SessionContext());

    expect(prompt.system).toMatch(/on goals/i);
    expect(prompt.system).toMatch(/never mention that you are claude/i);
    expect(prompt.system).toMatch(/voice-acting/i);
  });
});
