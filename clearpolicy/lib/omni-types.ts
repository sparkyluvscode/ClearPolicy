/**
 * Omni-Search Type System
 *
 * Defines the schema for the Policy Intelligence Engine.
 * The query classifier routes every user input into one of
 * these intents, each resolved by a different pipeline.
 */

/* ────────────────────────── Query Classification ────────────────────────── */

export type QueryIntent =
  | "bill_lookup"        // "What does SB 1234 do?"
  | "legal_explainer"    // "Explain F-1 visa work rules"
  | "local_ballot"       // "What is on my ballot in 95746?"
  | "debate_prep"        // "Arguments for/against universal healthcare"
  | "general_policy"     // "How does rent control work?"
  | "document_analysis"  // User uploaded a document
  | "news_update";       // "Latest on the crypto bill"

export interface ClassifiedQuery {
  intent: QueryIntent;
  originalQuery: string;
  /** Normalized / cleaned version of the query */
  cleanedQuery: string;
  /** Specific bill identifier if detected (e.g. "SB 1234", "HR 5") */
  billId?: string;
  /** Topic tags extracted from the query */
  topics: string[];
  /** ZIP code if detected in query */
  zip?: string;
  /** State if detected or inferred */
  state?: string;
  /** Year if detected in query */
  year?: string;
  /** Whether the query needs multiple perspectives */
  needsDebate: boolean;
  /** Whether local context would enrich the answer */
  needsLocalContext: boolean;
  /** Confidence 0-1 in the classification */
  confidence: number;
}

/* ──────────────────────── Persona System ──────────────────────── */

/** Persona types for "View As" filtering */
export type Persona =
  | "general"        // default — no filtering
  | "student"        // focus: FAFSA, tuition, campus, curriculum
  | "homeowner"      // focus: property tax, zoning, HOA, mortgage
  | "small_biz"      // focus: regulations, tax, permits, labor
  | "renter"         // focus: rent control, tenant rights, eviction
  | "immigrant"      // focus: visa, citizenship, USCIS, asylum
  | "parent";        // focus: schools, childcare, safety, benefits

export const PERSONA_LABELS: Record<Persona, string> = {
  general: "Everyone",
  student: "Student",
  homeowner: "Homeowner",
  small_biz: "Small Business",
  renter: "Renter",
  immigrant: "Immigrant",
  parent: "Parent",
};

export const PERSONA_ICONS: Record<Persona, string> = {
  general: "👤",
  student: "🎓",
  homeowner: "🏠",
  small_biz: "🏪",
  renter: "🔑",
  immigrant: "🌎",
  parent: "👨‍👩‍👧",
};

/* ──────────────────────── Source & Citation Types ──────────────────────── */

export type SourceType =
  | "federal_bill"
  | "state_bill"
  | "regulation"
  | "news_article"
  | "government_site"
  | "think_tank"
  | "academic"
  | "local_government"
  | "web_search"
  | "uploaded_document";

export interface Source {
  id: string;
  type: SourceType;
  title: string;
  url?: string;
  /** The raw text snippet used to support a claim */
  snippet: string;
  /** Which organization / domain it comes from */
  publisher?: string;
  /** Date published if known */
  publishedDate?: string;
  /** Relevance score 0-1 */
  relevance: number;
  /** Jurisdiction level: federal / state / local */
  jurisdiction?: "federal" | "state" | "local";
}

export interface Citation {
  /** Index into the sources array */
  sourceIndex: number;
  /** The specific text from the source backing this claim */
  excerpt: string;
}

/* ─────────────── Rhetoric vs. Reality ("Truth Engine") ─────────────── */

export interface RhetoricCheck {
  /** The bill/policy's official title or stated purpose ("The Pitch") */
  officialTitle: string;
  /** What the enactment clauses actually do ("The Mechanism") */
  actualMechanism: string;
  /**
   * The delta analysis: where the title/rhetoric diverges from what
   * the text enforces. null if no significant delta.
   */
  deltaAnalysis: string | null;
  /**
   * Severity: 'none' = title matches text, 'minor' = small gap,
   * 'significant' = meaningful rhetorical gap
   */
  severity: "none" | "minor" | "significant";
  /** Specific clause references the delta is based on */
  clauseReferences: string[];
  /** Citations backing the analysis */
  citations: number[];
}

/* ──────────────────── Answer & Response Structure ──────────────────── */

export interface AnswerSection {
  /** Section heading (e.g., "What it does", "Who's affected") */
  heading: string;
  /** The paragraph/content of this section */
  content: string;
  /** Inline citation indices — each number maps to OmniResponse.sources */
  citations: number[];
  /** Confidence: 'verified' = has source, 'inferred' = LLM inference, 'unverified' */
  confidence: "verified" | "inferred" | "unverified";
}

export interface PerspectiveView {
  label: string; // "Progressive", "Conservative", "Textual"
  summary: string;
  citations: number[];
  thinktank?: string; // Source org name
}

export interface LocalContext {
  level: "federal" | "state" | "local";
  title: string;
  summary: string;
  citations: number[];
}

export interface OmniResponse {
  /** Unique response ID */
  id: string;
  /** The classified intent */
  intent: QueryIntent;
  /** Main headline / title for the answer */
  title: string;
  /** One-sentence TL;DR */
  tldr: string;
  /** Reading-level adapted content (keyed by grade: "5", "8", "12") */
  sections: AnswerSection[];
  /** All sources referenced */
  sources: Source[];
  /** Optional: multi-perspective comparison for debate mode */
  perspectives?: PerspectiveView[];
  /** Optional: local context breakdown (federal → state → local) */
  localContext?: LocalContext[];
  /** Optional: Rhetoric vs Reality check (bill_lookup / legal_explainer only) */
  rhetoricCheck?: RhetoricCheck;
  /** The persona the answer was filtered for */
  persona: Persona;
  /** Related follow-up questions the user might ask */
  followUps: string[];
  /** Model used for generation */
  model: string;
  /** Total processing time in ms */
  processingTimeMs: number;
  /** Warnings / caveats (e.g., "No local data found for this ZIP") */
  warnings: string[];
}

/* ────────────────────── API Request Shape ────────────────────── */

export interface OmniRequest {
  query: string;
  /** User's ZIP for local context */
  zip?: string;
  /** Reading level preference */
  readingLevel?: "5" | "8" | "12";
  /** Whether to enable debate/perspective mode */
  debateMode?: boolean;
  /** Persona filter */
  persona?: Persona;
  /** Uploaded document text (if any) */
  documentText?: string;
  /** Document filename (if upload) */
  documentFilename?: string;
}
