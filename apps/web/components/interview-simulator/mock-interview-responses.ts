import type { Claim, ConfidenceLevel, Persona } from "@personalab/core";
import type { AnswerConfidenceLabel, InterviewMessage } from "./types";

type ClaimCategory = "goals" | "frustrations" | "behaviors" | "contextOfUse" | "accessibilityConsiderations";

type IntentId =
  | "recent-experience"
  | "workflow"
  | "time-pressure"
  | "trust-safety"
  | "mobile-device"
  | "notifications"
  | "accessibility"
  | "motivation-recognition"
  | "frustrations"
  | "improvements-ideal";

interface IntentConfig {
  /** Lead-in clauses, always comma/dash-terminated so a first-person claim
   * sentence (which always starts with a capitalized "I") can follow
   * directly — "Usually, I check..." reads correctly either way. */
  openers: string[];
  primaryCategory: ClaimCategory;
  secondaryCategory?: ClaimCategory;
}

// Ordered so more specific topics are checked before generic ones that share
// overlapping words (e.g. "last time" contains "time", so recent-experience
// must be checked before time-pressure).
const INTENT_KEYWORDS: Array<{ id: IntentId; keywords: string[] }> = [
  {
    id: "recent-experience",
    keywords: ["walk me through", "last time", "recent example", "example of a time", "tell me about a time", "tell me about the last"],
  },
  { id: "accessibility", keywords: ["accessib", "screen reader", "disab", "vision impair", "hearing impair"] },
  { id: "trust-safety", keywords: ["trust", "liability", "liable", "safety", " safe ", "legal", "risk"] },
  { id: "notifications", keywords: ["notification", "push alert", "remind", "alerts"] },
  { id: "mobile-device", keywords: ["mobile", "phone", "device", "tablet", "app on your"] },
  { id: "motivation-recognition", keywords: ["motivate", "motivation", "recognition", "reward", "incentive", "recognized"] },
  { id: "improvements-ideal", keywords: ["improve", "ideal", "perfect world", "wish", "dream scenario"] },
  { id: "frustrations", keywords: ["frustrat", "annoy", "bother", "hardest part", "pain point"] },
  { id: "time-pressure", keywords: ["under two minutes", "how long", "quickly", "quick as possible", "minutes", "speed", "fast as"] },
  { id: "workflow", keywords: ["workflow", "process", "usually happens", "what happens", "current process", "how do you", "how does it work", "typical day", "routine"] },
];

const INTENT_CONFIG: Record<IntentId, IntentConfig> = {
  "recent-experience": {
    openers: ["Let me think of a specific time.", "Sure, one example comes to mind.", "Off the top of my head,"],
    primaryCategory: "behaviors",
    secondaryCategory: "contextOfUse",
  },
  workflow: {
    openers: ["Usually,", "Most of the time,", "In practice,"],
    primaryCategory: "frustrations",
    secondaryCategory: "behaviors",
  },
  "time-pressure": {
    openers: ["Honestly,", "Realistically,", "For that to work,"],
    primaryCategory: "goals",
    secondaryCategory: "behaviors",
  },
  "trust-safety": {
    openers: ["That's something I think about.", "Honestly,", "To be honest,"],
    primaryCategory: "frustrations",
    secondaryCategory: "goals",
  },
  "mobile-device": {
    openers: ["Honestly,", "Most days,", "For me,"],
    primaryCategory: "contextOfUse",
  },
  notifications: {
    openers: ["Honestly,", "For me,", "When it comes to that,"],
    primaryCategory: "behaviors",
  },
  accessibility: {
    openers: ["On that front,", "Honestly,", "For me,"],
    primaryCategory: "accessibilityConsiderations",
  },
  "motivation-recognition": {
    openers: ["Honestly,", "For me,", "If I'm honest,"],
    primaryCategory: "goals",
  },
  frustrations: {
    openers: ["Honestly,", "If I'm being real,", "The big one for me is that"],
    primaryCategory: "frustrations",
  },
  "improvements-ideal": {
    openers: ["Ideally,", "In a perfect world,", "What would help most is that"],
    primaryCategory: "goals",
    secondaryCategory: "frustrations",
  },
};

