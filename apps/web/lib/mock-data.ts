import type { Claim, ConfidenceLevel, PersonaGeneratorOutput } from "@personalab/core";
import type { PersonaFormValues } from "./types";

function claim(statement: string, confidence: ConfidenceLevel, rationale: string): Claim {
  return { statement, confidence, rationale };
}

interface MockPersonaTemplate {
  name: string;
  summary: string;
  goals: (hasEvidence: boolean) => Claim[];
  frustrations: () => Claim[];
  behaviors: () => Claim[];
  accessibilityConsiderations: () => Claim[];
  contextOfUse: () => Claim[];
}

// Fixed pools of realistic archetypes, keyed by a keyword-detected "domain",
// so the full input -> loading -> results flow can be exercised without a
// live model call, and actually responds to what's typed instead of always
// returning the same content. Only the first persona in each pool
// demonstrates the evidence toggle, mirroring the real module: evidence-
// tagged claims only appear when knownUserData is provided.
const FINANCE_PERSONA_POOL: MockPersonaTemplate[] = [
  {
    name: "Maria Chen",
    summary: "Freelance graphic designer juggling three to five clients at a time.",
    goals: (hasEvidence) => [
      ...(hasEvidence
        ? [
            claim(
              "Wants to see monthly income at a glance.",
              "evidence",
              "Directly stated in the research notes you provided."
            ),
          ]
        : []),
      claim(
        "Prefers minimal manual data entry.",
        "inference",
        "Freelancers juggling multiple clients are unlikely to have time for manual bookkeeping."
      ),
      claim(
        "Is comfortable connecting bank accounts to the app.",
        "assumption",
        "No information was given about her comfort with financial data sharing."
      ),
    ],
    frustrations: () => [
      claim(
        "Irregular income makes budgeting from a fixed monthly figure unreliable.",
        "inference",
        "Follows directly from freelance income being described as irregular."
      ),
      claim(
        "Distrusts tools that require lengthy onboarding.",
        "assumption",
        "Common among time-constrained freelancers, but not confirmed for this audience."
      ),
    ],
    behaviors: () => [
      claim(
        "Checks account balances more often during slow client months.",
        "assumption",
        "A plausible behavior pattern, not derived from any given information."
      ),
      claim(
        "Whether she currently uses spreadsheets or dedicated accounting software.",
        "unknown",
        "The product description doesn't indicate her current tooling."
      ),
    ],
    accessibilityConsiderations: () => [
      claim(
        "May rely on screen magnification during long invoicing sessions due to eye strain.",
        "unknown",
        "No accessibility needs were described; flagged as an open consideration since none were ruled out."
      ),
    ],
    contextOfUse: () => [
      claim(
        "Likely reviews finances on a laptop rather than mobile, given the depth of the task.",
        "assumption",
        "Reasonable for detailed financial review, but not stated."
      ),
    ],
  },
  {
    name: "Devon Ruiz",
    summary: "Part-time rideshare driver supplementing a full-time job.",
    goals: () => [
      claim(
        "Wants a quick weekly snapshot rather than deep financial analysis.",
        "inference",
        "Part-time, supplemental income suggests lower time investment in financial tracking."
      ),
      claim(
        "Wants to set aside money for taxes automatically.",
        "assumption",
        "A common freelancer need, not confirmed for this persona specifically."
      ),
    ],
    frustrations: () => [
      claim(
        "Income varies day to day, making any fixed budget feel disconnected from reality.",
        "inference",
        "Follows from driving being described as variable, gig-based work."
      ),
    ],
    behaviors: () => [
      claim(
        "Likely checks the app primarily on a phone, between driving shifts.",
        "assumption",
        "Plausible given the on-the-go nature of the work, not confirmed."
      ),
    ],
    accessibilityConsiderations: () => [
      claim(
        "May be interacting one-handed or in short bursts, which limits how much text or interaction is reasonable at once.",
        "assumption",
        "Inferred from the mobile, in-between-shifts context, not confirmed."
      ),
    ],
    contextOfUse: () => [
      claim(
        "Whether he has a stable data connection while driving.",
        "unknown",
        "Not addressed by the information provided."
      ),
    ],
  },
  {
    name: "Priya Nair",
    summary: "Independent consultant managing a small number of large, infrequent invoices.",
    goals: () => [
      claim(
        "Wants to forecast income across a few large invoices rather than daily transactions.",
        "inference",
        "Follows from consulting work being described as large, infrequent invoices rather than frequent small ones."
      ),
    ],
    frustrations: () => [
      claim(
        "Cash flow gaps between invoice payments create planning difficulty.",
        "inference",
        "A direct consequence of infrequent, large invoices."
      ),
    ],
    behaviors: () => [
      claim(
        "Likely reviews finances monthly or per-invoice rather than daily.",
        "assumption",
        "Consistent with infrequent invoicing, but not confirmed."
      ),
    ],
    accessibilityConsiderations: () => [
      claim(
        "No accessibility needs were indicated.",
        "unknown",
        "Nothing in the product description addresses this."
      ),
    ],
    contextOfUse: () => [
      claim(
        "Whether she works with an accountant who also needs access to this data.",
        "unknown",
        "Not addressed by the information provided."
      ),
    ],
  },
  {
    name: "Sam Okafor",
    summary: "Early-career freelance writer new to managing self-employment finances.",
    goals: () => [
      claim(
        "Wants guidance, not just numbers — help understanding what the numbers mean.",
        "assumption",
        "Plausible for someone newer to self-employment, but not stated."
      ),
    ],
    frustrations: () => [
      claim(
        "Finds tax and expense categorization confusing.",
        "assumption",
        "Common for early-career freelancers, not confirmed here."
      ),
    ],
    behaviors: () => [
      claim(
        "May avoid looking at finances when income is low, out of anxiety.",
        "assumption",
        "A plausible avoidance pattern; not derived from given information."
      ),
    ],
    accessibilityConsiderations: () => [
      claim(
        "No accessibility needs were indicated.",
        "unknown",
        "Nothing in the product description addresses this."
      ),
    ],
    contextOfUse: () => [
      claim(
        "Whether they've used any budgeting tool before.",
        "unknown",
        "Not addressed by the information provided."
      ),
    ],
  },
  {
    name: "Elena Kowalski",
    summary: "Multi-platform gig worker combining delivery, rideshare, and task-based work.",
    goals: () => [
      claim(
        "Wants one place to see combined income from several platforms.",
        "inference",
        "Follows directly from working across multiple gig platforms."
      ),
    ],
    frustrations: () => [
      claim(
        "Reconciling income from several apps manually is time-consuming.",
        "inference",
        "A direct consequence of working across multiple platforms without a unified view."
      ),
    ],
    behaviors: () => [
      claim(
        "Likely switches between apps throughout the day.",
        "assumption",
        "Plausible for multi-platform gig work, not confirmed."
      ),
    ],
    accessibilityConsiderations: () => [
      claim(
        "No accessibility needs were indicated.",
        "unknown",
        "Nothing in the product description addresses this."
      ),
    ],
    contextOfUse: () => [
      claim(
        "Whether platform data can be imported automatically or must be entered by hand.",
        "unknown",
        "Not addressed by the information provided."
      ),
    ],
  },
  {
    name: "Jordan Blake",
    summary: "Part-time adjunct instructor and tutor with semester-based, lumpy income.",
    goals: () => [
      claim(
        "Wants to plan around semester payment gaps rather than a smooth monthly budget.",
        "inference",
        "Follows from income being tied to a semester teaching schedule rather than steady pay periods."
      ),
    ],
    frustrations: () => [
      claim(
        "Struggles to budget for summer or winter breaks when teaching income pauses entirely.",
        "inference",
        "A direct consequence of income being tied to the academic calendar."
      ),
    ],
    behaviors: () => [
      claim(
        "Likely sets money aside during teaching terms to cover gaps between semesters.",
        "assumption",
        "A plausible coping strategy for lumpy academic-calendar income, not confirmed."
      ),
    ],
    accessibilityConsiderations: () => [
      claim(
        "No accessibility needs were indicated.",
        "unknown",
        "Nothing in the product description addresses this."
      ),
    ],
    contextOfUse: () => [
      claim(
        "Whether they hold multiple part-time teaching contracts across different institutions at once.",
        "unknown",
        "Not addressed by the information provided."
      ),
    ],
  },
];

