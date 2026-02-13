export type AnswerSection = {
  summary?: string;
  keyProvisions?: string[];
  localImpact?: { zipCode: string; location: string; content: string };
  argumentsFor?: string[];
  argumentsAgainst?: string[];
};

export type AnswerSource = {
  id: number;
  title: string;
  url: string;
  domain: string;
  type: "Federal" | "State" | "Local" | "Web";
  verified: boolean;
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