const FALLBACK_CATEGORY_ROTATION: ClaimCategory[] = ["goals", "frustrations", "behaviors"];
const FALLBACK_OPENERS = ["Honestly,", "That's a good question —", "I'd say,"];

const FOLLOW_UP_CONNECTORS = ["Mainly because", "Usually because", "A lot of it comes down to", "Honestly, it's because"];

const UNKNOWN_PHRASES = [
  "I haven't really thought about that.",
  "That's a good question — I'm honestly not sure.",
  "I'd need to try it before I'd know.",
];

// English 3rd-person-singular present tense adds -s/-es/-ies to the base
// verb; our claim statements are all written with an implied 3rd-person
// subject ("Wants X", "Checks Y"), so stripping that suffix recovers the
// base form needed after "I".
function conjugateToFirstPerson(word: string): string {
  const lower = word.toLowerCase();
  if (lower === "is") return "am";
  if (lower === "has") return "have";
  if (lower === "does") return "do";
  if (lower.endsWith("ies")) return `${lower.slice(0, -3)}y`;
  if (/(sh|ch|x|ss|z|o)es$/.test(lower)) return lower.slice(0, -2);
  if (lower.endsWith("s")) return lower.slice(0, -1);
  return lower;
}

function lowerFirst(text: string): string {
  return text.length === 0 ? text : text.charAt(0).toLowerCase() + text.slice(1);
}

function capitalize(text: string): string {
  return text.length === 0 ? text : text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Turns a claim statement (always written with an implied 3rd-person
 * subject) into a bare first-person-compatible fragment — e.g. "Wants to
 * see monthly income at a glance." -> "want to see monthly income at a
 * glance", ready to follow "I ", "I probably ", etc. Returns null when the
 * statement doesn't start with a recognizable verb (general/impersonal
 * statements like "Cash flow gaps create planning difficulty") — callers
 * fall back to framing those as a spoken observation instead of forcing a
 * grammatical rewrite.
 */
function toFragment(statement: string): string | null {
  const clean = statement.replace(/\.$/, "").trim();
  const words = clean.split(/\s+/);
  const first = words[0]?.toLowerCase() ?? "";

  if (first === "whether") {
    const pronoun = words[1]?.toLowerCase();
    if (pronoun === "she" || pronoun === "he") {
      const verb = words[2];
      if (!verb) return null;
      const rest = words.slice(3).join(" ");
      return `${conjugateToFirstPerson(verb)}${rest ? ` ${rest}` : ""}`;
    }
    if (pronoun === "they") {
      return words.slice(2).join(" ") || null;
    }
    return words.slice(1).join(" ") || null;
  }

  if (first === "likely" || first === "may") {
    const next = words[1];
    if (!next) return null;
    const conjugated = first === "likely" ? conjugateToFirstPerson(next) : next.toLowerCase();
    const rest = words.slice(2).join(" ");
    return `${conjugated}${rest ? ` ${rest}` : ""}`;
  }

  const KNOWN_LEADING_VERBS = new Set([
    "wants",
    "prefers",
    "is",
    "distrusts",
    "checks",
    "feels",
    "finds",
    "opens",
    "abandons",
    "struggles",
    "uses",
    "reviews",
    "relies",
    "tries",
    "requires",
    "has",
    "does",
    "avoids",
    "sets",
    "logs",
    "reads",
    "tests",
    "explores",
    "likes",
    "needs",
    "expects",
    "hopes",
  ]);

  if (KNOWN_LEADING_VERBS.has(first)) {
    const rest = words.slice(1).join(" ");
    return `${conjugateToFirstPerson(first)}${rest ? ` ${rest}` : ""}`;
  }

  return null;
}

/** Renders one claim as a natural first-person sentence, with phrasing that
 * matches its confidence level: evidence is stated plainly, inference is
 * hedged ("I probably..."), assumption is cautious ("I'm not completely
 * sure, but..."), and unknown is acknowledged as genuinely unknown rather
 * than answered. */