const WELLNESS_PERSONA_POOL: MockPersonaTemplate[] = [
  {
    name: "Alex Rivera",
    summary: "Mid-level manager at a fast-paced company, feeling burned out and stressed most weekdays.",
    goals: (hasEvidence) => [
      ...(hasEvidence
        ? [
            claim(
              "Wants a five-minute check-in he can do between meetings.",
              "evidence",
              "Directly stated in the research notes you provided."
            ),
          ]
        : []),
      claim(
        "Wants quick stress relief that fits into short work breaks.",
        "inference",
        "Follows from being described as juggling a fast-paced, high-stress job."
      ),
      claim(
        "Is open to an AI companion for emotional support rather than only human therapy.",
        "assumption",
        "No information was given about his comfort with AI-based emotional support specifically."
      ),
    ],
    frustrations: () => [
      claim(
        "Feels guilty taking time during the workday for anything that isn't work.",
        "assumption",
        "Common among high-stress professionals, but not confirmed for this audience."
      ),
      claim(
        "Finds long guided meditations hard to finish during a busy day.",
        "inference",
        "Follows from needing something that fits short work breaks."
      ),
    ],
    behaviors: () => [
      claim(
        "Opens the app in short bursts between meetings rather than in one long session.",
        "assumption",
        "Plausible for a busy work schedule, not derived from given information."
      ),
      claim(
        "Whether he currently uses any other stress-management app or technique.",
        "unknown",
        "The product description doesn't indicate his current coping tools."
      ),
    ],
    accessibilityConsiderations: () => [
      claim(
        "May prefer calming, low-stimulation visuals given his stated stress levels.",
        "unknown",
        "No accessibility needs were described; flagged as an open consideration since none were ruled out."
      ),
    ],
    contextOfUse: () => [
      claim(
        "Likely uses the app primarily at his desk or during a commute, in short private moments.",
        "assumption",
        "Reasonable given a corporate work context, but not stated."
      ),
    ],
  },
  {
    name: "Priya Shah",
    summary: "New parent managing postpartum stress in a household where devices are often shared.",
    goals: () => [
      claim(
        "Wants to track her mood without feeling judged.",
        "inference",
        "Follows from describing herself as managing postpartum stress, a sensitive and often stigmatized experience."
      ),
      claim(
        "Wants reassurance that her entries stay private from family members.",
        "assumption",
        "No information was given about her specific privacy concerns, though plausible given a shared household."
      ),
    ],
    frustrations: () => [
      claim(
        "Worried that mood data could be seen if someone else picks up her phone.",
        "assumption",
        "Plausible in a shared-device household, but not confirmed."
      ),
    ],
    behaviors: () => [
      claim(
        "Uses the app in short, private moments, likely late at night or during naps.",
        "assumption",
        "A plausible pattern for a new parent's fragmented free time, not derived from given information."
      ),
      claim(
        "Whether she has used a mental health or journaling app before.",
        "unknown",
        "Not addressed by the information provided."
      ),
    ],
    accessibilityConsiderations: () => [
      claim(
        "No accessibility needs were indicated.",
        "unknown",
        "Nothing in the product description addresses this."
      ),
    ],
    contextOfUse: () => [
      claim(
        "Likely needs a quick way to exit or lock the app if interrupted.",
        "assumption",
        "Inferred from privacy concerns in a shared household, not stated directly."
      ),
    ],
  },
  {
    name: "Marcus Webb",
    summary: "First-time user of AI-based wellness tools, cautious about trusting a chatbot with emotional support.",
    goals: () => [
      claim(
        "Wants clear reassurance that the AI companion isn't a replacement for a real therapist.",
        "inference",
        "Follows from being described as skeptical of AI-based emotional support."
      ),
    ],
    frustrations: () => [
      claim(
        "Distrusts chatbots that give generic, canned-sounding responses.",
        "assumption",
        "Common among first-time AI tool users, but not confirmed for this audience."
      ),
    ],
    behaviors: () => [
      claim(
        "Likely tests the app cautiously with low-stakes entries before trusting it with anything serious.",
        "assumption",
        "Plausible for a skeptical first-time user, not derived from given information."
      ),
    ],
    accessibilityConsiderations: () => [
      claim(
        "No accessibility needs were indicated.",
        "unknown",
        "Nothing in the product description addresses this."
      ),
    ],
    contextOfUse: () => [
      claim(
        "Whether he'd use this alongside or instead of existing therapy.",
        "unknown",
        "Not addressed by the information provided."
      ),
    ],
  },
  {
    name: "Sofia Delgado",
    summary: "College student using wellness tools to manage anxiety around exams and coursework.",
    goals: () => [
      claim(
        "Wants guided coping strategies she can use right before a stressful exam.",
        "inference",
        "Follows from being described as a student managing exam-related anxiety."
      ),
    ],
    frustrations: () => [
      claim(
        "Feels overwhelmed by apps with too many features or options to choose from.",
        "assumption",
        "Common among students seeking quick relief, but not confirmed for this audience."
      ),
    ],
    behaviors: () => [
      claim(
        "Likely uses the app in short bursts before stressful events rather than as a daily habit.",
        "assumption",
        "Plausible given exam-specific anxiety, not derived from given information."
      ),
    ],
    accessibilityConsiderations: () => [
      claim(
        "May benefit from audio-guided content during moments when reading feels difficult under stress.",
        "unknown",
        "No accessibility needs were described; flagged as an open consideration since none were ruled out."
      ),
    ],
    contextOfUse: () => [
      claim(
        "Likely uses the app on a phone, between classes or before exams.",
        "assumption",
        "Reasonable for a student's schedule, but not stated."
      ),
    ],
  },
  {
    name: "Daniel Okonkwo",
    summary: "Shift worker with an irregular sleep schedule, using journaling to process stress from work.",
    goals: () => [
      claim(
        "Wants journaling prompts available whenever he has downtime, not tied to a fixed daily time.",
        "inference",
        "Follows from having an irregular, shift-based schedule."
      ),
    ],
    frustrations: () => [
      claim(
        "Standard daily check-in reminders don't match his shifting schedule.",
        "inference",
        "A direct consequence of working irregular shifts rather than a standard daytime schedule."
      ),
    ],
    behaviors: () => [
      claim(
        "Likely logs his mood at unconventional hours, including overnight.",
        "assumption",
        "Plausible given a shift-work schedule, not derived from given information."
      ),
    ],
    accessibilityConsiderations: () => [
      claim(
        "No accessibility needs were indicated.",
        "unknown",
        "Nothing in the product description addresses this."
      ),
    ],
    contextOfUse: () => [
      claim(
        "Likely uses the app on mobile, during breaks at work.",
        "assumption",
        "Reasonable for a shift worker's context, but not stated."
      ),
    ],
  },
  {
    name: "Emma Larsson",
    summary: "Caregiver for an aging parent, emotionally exhausted with very little free time.",
    goals: () => [
      claim(
        "Wants very short, low-effort emotional check-ins that fit into stolen minutes.",
        "inference",
        "Follows from being described as a caregiver with limited free time."
      ),
    ],
    frustrations: () => [
      claim(
        "Feels that generic wellness content doesn't address caregiver-specific burnout.",
        "assumption",
        "Plausible given her caregiving context, but not confirmed."
      ),
    ],
    behaviors: () => [
      claim(
        "Likely uses the app in short, interrupted sessions rather than one uninterrupted block.",
        "assumption",
        "A plausible pattern given fragmented caregiving schedules, not derived from given information."
      ),
    ],
    accessibilityConsiderations: () => [
      claim(
        "No accessibility needs were indicated.",
        "unknown",
        "Nothing in the product description addresses this."
      ),
    ],
    contextOfUse: () => [
      claim(
        "Whether she'd want the app to send fewer notifications given her already full plate.",
        "unknown",
        "Not addressed by the information provided."
      ),
    ],
  },
];

