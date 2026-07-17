import { describe, expect, it, vi } from "vitest";
import { ReasoningEngine } from "../src/engine/reasoningEngine";
import { SessionContext } from "../src/engine/session";
import { personaGeneratorModule } from "../src/modules/personaGenerator";

function fakeAnthropicClient(toolInput: unknown) {
  return {
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [{ type: "tool_use", id: "toolu_1", name: "emit_persona_generator", input: toolInput }],
      }),
    },
  };
}

describe("personaGeneratorModule", () => {
  it("runs through the reasoning engine and returns schema-valid output", async () => {
    const fakeOutput = {
      personas: [
        {
          name: "Test Persona",
          summary: "A sample persona for testing the module pipeline.",
          goals: [
            {
              statement: "Complete tasks quickly",
              confidence: "inference",
              rationale: "Derived from the product description; not backed by user data.",
            },
          ],
          frustrations: [],
          behaviors: [],
          accessibilityConsiderations: [],
          contextOfUse: [],
        },
      ],
      openQuestions: ["Do real users share this goal?"],
      overallConfidenceNote: "No user research was provided; all claims are inference or assumption.",
    };

    const client = fakeAnthropicClient(fakeOutput);
    const engine = new ReasoningEngine({ client: client as never });
    const session = new SessionContext();

    const result = await personaGeneratorModule.run(
      { productDescription: "A budgeting app for freelancers.", personaCount: 1 },
      session,
      engine
    );

    expect(result.output.personas).toHaveLength(1);
    expect(result.output.personas[0]?.goals[0]?.confidence).toBe("inference");
    expect(result.meta.moduleId).toBe("persona-generator");
    expect(session.getArtifact("persona-generator")).toBeDefined();
    expect(client.messages.create).toHaveBeenCalledTimes(1);
  });

  it("rejects malformed input before calling the model", async () => {
    const client = fakeAnthropicClient({});
    const engine = new ReasoningEngine({ client: client as never });
    const session = new SessionContext();

    await expect(
      personaGeneratorModule.run({ productDescription: "" } as never, session, engine)
    ).rejects.toThrow();
    expect(client.messages.create).not.toHaveBeenCalled();
  });

  it("retries once when the model returns output that fails schema validation, then succeeds", async () => {
    const create = vi
      .fn()
      .mockResolvedValueOnce({
        content: [
          { type: "tool_use", id: "toolu_1", name: "emit_persona_generator", input: { personas: "not-an-array" } },
        ],
      })
      .mockResolvedValueOnce({
        content: [
          {
            type: "tool_use",
            id: "toolu_2",
            name: "emit_persona_generator",
            input: {
              personas: [
                {
                  name: "Retry Persona",
                  summary: "Produced on the second attempt after malformed output.",
                  goals: [],
                  frustrations: [],
                  behaviors: [],
                  accessibilityConsiderations: [],
                  contextOfUse: [],
                },
              ],
              openQuestions: [],
              overallConfidenceNote: "note",
            },
          },
        ],
      });

    const client = { messages: { create } };
    const engine = new ReasoningEngine({ client: client as never });
    const session = new SessionContext();

    const result = await personaGeneratorModule.run(
      { productDescription: "A budgeting app for freelancers.", personaCount: 1 },
      session,
      engine
    );

    expect(create).toHaveBeenCalledTimes(2);
    expect(result.output.personas[0]?.name).toBe("Retry Persona");
  });

  it("retries and succeeds when openQuestions is returned as a single string instead of an array", async () => {
    const validOutput = {
      personas: [
        {
          name: "Corrected Persona",
          summary: "Valid on the second attempt.",
          goals: [],
          frustrations: [],
          behaviors: [],
          accessibilityConsiderations: [],
          contextOfUse: [],
        },
      ],
      openQuestions: ["What conditions affect adoption?", "What evidence would increase confidence?"],
      overallConfidenceNote: "Primarily inference; requires validation with real users.",
    };

    const create = vi
      .fn()
      .mockResolvedValueOnce({
        content: [
          {
            type: "tool_use",
            id: "toolu_1",
            name: "emit_persona_generator",
            input: {
              ...validOutput,
              openQuestions: "What conditions affect adoption? What evidence would increase confidence?",
            },
          },
        ],
      })
      .mockResolvedValueOnce({
        content: [{ type: "tool_use", id: "toolu_2", name: "emit_persona_generator", input: validOutput }],
      });

    const client = { messages: { create } };
    const engine = new ReasoningEngine({ client: client as never });
    const session = new SessionContext();

    const result = await personaGeneratorModule.run(
      { productDescription: "A budgeting app for freelancers.", personaCount: 1 },
      session,
      engine
    );

    expect(create).toHaveBeenCalledTimes(2);
    expect(result.output.openQuestions).toEqual(validOutput.openQuestions);

    const retryMessage = create.mock.calls[1]![0].messages[0].content as string;
    expect(retryMessage).toMatch(/openQuestions/);
    expect(retryMessage).toMatch(/expected array, received string/i);
    expect(retryMessage).toMatch(/complete corrected JSON object/i);
  });

  it("retries and succeeds when overallConfidenceNote is missing entirely", async () => {
    const { overallConfidenceNote, ...withoutNote } = {
      personas: [
        {
          name: "Corrected Persona",
          summary: "Valid on the second attempt.",
          goals: [],
          frustrations: [],
          behaviors: [],
          accessibilityConsiderations: [],
          contextOfUse: [],
        },
      ],
      openQuestions: ["Do target users share this frustration?"],
      overallConfidenceNote: "These personas are primarily based on inference and require validation.",
    };

    const create = vi
      .fn()
      .mockResolvedValueOnce({
        content: [{ type: "tool_use", id: "toolu_1", name: "emit_persona_generator", input: withoutNote }],
      })
      .mockResolvedValueOnce({
        content: [
          {
            type: "tool_use",
            id: "toolu_2",
            name: "emit_persona_generator",
            input: { ...withoutNote, overallConfidenceNote },
          },
        ],
      });

    const client = { messages: { create } };
    const engine = new ReasoningEngine({ client: client as never });
    const session = new SessionContext();

    const result = await personaGeneratorModule.run(
      { productDescription: "A budgeting app for freelancers.", personaCount: 1 },
      session,
      engine
    );

    expect(create).toHaveBeenCalledTimes(2);
    expect(result.output.overallConfidenceNote).toBe(overallConfidenceNote);

    const retryMessage = create.mock.calls[1]![0].messages[0].content as string;
    expect(retryMessage).toMatch(/Missing required field "overallConfidenceNote"/i);
    expect(retryMessage).toMatch(/expected string/i);
  });

  it("fails safely, without exposing internals, after two consecutive invalid responses", async () => {
    const malformed = {
      content: [
        {
          type: "tool_use",
          id: "toolu_x",
          name: "emit_persona_generator",
          input: { personas: [], openQuestions: "combined into one string" },
        },
      ],
    };

    const create = vi.fn().mockResolvedValue(malformed);
    const client = { messages: { create } };
    const engine = new ReasoningEngine({ client: client as never });
    const session = new SessionContext();

    await expect(
      personaGeneratorModule.run(
        { productDescription: "A budgeting app for freelancers.", personaCount: 1 },
        session,
        engine
      )
    ).rejects.toThrow(/failed to produce valid structured output after 2 attempt\(s\)/i);

    expect(create).toHaveBeenCalledTimes(2);
  });

  it("instructs the model that evidence may only come from knownUserData", () => {
    const withNotes = personaGeneratorModule.buildPrompt(
      {
        productDescription: "A budgeting app for freelancers.",
        targetContext: undefined,
        knownUserData: "Users told us they check balances weekly.",
        personaCount: 2,
      },
      new SessionContext()
    );

    expect(withNotes.system).toMatch(/only permissible source of evidence-tagged claims/i);
    expect(withNotes.system).toMatch(/never tag anything else as evidence/i);
    expect(withNotes.user).toMatch(/treat as the evidence source/i);
  });

  it("instructs the model to avoid evidence claims when no research notes are supplied", () => {
    const withoutNotes = personaGeneratorModule.buildPrompt(
      {
        productDescription: "A budgeting app for freelancers.",
        targetContext: undefined,
        knownUserData: undefined,
        personaCount: 2,
      },
      new SessionContext()
    );

    expect(withoutNotes.user).toMatch(/no user research data was provided/i);
    expect(withoutNotes.user).toMatch(/every persona trait must be inference, assumption, or unknown/i);
  });

  it("instructs the model to avoid stereotyping across the full protected category list", () => {
    const prompt = personaGeneratorModule.buildPrompt(
      { productDescription: "A budgeting app for freelancers.", targetContext: undefined, knownUserData: undefined, personaCount: 1 },
      new SessionContext()
    );

    for (const category of ["age", "gender", "culture", "disability", "ethnicity", "family status", "profession", "geography"]) {
      expect(prompt.user.toLowerCase()).toContain(category);
    }
  });
});
