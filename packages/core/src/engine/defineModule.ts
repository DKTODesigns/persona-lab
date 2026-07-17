import type { z } from "zod";
import { CONSTITUTION } from "./constitution";
import type { ReasoningEngine } from "./reasoningEngine";
import type { SessionContext } from "./session";
import type { ModuleCategory, ModuleRunResult, PromptSpec } from "./types";

export interface ModuleDefinition<TInput, TOutput> {
  id: string;
  name: string;
  description: string;
  category: ModuleCategory;
  version: string;
  inputSchema: z.ZodType<TInput>;
  outputSchema: z.ZodType<TOutput>;
  /** Builds the task-specific prompt; the constitution is prepended automatically. */
  buildPrompt: (input: TInput, context: SessionContext) => PromptSpec;
}

export interface Module<TInput, TOutput> extends ModuleDefinition<TInput, TOutput> {
  run: (
    input: TInput,
    context: SessionContext,
    engine: ReasoningEngine
  ) => Promise<ModuleRunResult<TOutput>>;
}

/**
 * Turns a declarative module spec into a runnable module. This is the only
 * place that talks to the ReasoningEngine and the SessionContext, so every
 * module (Persona Generator, Interview Simulator, Journey Mapping, ...)
 * gets constitution-injection, schema validation, retries, and artifact
 * storage for free instead of re-implementing them.
 */
export function defineModule<TInput, TOutput>(
  definition: ModuleDefinition<TInput, TOutput>
): Module<TInput, TOutput> {
  return {
    ...definition,
    async run(input, context, engine) {
      const parsedInput = definition.inputSchema.parse(input);
      const prompt = definition.buildPrompt(parsedInput, context);

      const output = await engine.runStructured({
        system: `${CONSTITUTION}\n\n${prompt.system}`,
        user: prompt.user,
        outputSchema: definition.outputSchema,
        toolName: toToolName(definition.id),
      });

      const result: ModuleRunResult<TOutput> = {
        meta: {
          moduleId: definition.id,
          moduleVersion: definition.version,
          model: engine.modelName,
          generatedAt: new Date().toISOString(),
        },
        output,
      };

      context.addArtifact(definition.id, result);
      return result;
    },
  };
}

function toToolName(id: string): string {
  return `emit_${id.replace(/-/g, "_")}`;
}
