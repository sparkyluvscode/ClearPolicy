/**
 * Follow-up Intent Classifier
 *
 * Classifies follow-up messages to determine the right response strategy.
 * Uses keyword matching (fast, free) -- no LLM call needed for common patterns.
 */

export type FollowUpIntent =
  | "more_data"
  | "go_deeper"
  | "different_angle"
  | "simplify"
  | "source_specific"
  | "general_followup";

const INTENT_PATTERNS: { intent: FollowUpIntent; patterns: RegExp[] }[] = [
  {
    intent: "more_data",
    patterns: [
      /\bmore\s+(numbers?|data|stats|statistics|figures?|quantit)/i,
      /\bgive\s+me\s+(numbers?|data|stats|figures?)/i,
      /\bshow\s+me\s+the\s+numbers/i,
      /\bquantif/i,
      /\bneed\s+(stats|data|numbers|figures)/i,
      /\bback\s+(this|it)\s+up\s+with\s+data/i,
      /\bwhat\s+are\s+the\s+(numbers|stats|figures|percentages)/i,
      /\bhow\s+much\s+(does|do|will|would)/i,
      /\bcost\s+(estimate|breakdown|analysis)/i,
      /\b(budget|economic|financial)\s+(data|impact|numbers)/i,
      /\bpolling|survey\s+(data|results|numbers)/i,
    ],
  },
  {
    intent: "go_deeper",
    patterns: [
      /\b(go|dig)\s+(deeper|further)/i,
      /\btell\s+me\s+more/i,
      /\belaborate/i,
      /\bexplain\s+(further|more|in\s+detail)/i,
      /\bmore\s+(detail|depth|thorough|comprehensive|in-depth)/i,
      /\bexpand\s+on/i,
      /\bdeep\s*dive/i,
      /\bcan\s+you\s+be\s+more\s+(specific|detailed)/i,
      /\bwhat\s+about\s+the\s+(nuances?|details?|specifics?)/i,
      /\bgive\s+me\s+the\s+full\s+(picture|breakdown)/i,
    ],
  },
  {
    intent: "different_angle",
    patterns: [
      /\bwhat\s+about\b/i,
      /\bhow\s+does\s+(this|it)\s+affect\b/i,
      /\bwhat\s+do\s+\w+\s+(think|say)/i,
      /\bfrom\s+(a|the)\s+\w+\s+perspective/i,
      /\b(conservative|progressive|liberal|libertarian)\s+(view|perspective|take)/i,
      /\bother\s+side/i,
      /\bdevil'?s?\s+advocate/i,
      /\bhow\s+does\s+this\s+compare/i,
      /\binternational\s+(comparison|perspective)/i,
    ],
  },
  {
    intent: "simplify",
    patterns: [
      /\bsimplif/i,
      /\beli5/i,
      /\bplain\s+(english|language|terms)/i,
      /\btoo\s+(complex|complicated|technical|hard)/i,
      /\bmake\s+(it|this)\s+(simpler|easier)/i,
      /\bbreak\s+(it|this)\s+down/i,
      /\bin\s+simple\s+terms/i,
      /\bfor\s+a\s+(kid|child|teenager|beginner)/i,
    ],
  },
  {
    intent: "source_specific",
    patterns: [
      /\bwhat\s+does\s+(the\s+)?(CBO|CRS|GAO|census|bureau)/i,
      /\baccording\s+to\b/i,
      /\bwhat\s+(does|do)\s+\w+\s+say\s+about/i,
      /\b(CBO|CRS|GAO|Congressional\s+Research|Congressional\s+Budget)\b/i,
      /\bwhat\s+are\s+the\s+sources/i,
      /\bprimary\s+sources/i,
      /\bcite\s+(the|your)\s+sources/i,
      /\bwhere\s+did\s+(you|this)\s+come\s+from/i,
    ],
  },
];

export function classifyFollowUpIntent(message: string): FollowUpIntent {
  for (const { intent, patterns } of INTENT_PATTERNS) {
    if (patterns.some(p => p.test(message))) {
      return intent;
    }
  }
  return "general_followup";
}

export function getDepthLevel(
  conversationLength: number,
): number {
  if (conversationLength <= 2) return 1;
  if (conversationLength <= 4) return 2;
  if (conversationLength <= 6) return 3;
  return 4;
}

export const INTENT_LABELS: Record<FollowUpIntent, string> = {
  more_data: "Data Report",
  go_deeper: "Deep Dive",
  different_angle: "New Perspective",
  simplify: "Simplified",
  source_specific: "Source Analysis",
  general_followup: "Follow-up",
};
