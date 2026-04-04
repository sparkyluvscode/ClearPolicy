export type AnswerSection = {
  summary?: string;
  keyProvisions?: string[];
  localImpact?: { zipCode: string; location: string; content: string };
  argumentsFor?: string[];
  argumentsAgainst?: string[];
  /** Extended data/overview section for data-report format follow-ups */
  overview?: string;
};

export type AnswerSource = {
  id: number;
  title: string;
  url: string;
  domain: string;
  type: "Federal" | "State" | "Local" | "Web";
  verified: boolean;
  /** Evidence excerpt from the source that backs a specific claim */
  excerpt?: string;
};

export type Answer = {
  policyId: string;
  policyName: string;
  level: "Federal" | "State" | "Local";
  category: string;
  fullTextSummary: string;
  sections: AnswerSection;
  sources: AnswerSource[];
};
