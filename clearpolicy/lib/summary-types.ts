import type { Citation } from "./citations";

export type EvidenceCitation = Citation & {
  quote?: string;
  url?: string;
  sourceName?: string;
};

export type SummaryLike = {
  tldr?: string | string[] | null;
  whatItDoes?: string | string[] | null;
  whoAffected?: string | string[] | null;
  pros?: string | string[] | null;
  cons?: string | string[] | null;
  sourceRatio?: number | null;
  citations?: EvidenceCitation[] | null;
  sourceCount?: number | null;
  example?: string | null;
};
