export type ModuleCategory = "Research" | "Evaluation" | "Synthesis" | "Reporting";

export interface PromptSpec {
  system: string;
  user: string;
}

export interface ModuleRunMeta {
  moduleId: string;
  moduleVersion: string;
  model: string;
  generatedAt: string;
}

export interface ModuleRunResult<T> {
  meta: ModuleRunMeta;
  output: T;
}
