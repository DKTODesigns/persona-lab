export { ReasoningEngine } from "./engine/reasoningEngine";
export type { ReasoningEngineOptions } from "./engine/reasoningEngine";

export { SessionContext } from "./engine/session";
export { defineModule } from "./engine/defineModule";
export type { Module, ModuleDefinition } from "./engine/defineModule";
export { CONSTITUTION } from "./engine/constitution";
export type { ModuleCategory, ModuleRunMeta, ModuleRunResult, PromptSpec } from "./engine/types";

export { ClaimSchema, ConfidenceLevel } from "./schemas/shared/claim";
export type { Claim } from "./schemas/shared/claim";

export {
  personaGeneratorModule,
  PersonaGeneratorInputSchema,
  PersonaGeneratorOutputSchema,
  PersonaSchema,
} from "./modules/personaGenerator";
export type { PersonaGeneratorInput, PersonaGeneratorOutput, Persona } from "./modules/personaGenerator";

export {
  interviewResponseModule,
  InterviewResponseInputSchema,
  InterviewResponseOutputSchema,
  InterviewConfidenceSchema,
} from "./modules/interviewResponse";
export type { InterviewResponseInput, InterviewResponseOutput, InterviewConfidence } from "./modules/interviewResponse";

export { listModules, getModule, registerModule } from "./registry";
export type { ModuleSummary } from "./registry";
