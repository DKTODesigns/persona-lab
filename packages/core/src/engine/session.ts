import type { ModuleRunResult } from "./types";

/**
 * Holds artifacts produced by modules during a single run (one CLI invocation
 * or one browser session). Intentionally in-memory only — no persistence.
 */
export class SessionContext {
  private readonly artifacts = new Map<string, ModuleRunResult<unknown>>();

  addArtifact(moduleId: string, result: ModuleRunResult<unknown>): void {
    this.artifacts.set(moduleId, result);
  }

  getArtifact<T>(moduleId: string): ModuleRunResult<T> | undefined {
    return this.artifacts.get(moduleId) as ModuleRunResult<T> | undefined;
  }

  getAllArtifacts(): ReadonlyMap<string, ModuleRunResult<unknown>> {
    return this.artifacts;
  }
}
