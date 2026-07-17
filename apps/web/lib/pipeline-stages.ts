// A single request to /api/personas is one atomic model call — there's no
// real signal for finer-grained progress than "preparing" vs. "waiting on
// the model" vs. "done", so these stages are a coarse, honest mapping onto
// that lifecycle rather than genuinely independent steps we can observe.
export const PIPELINE_STAGES = [
  "Validating research brief",
  "Preparing product context",
  "Generating persona hypotheses",
  "Classifying claims",
  "Creating validation questions",
] as const;
