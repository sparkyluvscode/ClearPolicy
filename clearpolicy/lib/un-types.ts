/**
 * UN/International Policy Document Types
 * 
 * This module defines all TypeScript interfaces for the UN/International
 * policy document analysis feature. It's designed to be extensible for
 * future UN processes and organization-specific customizations.
 * 
 * @module un-types
 */

/** Input method for document ingestion */
export type DocumentInputMethod = "url" | "upload" | "text";

/** Document stage in the UN process (inferred from content) */
export type DocumentStage = 
  | "draft_resolution"
  | "negotiation_text"
  | "zero_draft"
  | "concept_note"
  | "final_treaty"
  | "declaration"
  | "outcome_document"
  | "report"
  | "unknown";

/** UN process categories for future tagging/filtering */
export type UNProcess = 
  | "bbnj"           // Biodiversity Beyond National Jurisdiction
  | "inc_tax"        // Intergovernmental Negotiating Committee on Tax
  | "sdg"            // Sustainable Development Goals
  | "climate"        // UNFCCC processes
  | "water"          // UN Water Conference
  | "sti_forum"      // Science, Technology, and Innovation Forum
  | "youth"          // Youth-related processes
  | "general"        // General/unclassified
  | string;          // Allow custom processes

/** Reading level for summaries */
export type ReadingLevel = "5" | "8" | "12";

/**
 * Request to analyze a UN document
 */
export interface UNDocumentRequest {
  /** How the document was provided */
  inputMethod: DocumentInputMethod;
  /** URL if provided via URL input */
  url?: string;
  /** Filename if uploaded */
  filename?: string;
  /** Raw document text (extracted or pasted) */
  content: string;
  /** Document title if known */
  title?: string;
  /** Optional: hint about which UN process this relates to */
  processHint?: UNProcess;
}

/**
 * A single term/acronym with its explanation
 */
export interface GlossaryTerm {
  /** The acronym or jargon term */
  term: string;
  /** Full meaning / expansion */
  meaning: string;
  /** Simple explanation for non-experts */
  simpleExplanation: string;
}

/**
 * Content at a specific reading level
 */
export interface UNLevelContent {
  /** 1-3 paragraph TL;DR summary */
  tldr: string;
  /** Key objectives as bullet points */
  keyObjectives: string[];
  /** Who is affected (countries, groups, stakeholders) */
  whoAffected: string;
  /** What decisions or commitments are being made */
  decisions: string;
  /** Pros / opportunities */
  pros: string[];
  /** Cons / concerns / tradeoffs */
  cons: string[];
}

/**
 * Youth-specific relevance analysis
 */
export interface YouthRelevance {
  /** General relevance to youth */
  general: string;
  /** Relevance to Global South youth (if applicable) */
  globalSouth?: string;
  /** Relevance to youth participation and representation */
  participation?: string;
  /** Relevant clauses or sections (high-level, not hallucinated article numbers) */
  relevantAreas: string[];
}

/**
 * Full analysis result for a UN document
 */
export interface UNDocumentAnalysis {
  /** Extracted or inferred document title */
  title: string;
  /** Inferred document stage */
  stage: DocumentStage;
  /** Inferred or tagged UN process */
  process: UNProcess;
  /** Multi-level summaries */
  levels: {
    "5": UNLevelContent;
    "8": UNLevelContent;
    "12": UNLevelContent;
  };
  /** Youth-specific relevance */
  youthRelevance: YouthRelevance;
  /** Glossary of acronyms and jargon */
  glossary: GlossaryTerm[];
  /** Source URL if provided */
  sourceUrl?: string;
  /** Original filename if uploaded */
  sourceFilename?: string;
  /** Timestamp of analysis */
  analyzedAt: string;
  /** Token/character count of source document */
  documentLength: number;
  /** Whether analysis was truncated due to length */
  wasTruncated: boolean;
}

/**
 * API response wrapper for UN document analysis
 */
export interface UNAnalysisResponse {
  success: boolean;
  analysis?: UNDocumentAnalysis;
  error?: string;
  /** Processing metadata for observability */
  meta?: {
    inputMethod: DocumentInputMethod;
    documentLength: number;
    processingTimeMs: number;
    modelUsed: string;
    chunksProcessed?: number;
  };
}

/**
 * Configuration for organization-specific modes (e.g., YPSF mode)
 * This is an extensibility hook for future customization.
 */
export interface OrganizationConfig {
  /** Organization identifier */
  id: string;
  /** Display name */
  name: string;
  /** Which sections to emphasize */
  emphasizedSections: Array<"youthRelevance" | "decisions" | "glossary">;
  /** Custom system prompt additions */
  promptAdditions?: string;
  /** Logo URL */
  logoUrl?: string;
}

/**
 * Predefined organization configs
 */
export const ORGANIZATION_CONFIGS: Record<string, OrganizationConfig> = {
  default: {
    id: "default",
    name: "ClearPolicy",
    emphasizedSections: ["youthRelevance", "glossary"],
  },
  ypsf: {
    id: "ypsf",
    name: "YPSF",
    emphasizedSections: ["youthRelevance", "decisions", "glossary"],
    promptAdditions: "Pay special attention to youth participation, representation, and engagement provisions. Highlight any mentions of civil society involvement in multilateral processes.",
  },
};

/**
 * Stage display names for UI
 */
export const STAGE_LABELS: Record<DocumentStage, string> = {
  draft_resolution: "Draft Resolution",
  negotiation_text: "Negotiation Text",
  zero_draft: "Zero Draft",
  concept_note: "Concept Note",
  final_treaty: "Final Treaty",
  declaration: "Declaration",
  outcome_document: "Outcome Document",
  report: "Report",
  unknown: "Document",
};

/**
 * Process display names for UI
 */
export const PROCESS_LABELS: Record<string, string> = {
  bbnj: "Biodiversity Beyond National Jurisdiction (BBNJ)",
  inc_tax: "UN Tax Convention (INC)",
  sdg: "Sustainable Development Goals",
  climate: "Climate (UNFCCC)",
  water: "UN Water",
  sti_forum: "STI Forum",
  youth: "Youth Processes",
  general: "General",
};