const GENERIC_PERSONA_POOL: MockPersonaTemplate[] = [
  {
    name: "Taylor Morgan",
    summary: "Busy professional evaluating whether this product is worth adopting into an already full workflow.",
    goals: (hasEvidence) => [
      ...(hasEvidence
        ? [
            claim(
              "Wants to see value within the first few minutes of use.",
              "evidence",
              "Directly stated in the research notes you provided."
            ),
          ]
        : []),
      claim(
        "Wants to understand the core value quickly, without a long setup process.",
        "inference",
        "Common expectation for busy professionals evaluating new tools."
      ),
    ],
    frustrations: () => [
      claim(
        "Abandons tools that require a lengthy onboarding before showing any value.",
        "assumption",
        "Plausible for a time-constrained evaluator, not confirmed."
      ),
    ],
    behaviors: () => [
      claim(
        "Likely tries the product once, briefly, before deciding whether to return.",
        "assumption",
        "A plausible first-use pattern, not derived from given information."
      ),
    ],
    accessibilityConsiderations: () => [
      claim(
        "No accessibility needs were indicated.",
        "unknown",
        "Nothing in the product description addresses this."
      ),
    ],
    contextOfUse: () => [
      claim(
        "Whether they're evaluating this alongside competing tools.",
        "unknown",
        "Not addressed by the information provided."
      ),
    ],
  },
  {
    name: "Jamie Chen",
    summary: "Non-technical user who is new to this category of product and wary of a steep learning curve.",
    goals: () => [
      claim(
        "Wants clear, plain-language guidance rather than jargon.",
        "inference",
        "Follows from being described as non-technical and new to this category."
      ),
    ],
    frustrations: () => [
      claim(
        "Gets discouraged by interfaces that assume prior familiarity with the category.",
        "assumption",
        "Common for newcomers to a product category, but not confirmed."
      ),
    ],
    behaviors: () => [
      claim(
        "Likely relies on default settings rather than customizing anything early on.",
        "assumption",
        "Plausible for a cautious newcomer, not derived from given information."
      ),
    ],
    accessibilityConsiderations: () => [
      claim(
        "No accessibility needs were indicated.",
        "unknown",
        "Nothing in the product description addresses this."
      ),
    ],
    contextOfUse: () => [
      claim(
        "Whether they have someone to ask for help if they get stuck.",
        "unknown",
        "Not addressed by the information provided."
      ),
    ],
  },
  {
    name: "Riley Anderson",
    summary: "Experienced power user who wants deep customization and efficient, keyboard-driven workflows.",
    goals: () => [
      claim(
        "Wants keyboard shortcuts and customization options for frequent tasks.",
        "inference",
        "Follows from being described as an experienced power user."
      ),
    ],
    frustrations: () => [
      claim(
        "Finds simplified, beginner-focused interfaces limiting once basic tasks are mastered.",
        "assumption",
        "Common among power users, but not confirmed for this audience."
      ),
    ],
    behaviors: () => [
      claim(
        "Likely explores settings and advanced options early rather than sticking to defaults.",
        "assumption",
        "Plausible for a power user, not derived from given information."
      ),
    ],
    accessibilityConsiderations: () => [
      claim(
        "No accessibility needs were indicated.",
        "unknown",
        "Nothing in the product description addresses this."
      ),
    ],
    contextOfUse: () => [
      claim(
        "Likely uses the product frequently enough that small efficiency gains matter a lot.",
        "assumption",
        "Reasonable for a described power user, but not stated directly."
      ),
    ],
  },
  {
    name: "Casey Nguyen",
    summary: "Mobile-first user who expects full functionality without ever needing a desktop.",
    goals: () => [
      claim(
        "Wants complete functionality on a phone, not a stripped-down mobile experience.",
        "inference",
        "Follows from being described as a mobile-first user."
      ),
    ],
    frustrations: () => [
      claim(
        "Frustrated by features that only work well on desktop.",
        "assumption",
        "Common among mobile-first users, but not confirmed for this audience."
      ),
    ],
    behaviors: () => [
      claim(
        "Likely uses the product in short sessions throughout the day rather than one long session.",
        "assumption",
        "Plausible for mobile usage patterns, not derived from given information."
      ),
    ],
    accessibilityConsiderations: () => [
      claim(
        "May be using the product one-handed or in variable lighting conditions.",
        "unknown",
        "No accessibility needs were described; flagged as an open consideration since none were ruled out."
      ),
    ],
    contextOfUse: () => [
      claim(
        "Whether they have reliable connectivity throughout the day.",
        "unknown",
        "Not addressed by the information provided."
      ),
    ],
  },
  {
    name: "Morgan Lee",
    summary: "Relies on a screen reader and keyboard navigation, and evaluates products on accessibility first.",
    goals: () => [
      claim(
        "Wants full keyboard navigability and correct screen reader labeling throughout.",
        "inference",
        "Follows from being described as relying on a screen reader and keyboard navigation."
      ),
    ],
    frustrations: () => [
      claim(
        "Abandons products with unlabeled controls or keyboard traps.",
        "assumption",
        "Common among screen reader users, but not confirmed for this audience."
      ),
    ],
    behaviors: () => [
      claim(
        "Likely tests core flows with a screen reader before adopting a product further.",
        "assumption",
        "Plausible given her stated reliance on assistive technology, not derived from given information."
      ),
    ],
    accessibilityConsiderations: () => [
      claim(
        "Requires full keyboard operability and accurate screen reader labeling as a baseline, not an afterthought.",
        "inference",
        "Follows directly from being described as a screen reader and keyboard user."
      ),
    ],
    contextOfUse: () => [
      claim(
        "Whether the product has been tested with her specific screen reader and browser combination.",
        "unknown",
        "Not addressed by the information provided."
      ),
    ],
  },
  {
    name: "Jordan Kim",
    summary: "Privacy-conscious user who reads data practices closely before trusting a new product.",
    goals: () => [
      claim(
        "Wants clear, upfront information about what data is collected and why.",
        "inference",
        "Follows from being described as privacy-conscious."
      ),
    ],
    frustrations: () => [
      claim(
        "Distrusts products with vague or hard-to-find privacy information.",
        "assumption",
        "Common among privacy-conscious users, but not confirmed for this audience."
      ),
    ],
    behaviors: () => [
      claim(
        "Likely reads privacy or data-handling information before entering any personal details.",
        "assumption",
        "Plausible given her stated privacy consciousness, not derived from given information."
      ),
    ],
    accessibilityConsiderations: () => [
      claim(
        "No accessibility needs were indicated.",
        "unknown",
        "Nothing in the product description addresses this."
      ),
    ],
    contextOfUse: () => [
      claim(
        "Whether they'd use this product for anything they'd consider sensitive.",
        "unknown",
        "Not addressed by the information provided."
      ),
    ],
  },
];

