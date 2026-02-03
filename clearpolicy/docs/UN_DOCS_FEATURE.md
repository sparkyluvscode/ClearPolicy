# UN & International Documents Feature

## Overview

ClearPolicy now supports analysis of UN and international policy documents, making complex multilateral texts accessible to youth delegates, students, and anyone trying to understand international policy.

## Features

### Input Methods

1. **URL Input** - Paste a link to a UN document (works best with undocs.org, un.org)
2. **File Upload** - Upload PDF or TXT files (max 10MB)
3. **Text Paste** - Copy-paste document text directly

### Analysis Output

For each document, ClearPolicy provides:

- **TL;DR Summary** at 3 reading levels (5th grade, 8th grade, 12th grade)
- **Key Objectives** - bullet points of what the document aims to achieve
- **Who's Affected** - countries, groups, and stakeholders impacted
- **Decisions & Commitments** - what the document actually commits to
- **Document Stage** - draft resolution, treaty, outcome document, etc.
- **Stakeholder Perspectives** - potential benefits and concerns (neutral framing)
- **Youth Relevance** - specific analysis of how this affects young people
- **Glossary** - explanation of UN acronyms and jargon

## Architecture

### Files

```
lib/
├── un-types.ts           # TypeScript interfaces for UN documents
├── un-ai.ts              # AI pipeline for UN document analysis
└── document-extractor.ts # Text extraction from URL/PDF/text

app/
├── un/
│   ├── page.tsx          # Input page (URL, upload, paste)
│   ├── loading.tsx       # Loading skeleton
│   └── results/
│       ├── page.tsx      # Results display page
│       └── loading.tsx   # Results loading skeleton

api/
└── un/
    └── analyze/
        └── route.ts      # POST endpoint for document analysis
```

### Data Flow

1. User provides document via URL, upload, or paste
2. Frontend sends FormData to `/api/un/analyze`
3. API extracts text using `document-extractor.ts`
4. API calls `analyzeUNDocument()` from `un-ai.ts`
5. AI generates structured JSON analysis
6. Frontend stores result in sessionStorage
7. User is redirected to `/un/results` to view analysis

### AI Pipeline

The AI pipeline uses OpenAI's GPT-4o-mini model with:

- Custom system prompt emphasizing neutrality and youth accessibility
- JSON response format for structured output
- Long document chunking (processes first + last chunks for efficiency)
- Fallback handling when AI fails

## Extending the Feature

### Adding a New Input Type

1. Add handler in `document-extractor.ts`:
```typescript
export async function extractFromNewType(data: any): Promise<ExtractionResult> {
  // Your extraction logic
  return { success: true, content: "...", title: "..." };
}
```

2. Update `extractDocument()` switch statement
3. Add UI option in `app/un/page.tsx`
4. Update API validation in `app/api/un/analyze/route.ts`

### Adding a New Output Section

1. Update `UNDocumentAnalysis` interface in `un-types.ts`
2. Update prompt in `un-ai.ts` to request new field
3. Update parsing in `parseUNResponse()`
4. Add UI section in `app/un/results/page.tsx`

### Organization-Specific Modes

The feature includes hooks for organization-specific customization:

```typescript
// In un-types.ts
export interface OrganizationConfig {
  id: string;
  name: string;
  emphasizedSections: Array<"youthRelevance" | "decisions" | "glossary">;
  promptAdditions?: string;
}
```

To add a new organization mode (e.g., YPSF):

1. Add config to `ORGANIZATION_CONFIGS` in `un-types.ts`
2. Pass config to `analyzeUNDocument()` call
3. Add UI toggle if needed

### Adding a New UN Process Tag

1. Add to `UNProcess` type in `un-types.ts`
2. Add label to `PROCESS_LABELS`
3. AI will attempt to infer process from content

## API Reference

### POST /api/un/analyze

**Request:** FormData with:
- `inputMethod`: "url" | "upload" | "text"
- `url`: string (if inputMethod === "url")
- `file`: File (if inputMethod === "upload")
- `text`: string (if inputMethod === "text")

**Response:**
```typescript
{
  success: boolean;
  analysis?: UNDocumentAnalysis;
  error?: string;
  meta?: {
    inputMethod: DocumentInputMethod;
    documentLength: number;
    processingTimeMs: number;
    modelUsed: string;
  };
}
```

## Logging & Observability

The API logs (without sensitive content):
- Input method used
- Document length (characters)
- Estimated tokens
- Success/failure status
- Processing time
- Error messages (truncated)

## Security Considerations

- URL input validates protocol (http/https only)
- File uploads validate type and size
- Text content is sanitized (whitespace normalization)
- No document content is logged in full
- AI prompts instruct neutrality and no legal advice

## Testing

To test locally:

1. Start dev server: `npm run dev`
2. Navigate to `/un`
3. Try each input method:
   - URL: Paste a UN document URL
   - Upload: Upload a PDF
   - Text: Paste document text
4. Verify results display correctly at all reading levels

## Known Limitations

- DOCX parsing not yet implemented (suggest copy-paste)
- PDF parsing may fail on image-based PDFs
- Very long documents may be truncated
- URL fetching may fail on JavaScript-heavy pages
- AI may occasionally miss acronyms or misidentify document stage