function phraseClaim(claim: Claim, seed: number): string {
  const fragment = toFragment(claim.statement);
  const grounded = fragment !== null;
  const bare = fragment ?? lowerFirst(claim.statement.replace(/\.$/, ""));

  switch (claim.confidence) {
    case "evidence":
      return grounded ? capitalize(`I ${bare}.`) : capitalize(`${bare}.`);
    case "inference":
      return grounded ? `I probably ${bare}.` : `I'd guess ${bare}.`;
    case "assumption":
      return grounded ? `I'm not completely sure, but I ${bare}.` : `I'm not totally sure, but ${bare}.`;
    case "unknown":
      return grounded
        ? `I haven't really thought about whether I'd ${bare}.`
        : UNKNOWN_PHRASES[seed % UNKNOWN_PHRASES.length]!;
  }
}

function labelFromConfidences(confidences: ConfidenceLevel[]): AnswerConfidenceLabel {
  if (confidences.length === 0) return "mixed";
  const distinct = new Set(confidences);
  // A single underlying confidence level (all evidence, all inference, all
  // assumption, or all unknown) is reported as that exact value; a genuine
  // blend across levels is reported as "mixed" — same value set the live
  // /api/interview route returns, so mock and live answers render identically.
  return distinct.size === 1 ? (confidences[0] as AnswerConfidenceLabel) : "mixed";
}

function pick<T>(options: T[], seed: number): T {
  return options[((seed % options.length) + options.length) % options.length]!;
}

function claimAt(claims: Claim[], usageCount: number): Claim | undefined {
  if (claims.length === 0) return undefined;
  return claims[usageCount % claims.length];
}

function startsWithHedge(text: string): boolean {
  return /^(I'm not completely sure|I'm not totally sure|I'd guess|I haven't really thought)/.test(text);
}

/** Which categories a given researcher question would draw from — used both
 * to answer the *current* question and, via `countPriorCategoryUses`, to
 * replay history so repeated questions about the same topic advance to a
 * different claim each time instead of colliding on the same one. */
function categoriesForQuestion(question: string, historyBeforeQuestion: InterviewMessage[]): ClaimCategory[] {
  if (isFollowUpQuestion(question) && historyBeforeQuestion.some((message) => message.role === "researcher")) {
    return ["frustrations"];
  }
  const lower = question.toLowerCase();
  const matched = INTENT_KEYWORDS.find((entry) => entry.keywords.some((keyword) => lower.includes(keyword)));
  if (matched) {
    const config = INTENT_CONFIG[matched.id];
    return config.secondaryCategory ? [config.primaryCategory, config.secondaryCategory] : [config.primaryCategory];
  }
  return ["goals"]; // approximate stand-in for the fallback rotation — good enough for dedup purposes
}

/** Counts how many times a category has already been drawn from earlier in
 * the conversation, by replaying each prior researcher question in order.
 * This is what lets `claimAt` cycle through a category's claims instead of
 * two different questions about the same topic landing on the same claim
 * just because they happen to share a turn-index modulo. */
function countPriorCategoryUses(category: ClaimCategory, history: InterviewMessage[]): number {
  let count = 0;
  let runningHistory: InterviewMessage[] = [];
  for (const message of history) {
    if (message.role === "researcher") {
      if (categoriesForQuestion(message.text, runningHistory).includes(category)) {
        count += 1;
      }
    }
    runningHistory = [...runningHistory, message];
  }
  return count;
}

function isFollowUpQuestion(question: string): boolean {
  const q = question.toLowerCase().trim();
  return (
    /^why\b/.test(q) ||
    q.includes("why is that") ||
    q.includes("why does that") ||
    q.includes("why did that") ||
    q.includes("say more") ||
    q.includes("tell me more") ||
    q.includes("can you elaborate") ||
    q.includes("what do you mean") ||
    /^(and|so) /.test(q) ||
    q === "go on?" ||
    q === "go on"
  );
}

function buildFollowUpResponse(persona: Persona, turnIndex: number, history: InterviewMessage[]): InterviewMessage {
  const claims = persona.frustrations.length > 0 ? persona.frustrations : persona.behaviors;
  const usageCount = countPriorCategoryUses("frustrations", history);
  const claim = claimAt(claims, usageCount);
  if (!claim) {
    return {
      role: "participant",
      text: "I'd have to think about it more before I could say exactly why.",
      confidenceLabel: "mixed",
    };
  }
  const connector = pick(FOLLOW_UP_CONNECTORS, turnIndex);
  const fragment = toFragment(claim.statement);
  // Grounded fragments are bare verb phrases ("struggle to fit...") and need
  // an explicit subject after "because"; ungrounded ones are already framed
  // as general observations and don't take one ("because irregular income
  // makes budgeting unreliable").
  const clause = fragment ? `I ${fragment}` : lowerFirst(claim.statement.replace(/\.$/, ""));
  return {
    role: "participant",
    text: `${connector} ${clause}.`,
    confidenceLabel: labelFromConfidences([claim.confidence]),
  };
}

