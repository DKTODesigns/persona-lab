import type { Module } from "./engine/defineModule";
import { personaGeneratorModule } from "./modules/personaGenerator";

/**
 * Every module the platform exposes, registered once. CLI and web both
 * discover modules through this list rather than importing module files
 * directly, so adding Interview Simulator, Stakeholder Simulator, Journey
 * Mapping, Usability Evaluation, Accessibility Review, Research Synthesis,
 * UX Heuristic Evaluation, or Report Generation later is: write the module
 * file with defineModule(), then add one line here.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const modules: Module<any, any>[] = [personaGeneratorModule];

export interface ModuleSummary {
  id: string;
  name: string;
  description: string;
  category: string;
  version: string;
}

export function listModules(): ModuleSummary[] {
  return modules.map(({ id, name, description, category, version }) => ({
    id,
    name,
    description,
    category,
    version,
  }));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getModule(id: string): Module<any, any> | undefined {
  return modules.find((module) => module.id === id);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function registerModule(module: Module<any, any>): void {
  modules.push(module);
}
