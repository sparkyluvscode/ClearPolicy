import type { Citation } from "./citations";

export type EvidenceCitation = Citation & {
  quote?: string;
  url?: string;
  sourceName?: string;
};

export type SummaryLike = {
  tldr?: string | null;
  whatItDoes?: string | null;
  whoAffected?: string | null;
  pros?: string | null;
  cons?: string | null;
  sourceRatio?: number | null;
  citations?: EvidenceCitation[] | null;
  sourceCount?: number | null;
  example?: string | null;
};