type Domain = "finance" | "wellness" | "generic";

// Simple substring keyword matching against everything the user typed. This
// is deliberately unsophisticated — it's a mock generator standing in for
// real generation, not a classifier — but it means the output actually
// responds to input content instead of being fixed.
const DOMAIN_KEYWORDS: Record<Exclude<Domain, "generic">, string[]> = {
  finance: [
    "budget",
    "invoic",
    "expense",
    "income",
    "financ",
    "accounting",
    "freelan",
    "tax",
    "payment",
    "money",
    "bank",
    "spending",
  ],
  wellness: [
    "wellness",
    "well-being",
    "wellbeing",
    "mental health",
    "therap",
    "mindful",
    "meditat",
    "stress",
    "anxiety",
    "emotional",
    "coping",
    "journal",
    "mood",
    "self-care",
    "calm",
  ],
};

const DOMAIN_POOLS: Record<Domain, MockPersonaTemplate[]> = {
  finance: FINANCE_PERSONA_POOL,
  wellness: WELLNESS_PERSONA_POOL,
  generic: GENERIC_PERSONA_POOL,
};

const DOMAIN_QUESTIONS: Record<Domain, string[]> = {
  finance: [
    "Do users actually want a weekly or monthly view of income, or does this vary by how they work?",
    "How comfortable are target users with connecting bank accounts versus entering data manually?",
    "What financial tools, if any, are users currently relying on?",
  ],
  wellness: [
    "How do users want to be reminded to check in, given how different their schedules and stress patterns are?",
    "How much do users trust an AI companion with emotionally sensitive information, compared to a human?",
    "What privacy safeguards would make users comfortable logging sensitive emotional content?",
  ],
  generic: [
    "What does a first successful use of this product actually look like for target users?",
    "How much prior familiarity with this category of product should we assume?",
    "What would make someone trust this product enough to rely on it regularly?",
  ],
};

