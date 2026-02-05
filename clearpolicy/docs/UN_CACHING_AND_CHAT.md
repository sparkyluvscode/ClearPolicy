# UN Document Caching & Chat Feature

## Overview

This document describes the caching and chatbot features added to the UN/International Documents analysis system.

## Features Implemented

### 1. Document Caching

Every document analyzed is cached to avoid re-spending AI tokens on identical inputs.

#### How It Works

1. **Document Fingerprinting**: When a document is submitted (URL, PDF, or pasted text), we:
   - Extract the text content
   - Normalize it (lowercase, whitespace normalization, artifact removal)
   - Compute a SHA-256 hash of the normalized text

2. **Cache Lookup**: Before calling the AI:
   - Check the database for an existing analysis with the same hash
   - If found, return the cached result immediately (no AI call)
   - If not found, proceed with AI analysis

3. **Cache Storage**: After successful AI analysis:
   - Store the complete analysis in the `UnDocumentAnalysis` table
   - Include metadata (source type, title, processing time, etc.)

#### Files

- `lib/document-hash.ts` - Hash computation utilities
- `prisma/schema.prisma` - `UnDocumentAnalysis` model
- `app/api/un/analyze/route.ts` - Updated with caching logic

### 2. Analysis History

Users can view previously analyzed documents.

#### Features

- Paginated list of all analyzed documents
- Shows source type, title, date, and document length
- Click to view any past analysis instantly (from cache)
- Shareable URLs with document hash

#### Files

- `app/un/history/page.tsx` - History listing page
- `app/api/un/history/route.ts` - History API endpoint

### 3. In-App Chatbot

An interactive chatbot helps users understand analyzed documents.

#### Features

- **Side Panel Chat**: Collapsible chat panel on the results page
- **Contextual Q&A**: Answers grounded in the document analysis
- **Highlight-to-Explain**: Select text and click "Explain this" for instant explanations
- **Clear Language**: Responses aimed at 8th-10th grade reading level
- **Honest Limitations**: Says when something isn't covered in the document

#### Technical Details

- Chat is ephemeral (client-side state only, no persistence)
- Uses the stored analysis + glossary as context
- GPT-4o-mini for responses
- Highlighted text gets special prompt handling

#### Files

- `app/api/un/chat/route.ts` - Chat API endpoint
- `app/un/results/page.tsx` - Updated with chat panel and highlight handling

## Database Schema

```prisma
model UnDocumentAnalysis {
  id               String   @id @default(cuid())
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  
  documentHash     String   @unique  // SHA-256 of normalized text
  sourceType       String             // "url" | "pdf" | "text"
  sourceReference  String?            // URL, filename, or label
  title            String?
  documentLength   Int
  analysisPayload  String             // JSON blob of full analysis
  userId           String?            // Prepared for auth (not required)
  processingTimeMs Int?
  modelUsed        String?
}
```

## API Endpoints

### POST /api/un/analyze

Analyzes a document with caching.

**Response includes:**
- `cached: boolean` - Whether result came from cache
- `documentHash: string` - Hash for future reference

### GET /api/un/history

Lists analyzed documents.

**Query params:**
- `limit` (default 20, max 100)
- `offset` (default 0)
- `hash` (optional, get specific document by hash)

### POST /api/un/chat

Chat about a document.

**Request body:**
```json
{
  "document_hash": "abc123...",
  "user_message": "What does this treaty require?",
  "highlighted_text": "optional selected text"
}
```

**Response:**
```json
{
  "success": true,
  "assistant_message": "The treaty requires..."
}
```

## URL Patterns

- `/un` - Document input page
- `/un/results` - Analysis results (from sessionStorage)
- `/un/results?hash=abc123` - Analysis results (from cache)
- `/un/history` - List of past analyses

## Future Improvements

1. **User Accounts**: Add authentication for per-user history
2. **Chat Persistence**: Store chat history per document
3. **Export**: Allow exporting analyses as PDF/Markdown
4. **Notifications**: Alert when cached document is updated at source
5. **Collections**: Group related documents for comparison