function buildGenericFallback(persona: Persona, turnIndex: number, history: InterviewMessage[]): InterviewMessage {
  const category = FALLBACK_CATEGORY_ROTATION[turnIndex % FALLBACK_CATEGORY_ROTATION.length]!;
  const usageCount = countPriorCategoryUses(category, history);
  const claim = claimAt(persona[category], usageCount);
  if (!claim) {
    return {
      role: "participant",
      text: "That's a fair question — I don't have a strong reaction to it, honestly.",
      confidenceLabel: "mixed",
    };
  }
  const opener = pick(FALLBACK_OPENERS, turnIndex);
  return {
    role: "participant",
    text: `${opener} ${phraseClaim(claim, usageCount)}`,
    confidenceLabel: labelFromConfidences([claim.confidence]),
  };
}

function composeIntentResponse(
  persona: Persona,
  turnIndex: number,
  history: InterviewMessage[],
  config: IntentConfig
): InterviewMessage {
  const primaryUsage = countPriorCategoryUses(config.primaryCategory, history);
  const primaryClaim = claimAt(persona[config.primaryCategory], primaryUsage);
  const secondaryUsage = config.secondaryCategory ? countPriorCategoryUses(config.secondaryCategory, history) : 0;
  const secondaryClaim = config.secondaryCategory ? claimAt(persona[config.secondaryCategory], secondaryUsage) : undefined;

  if (!primaryClaim && !secondaryClaim) {
    return buildGenericFallback(persona, turnIndex, history);
  }

  const confidences: ConfidenceLevel[] = [];
  const sentences: string[] = [];

  const primaryPhrase = primaryClaim ? phraseClaim(primaryClaim, primaryUsage) : null;
  if (primaryPhrase) {
    // Skip the intent opener when the claim's own confidence-hedge already
    // opens the sentence ("I'm not completely sure, but...") — stacking both
    // reads as a redundant double-hedge.
    if (!startsWithHedge(primaryPhrase)) {
      sentences.push(pick(config.openers, turnIndex));
    }
    sentences.push(primaryPhrase);
    confidences.push(primaryClaim!.confidence);
  } else {
    sentences.push(pick(config.openers, turnIndex));
  }

  if (secondaryClaim) {
    sentences.push(phraseClaim(secondaryClaim, secondaryUsage));
    confidences.push(secondaryClaim.confidence);
  }

  return {
    role: "participant",
    text: sentences.join(" "),
    confidenceLabel: labelFromConfidences(confidences),
  };
}

/**
 * Deterministic mock participant response — no Claude call, no randomness
 * (variety comes from `turnIndex`, which only advances when a new message is
 * actually sent, so the same conversation state always produces the same
 * output). `history` is the conversation so far, used both to compute the
 * turn number and to detect follow-up questions ("why does that happen?")
 * so a follow-up builds on the previous answer instead of repeating a
 * generic response.
 */
export function generateMockParticipantResponse(
  persona: Persona,
  question: string,
  history: InterviewMessage[]
): InterviewMessage {
  const turnIndex = history.filter((message) => message.role === "participant").length;

  if (isFollowUpQuestion(question) && history.some((message) => message.role === "researcher")) {
    return buildFollowUpResponse(persona, turnIndex, history);
  }

  const lowerQuestion = question.toLowerCase();
  const matchedIntent = INTENT_KEYWORDS.find((entry) => entry.keywords.some((keyword) => lowerQuestion.includes(keyword)));

  if (!matchedIntent) {
    return buildGenericFallback(persona, turnIndex, history);
  }

  return composeIntentResponse(persona, turnIndex, history, INTENT_CONFIG[matchedIntent.id]);
}
