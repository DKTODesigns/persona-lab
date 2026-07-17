import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export interface ReasoningEngineOptions {
  apiKey?: string;
  model?: string;
  maxRetries?: number;
  /** Structured-output token budget. Defaults to ANTHROPIC_MAX_OUTPUT_TOKENS
   * (validated) or DEFAULT_MAX_OUTPUT_TOKENS if unset/invalid. */
  maxOutputTokens?: number;
  /** Inject a pre-built client (used by tests to avoid real API calls). */
  client?: Anthropic;
}

export interface RunStructuredParams<T> {
  system: string;
  user: string;
  outputSchema: z.ZodType<T>;
  /** Name of the tool the model must call; also used as the schema id. */
  toolName: string;
}

const DEFAULT_MODEL = "claude-sonnet-5";

// 8192 is a conservative, broadly-supported non-beta output ceiling for the
// current Claude Sonnet family — large enough for several detailed personas
// (5 claim categories each) without requesting an excessive budget.
const DEFAULT_MAX_OUTPUT_TOKENS = 8192;
const MIN_MAX_OUTPUT_TOKENS = 256;
const MAX_MAX_OUTPUT_TOKENS = 8192;

function resolveMaxOutputTokens(override?: number): number {
  if (override !== undefined) return override;

  const raw = process.env.ANTHROPIC_MAX_OUTPUT_TOKENS;
  if (!raw) return DEFAULT_MAX_OUTPUT_TOKENS;

  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < MIN_MAX_OUTPUT_TOKENS || parsed > MAX_MAX_OUTPUT_TOKENS) {
    console.warn(
      `[ReasoningEngine] ANTHROPIC_MAX_OUTPUT_TOKENS="${raw}" is invalid or outside the safe range ` +
        `${MIN_MAX_OUTPUT_TOKENS}-${MAX_MAX_OUTPUT_TOKENS}; falling back to ${DEFAULT_MAX_OUTPUT_TOKENS}.`
    );
    return DEFAULT_MAX_OUTPUT_TOKENS;
  }
  return parsed;
}

/**
 * The single point of contact with Claude. Every module runs its prompts
 * through this engine instead of calling the Anthropic SDK directly, so
 * model config, retries, and structured-output handling live in one place.
 */
export class ReasoningEngine {
  private readonly client: Anthropic;
  private readonly model: string;
  private readonly maxRetries: number;
  private readonly maxOutputTokens: number;

  constructor(options: ReasoningEngineOptions = {}) {
    const apiKey = options.apiKey ?? process.env.ANTHROPIC_API_KEY;
    if (!options.client && !apiKey) {
      throw new Error(
        "ReasoningEngine requires an Anthropic API key. Set ANTHROPIC_API_KEY or pass apiKey/client explicitly."
      );
    }
    this.client = options.client ?? new Anthropic({ apiKey });
    this.model = options.model ?? DEFAULT_MODEL;
    this.maxRetries = options.maxRetries ?? 1;
    this.maxOutputTokens = resolveMaxOutputTokens(options.maxOutputTokens);
  }

  get modelName(): string {
    return this.model;
  }

  /**
   * Calls Claude with tool-use forced to `toolName`, so the response is
   * structured JSON rather than free text, then validates it against
   * `outputSchema`. Retries once with the validation error fed back if the
   * model's first response doesn't match — except when the response was cut
   * off by the token budget (stop_reason "max_tokens"), which is not
   * retried: the same budget would truncate an identical retry the same way.
   */
  async runStructured<T>(params: RunStructuredParams<T>): Promise<T> {
    const { system, user, outputSchema, toolName } = params;
    const inputSchema = toJsonSchema(outputSchema);

    let lastError: string | undefined;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      const userMessage = lastError ? buildRetryMessage(user, lastError) : user;

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxOutputTokens,
        system,
        messages: [{ role: "user", content: userMessage }],
        tools: [
          {
            name: toolName,
            description: `Return output that matches the ${toolName} schema exactly.`,
            input_schema: inputSchema as Anthropic.Tool.InputSchema,
          },
        ],
        tool_choice: { type: "tool", name: toolName },
      });

      if (response.stop_reason === "max_tokens") {
        throw new Error(
          `Model output was truncated because it exceeded the configured token budget ` +
            `(max_tokens=${this.maxOutputTokens}). Retrying would truncate identically — increase ` +
            "ANTHROPIC_MAX_OUTPUT_TOKENS or reduce the requested output size (e.g. persona count)."
        );
      }

      const toolUseBlock = response.content.find(
        (block) => block.type === "tool_use"
      ) as Anthropic.Messages.ToolUseBlock | undefined;

      if (!toolUseBlock) {
        lastError =
          "No tool call was made at all — you must respond by calling the provided tool with a complete JSON object matching its schema.";
        continue;
      }

      const parsed = outputSchema.safeParse(toolUseBlock.input);
      if (parsed.success) {
        return parsed.data;
      }
      lastError = formatValidationIssues(parsed.error);
    }

    throw new Error(
      `ReasoningEngine failed to produce valid structured output after ${this.maxRetries + 1} attempt(s): ${lastError}`
    );
  }
}

function toJsonSchema(schema: z.ZodType<unknown>): Record<string, unknown> {
  // $refStrategy: "none" fully inlines the schema (no $ref/definitions).
  // Anthropic's tool-use schema resolution isn't guaranteed to follow JSON
  // Reference pointers reliably, especially the deep in-tree pointers
  // zod-to-json-schema emits by default for repeated sub-schemas (e.g. the
  // same Claim shape reused across five persona fields) — inlining removes
  // that ambiguity entirely.
  const raw = zodToJsonSchema(schema, { target: "jsonSchema7", $refStrategy: "none" }) as Record<
    string,
    unknown
  >;
  const { $schema, ...rest } = raw;
  return rest;
}

/**
 * Turns a ZodError into an explicit, per-field problem list: whether each
 * field is missing entirely or the wrong type, and what type was expected.
 * Fed back to the model on retry so it can fix the exact fields that failed
 * rather than guessing.
 */
function formatValidationIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join(".") : "(root)";
      if (issue.code === "invalid_type") {
        return issue.received === "undefined"
          ? `- Missing required field "${path}": expected ${issue.expected}.`
          : `- Invalid field "${path}": expected ${issue.expected}, received ${issue.received}.`;
      }
      return `- Field "${path}": ${issue.message}`;
    })
    .join("\n");
}

function buildRetryMessage(originalUser: string, issues: string): string {
  return [
    originalUser,
    "",
    "Your previous response did not match the required schema. Specific problems:",
    issues,
    "",
    "Return the complete corrected JSON object via the tool call — every required field must be present, including fields that were already correct. Do not return a partial object, a diff, or only the fixed fields.",
  ].join("\n");
}