function detectDomain(input: PersonaFormValues): Domain {
  const haystack = `${input.productDescription} ${input.targetContext} ${input.knownUserData}`.toLowerCase();
  for (const domain of Object.keys(DOMAIN_KEYWORDS) as Array<Exclude<Domain, "generic">>) {
    if (DOMAIN_KEYWORDS[domain].some((keyword) => haystack.includes(keyword))) {
      return domain;
    }
  }
  return "generic";
}

export function generateMockPersonaOutput(input: PersonaFormValues): PersonaGeneratorOutput {
  const domain = detectDomain(input);
  const pool = DOMAIN_POOLS[domain];
  const hasEvidence = input.knownUserData.trim().length > 0;
  const count = Math.min(Math.max(input.personaCount, 1), pool.length);
  const personas = pool.slice(0, count).map((template) => ({
    name: template.name,
    summary: template.summary,
    goals: template.goals(hasEvidence),
    frustrations: template.frustrations(),
    behaviors: template.behaviors(),
    accessibilityConsiderations: template.accessibilityConsiderations(),
    contextOfUse: template.contextOfUse(),
  }));

  const confidenceNote = hasEvidence
    ? "Some claims are grounded in the research notes you provided and are tagged Evidence; everything else is inference, assumption, or unknown and should be validated with real users."
    : "No user research was provided, so every claim below is inference, assumption, or unknown. Treat these personas as a starting hypothesis, not a substitute for real users.";

  return {
    personas,
    openQuestions: DOMAIN_QUESTIONS[domain],
    overallConfidenceNote:
      domain === "generic"
        ? `${confidenceNote} This preview doesn't yet recognize your specific product category, so these are generic placeholder personas rather than domain-tailored ones.`
        : confidenceNote,
  };
}
