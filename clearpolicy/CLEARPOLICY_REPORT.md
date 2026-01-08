# ClearPolicy: A Comprehensive Report

## Executive Summary

ClearPolicy is a non-partisan civic education web application designed to democratize access to complex policy information. Built as a Congressional App Challenge (CAC) submission, the platform transforms dense legal language into accessible, plain-English summaries that empower students, first-time voters, and engaged citizens to understand ballot measures and legislation. The application combines sophisticated text simplification algorithms, intelligent disambiguation systems, comprehensive citation tracking, and seamless integration with government data APIs to create an unprecedented tool for civic engagement.

---

## 1. Introduction: The Mission of ClearPolicy

ClearPolicy exists to solve a fundamental problem in American democracy: the gap between complex legal language and public understanding. The platform's tagline—"Clarity on every ballot"—encapsulates its core mission: empowering voters, parents, and students to understand policy at a glance through instant plain-English summaries that are neutral, sourced, searchable, and accessible.

The application represents a technological solution to a civic challenge. Research indicates that approximately 75% of voters skip reading ballot measures because they find the language too difficult to understand. This creates a democratic deficit where citizens make decisions without fully comprehending the policies they're voting on. ClearPolicy addresses this by providing multiple reading levels (5th, 8th, and 12th grade), comprehensive source citations, and intelligent search capabilities that help users find exactly what they're looking for.

---

## 2. The Problem: Why ClearPolicy Matters

### 2.1 The Complexity Barrier

Government documents, particularly ballot measures and legislative bills, are written in dense legal language that requires specialized knowledge to parse. Terms like "notwithstanding," "pursuant to," and "authorize" create barriers for average citizens. The problem is compounded by:

- **Length**: Many measures span dozens or hundreds of pages
- **Jargon**: Legal terminology that doesn't translate to everyday language
- **Context**: Assumed knowledge of existing laws and regulations
- **Ambiguity**: Similar-sounding measures that confuse voters (e.g., Prop 17 vs. Prop 47)

### 2.2 The Information Ecosystem Challenge

Beyond complexity, voters face challenges in the information ecosystem:

- **Bias**: Search engines and AI tools often deliver campaign-driven summaries with political spin
- **Fragmentation**: Information scattered across multiple government websites
- **Verification**: Difficulty determining which sources are authoritative
- **Time Constraints**: Voters lack time to research every issue thoroughly

### 2.3 The Educational Gap

For students learning civics and first-time voters, the barriers are even higher. They lack:
- Experience navigating government websites
- Knowledge of how to verify sources
- Understanding of legislative processes
- Confidence in interpreting legal language

ClearPolicy addresses all these challenges through a unified, accessible platform.

---

## 3. Core Features and Functionality

### 3.1 Intelligent Search and Disambiguation

ClearPolicy's search functionality is built on sophisticated pattern recognition and disambiguation logic. When a user searches for "prop 17 retail theft," the system recognizes that this query could refer to multiple propositions and presents disambiguation chips:

- **Prop 17 (2020)**: Voting rights for people on parole
- **Prop 47 (2014)**: Theft & drug penalties ($950 threshold)

The disambiguation system uses pattern matching to identify:
- Proposition numbers (e.g., "prop 17", "proposition 47")
- Bill identifiers (e.g., "AB 5", "SB 1383", "H.R. 50")
- Common act names (e.g., "Affordable Care Act", "NDAA")
- Contextual keywords that help distinguish similar measures

The search integrates with two major data sources:
- **Open States API**: For California state legislation and propositions
- **Congress.gov API**: For federal bills and laws

Results are intelligently ranked using a scoring algorithm that considers:
- Exact title matches (highest priority)
- Partial title matches
- Classification relevance
- Recency (newer measures ranked higher)
- Appropriation bill filtering (de-prioritized for general searches)

### 3.2 Multi-Level Reading Comprehension

One of ClearPolicy's most innovative features is its reading-level toggle, which dynamically adjusts text complexity to three levels:

**12th Grade (Full Detail)**
- Complete information with original terminology
- All nuances and legal context preserved
- Suitable for advanced students and engaged citizens

**8th Grade (Simpler Text)**
- Simplified vocabulary (e.g., "regulations" → "rules", "authorize" → "allow")
- Shorter sentences (clauses broken at 140 characters)
- Legal terms replaced with common equivalents
- "Shall" converted to "will" for clarity

**5th Grade (Simplest)**
- Maximum simplification with analogies
- Limited to two sentences per section
- Complex clauses split into separate sentences
- Word count capped at 12 words per sentence
- Contextual analogies added (e.g., "It is like a family budget: rules for how money can be used.")

The simplification algorithm uses rule-based natural language processing that:
- Replaces complex terms with simpler equivalents
- Breaks long sentences into shorter ones
- Removes parenthetical asides
- Maintains factual accuracy while improving readability
- Adds contextual analogies for 5th-grade level

This feature makes policy accessible to students as young as elementary school while maintaining accuracy and source integrity.

### 3.3 Comprehensive Bill Cards

Each measure is presented in a structured "Bill Card" format with five key sections:

**TL;DR (Too Long; Didn't Read)**
- One-sentence summary of the measure's purpose
- Immediately accessible overview

**What It Does**
- Detailed explanation of the measure's provisions
- How it changes existing law
- Specific mechanisms and requirements

**Who Is Affected**
- Target populations and stakeholders
- Geographic scope
- Demographic impacts

**Pros**
- Benefits and positive outcomes
- Supported by source citations
- Balanced presentation

**Cons**
- Drawbacks and concerns
- Supported by source citations
- Balanced presentation

Each section includes:
- Source links to official documents
- Reading-level adjusted text
- Citation tracking

### 3.4 Source Meter and Citation System

ClearPolicy implements a sophisticated citation tracking system that ensures transparency and verifiability. The "Source Meter" displays the percentage of sections (TL;DR, What, Who, Pros, Cons) that have at least one non-generic citation link.

**Citation Features:**
- **Line-Referenced Quotes**: Expandable "Show cited lines" feature displays exact quotes from source documents
- **Source Classification**: Sources are labeled as:
  - **Official**: Government websites (highest trust)
  - **Primary**: Open States summaries or records
  - **Analysis**: Independent analysis or reporting
- **Location Tagging**: Citations are tagged by section (tldr, what, who, pros, cons)
- **Unique Source Tracking**: Deduplication ensures each source is listed once

**Source Priority:**
The system prioritizes official government sources:
- openstates.org
- congress.gov
- leginfo.legislature.ca.gov
- senate.ca.gov
- assembly.ca.gov
- ca.gov

Every claim in a summary must be traceable to at least one primary source link, ensuring users can verify information independently.

### 3.5 Local Lens: ZIP Code Representative Lookup

The "Local Lens" feature connects policy to local representation through ZIP code lookup. Users can enter any ZIP code to find:

- **Elected Officials**: Representatives at various levels
- **Party Affiliation**: When available
- **Office Information**: Official roles and responsibilities
- **Vote Records**: Links to voting history on specific bills (when context is available)
- **Official Pages**: Direct links to representative websites

The feature integrates with the Google Civic Information API and provides:
- Graceful fallbacks when data is unavailable
- Links to official California representative finder tools
- Context-aware vote searching when viewing specific bills
- Local news analysis links

This feature helps users understand how policy connects to their local representatives and voting records.

### 3.6 Non-Partisan Design Philosophy

ClearPolicy's commitment to neutrality is embedded throughout the platform:

**Balanced Presentation:**
- Pros and cons are always presented equally
- No advocacy language
- No endorsements or recommendations

**Source-Based Content:**
- All content derived from official government documents
- Independent analysis clearly labeled
- Campaign materials excluded

**Transparency:**
- Every claim linked to sources
- Source types clearly identified
- Users can verify all information

**Feedback System:**
- Users can submit corrections
- Community-driven accuracy improvements
- Moderation ensures quality

---

## 4. Technical Architecture

### 4.1 Technology Stack

ClearPolicy is built on a modern, scalable technology stack:

**Frontend:**
- **Next.js 14** with App Router: React framework with server-side rendering
- **TypeScript**: Full type safety across the codebase
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **React 18**: Latest React features with concurrent rendering

**Backend:**
- **Next.js API Routes**: Serverless API endpoints
- **Prisma ORM**: Type-safe database access
- **SQLite**: File-based database (dev.db) for development
- **Zod**: Runtime type validation for API inputs

**External Integrations:**
- **Congress.gov API v3**: Federal legislation data
- **Open States API v3**: State legislation data
- **Google Civic Information API**: Representative lookup

**Development Tools:**
- **Playwright**: End-to-end testing
- **@axe-core/playwright**: Accessibility testing
- **ESLint**: Code quality enforcement

### 4.2 Database Schema

The Prisma schema defines three main models:

**Measure Model:**
- Stores bill/proposition metadata
- Links to summaries and sources
- Includes jurisdiction, session, number, title, status
- Unique slug for URL routing

**Summary Model:**
- Stores reading-level-specific summaries
- Contains TL;DR, What, Who, Pros, Cons sections
- Includes source ratio calculation
- JSON-encoded citations array

**SourceDoc Model:**
- Tracks official source documents
- Links to measures
- Stores name, URL, document type

**Feedback Model:**
- User-submitted corrections and feedback
- Tracks page, measure, message, contact info

### 4.3 API Architecture

The application uses Next.js API routes for server-side functionality:

**/api/search** (GET):
- Accepts query parameter "q"
- Searches both Open States and Congress.gov APIs
- Implements disambiguation logic
- Ranks and deduplicates results
- Returns chips, CA results, US results, and fallback links

**/api/measure** (GET):
- Fetches measure data from database
- Returns summaries with parsed citations
- Handles both seeded and live data

**/api/zip** (GET):
- Accepts ZIP code parameter
- Queries Google Civic Information API
- Returns officials with metadata
- Provides fallback links

**/api/feedback** (POST):
- Accepts user feedback submissions
- Stores in database for moderation

**/api/prop/[num]** (GET):
- Handles California proposition lookups
- Provides virtual routing for propositions
- Returns structured proposition data

### 4.4 Text Simplification Algorithm

The reading-level simplification system (`lib/reading.ts`) implements a rule-based approach:

**Level 12 (Full Detail):**
- No modifications
- Original text preserved

**Level 8 (Simpler):**
- Term replacements (e.g., "utilize" → "use")
- Sentence shortening (clauses split at 140 characters)
- "Shall" → "will" conversion

**Level 5 (Simplest):**
- Aggressive term simplification
- Clause splitting (", which" → ". ")
- Word count limiting (12 words max per sentence)
- Sentence limiting (2 sentences max per section)
- Analogy injection for context

**Simplification Rules:**
- Vocabulary replacements: 20+ common legal terms
- Sentence structure: Complex clauses broken into simple sentences
- Parenthetical removal: Asides eliminated for clarity
- Analogy system: Context-aware analogies for 5th-grade level

The algorithm maintains factual accuracy while dramatically improving readability.

### 4.5 Disambiguation Logic

The disambiguation system (`lib/normalize.ts`) uses pattern matching:

**Pattern Recognition:**
- Proposition numbers: `/prop\s*(\d{1,3})/`
- Bill identifiers: `/\b(ab|sb)\s*(\d{1,5})\b/`
- Context keywords: "theft", "retail", "shoplift"

**Chip Generation:**
- Identifies ambiguous queries
- Generates labeled chips with hints
- Provides direct navigation via slugs
- Falls back to search for unknown measures

**Example:**
Query: "prop 17 retail theft"
Chips:
- "Prop 17 (2020) — voting rights for people on parole"
- "Prop 47 (2014) — theft & drug penalties ($950)"

### 4.6 Search Ranking Algorithm

The search API implements sophisticated ranking:

**Scoring Factors:**
- Exact title match: +100 points
- Partial title match: +40 points
- Proposition number match: +30 points
- Classification relevance: +20 points
- Recency: Up to +20 points (based on update date)
- Appropriation penalty: -30 points (for general searches)
- Short title penalty: -5 points

**Result Processing:**
- Deduplication by title/identifier
- Direct vs. related classification
- Reason generation for transparency
- Preview text extraction

**Fallback System:**
- Virtual proposition results for unknown props
- External links to official sources
- Trusted portal links (Ballotpedia, LAO, GovTrack)

---

## 5. User Experience and Design

### 5.1 Homepage Experience

The homepage (`app/page.tsx`) provides:

**Hero Section:**
- Clear value proposition
- Call-to-action buttons
- Visual graphics

**Search Interface:**
- Prominent search bar with autocomplete
- Real-time suggestion system (220ms debounce)
- Example queries for guidance
- Quick link buttons

**Results Display:**
- Separate sections for California and Federal results
- Visual distinction between direct and related matches
- "Top pick" highlighting
- External link indicators

**Feature Showcase:**
- HomeDemo component
- Illustration components
- Testimonials section

### 5.2 Measure Page Experience

The measure detail page (`app/measure/[slug]/page.tsx`) provides:

**Header:**
- Measure number and title
- Status information
- Reading level toggle (prominent placement)

**Bill Card:**
- Five-section layout (TL;DR, What, Who, Pros, Cons)
- Source Meter display
- Citation toggle
- Source links with badges

**Sidebar:**
- ZIP code lookup panel
- Context-aware representative information
- Vote history links (when available)

**Accessibility:**
- ARIA labels throughout
- Keyboard navigation support
- Screen reader optimizations
- Focus management

### 5.3 Responsive Design

ClearPolicy is built mobile-first:

**Breakpoints:**
- Mobile: Single column layout
- Tablet: Optimized spacing
- Desktop: Multi-column layouts (3-column for measure pages)

**Touch Optimization:**
- Large tap targets
- Swipe-friendly interfaces
- Mobile-optimized forms

**Performance:**
- Fast load times
- Optimized images
- Lazy loading where appropriate

### 5.4 Dark Mode Support

The application includes comprehensive dark mode:

**Theme Toggle:**
- System preference detection
- Manual toggle option
- Persistent preference storage

**Color Scheme:**
- High contrast ratios
- Accessible color combinations
- Consistent theming throughout

---

## 6. Data Sources and Integration

### 6.1 Congress.gov API Integration

**Purpose:** Federal legislation data

**Capabilities:**
- Bill search by keyword
- Bill details and metadata
- Latest action tracking
- Full text access

**Implementation:**
- Client wrapper in `lib/clients/congress.ts`
- Error handling and fallbacks
- Rate limit management
- Result normalization

### 6.2 Open States API Integration

**Purpose:** California state legislation

**Capabilities:**
- Bill search by keyword
- Bill search by identifier (AB/SB numbers)
- Proposition data
- Classification and metadata

**Implementation:**
- Client wrapper in `lib/clients/openstates.ts`
- Identifier-based lookups
- Virtual proposition routing
- Result enrichment

### 6.3 Google Civic Information API

**Purpose:** Representative lookup by ZIP code

**Capabilities:**
- Official lookup by address/ZIP
- Office information
- Contact details
- Official URLs

**Implementation:**
- API route in `app/api/zip/route.ts`
- Graceful error handling
- Fallback to official finder tools
- Context-aware vote searching

### 6.4 Seeded Data

For demonstration and fallback purposes, ClearPolicy includes seeded data:

**California Propositions:**
- Prop 17 (2020): Voting rights restoration
- Prop 47 (2014): Criminal justice reform

**Data Structure:**
- Full summaries at three reading levels
- Comprehensive citations
- Source documents
- Example use cases

**Seeding Process:**
- Prisma seed script (`prisma/seed.ts`)
- JSON data import
- Citation parsing
- Source ratio calculation

---

## 7. Non-Partisan Approach and Ethics

### 7.1 Content Policy

ClearPolicy adheres to strict content policies:

**Facts vs. Arguments:**
- Pros and cons are clearly labeled
- Sources distinguish facts from opinions
- No advocacy language

**Source Requirements:**
- Every section must have at least one primary source link
- Official sources prioritized
- Independent analysis clearly marked

**Neutrality:**
- No endorsements
- No campaign materials
- Balanced presentation required

### 7.2 Verification System

**Source Verification:**
- Official government sources verified
- Primary data sources validated
- Independent analysis sources checked

**Content Accuracy:**
- User feedback system
- Community corrections
- Moderation process

**Transparency:**
- Source Meter shows coverage
- Citation system enables verification
- "Why trust this?" links explain methodology

### 7.3 Educational Mission

ClearPolicy teaches **HOW** to read policy, not **WHAT** to think:

**Critical Thinking:**
- Source evaluation skills
- Citation following
- Fact-checking habits

**Civic Literacy:**
- Understanding legislative processes
- Recognizing official sources
- Connecting policy to representation

**Empowerment:**
- Confidence in policy reading
- Independent verification skills
- Informed decision-making

---

## 8. Educational Impact and Use Cases

### 8.1 Target Audiences

**High School Civics Students:**
- Understand ballot measures for class projects
- Learn to read and analyze legislation
- Develop source evaluation skills
- Connect policy to local representation

**First-Time Voters:**
- Navigate complex ballot measures
- Understand what they're voting on
- Verify information independently
- Make informed decisions

**Engaged Citizens:**
- Research specific bills and propositions
- Understand policy impacts
- Track representative voting records
- Stay informed on legislation

**Parents and Educators:**
- Teach children about civics
- Explain policy in accessible language
- Demonstrate source verification
- Encourage civic engagement

### 8.2 Educational Features

**Reading Level Adaptation:**
- Students can start at 5th-grade level
- Progress to more complex language
- Understand same content at different levels
- Build comprehension skills

**Source Literacy:**
- Learn to identify official sources
- Understand source hierarchy
- Practice citation following
- Develop verification habits

**Local Connection:**
- Understand representation
- Connect policy to local officials
- Track voting records
- Engage with representatives

### 8.3 Real-World Applications

**Classroom Use:**
- Civics teachers can use for assignments
- Students can research measures
- Compare reading levels
- Analyze source quality

**Voter Preparation:**
- Research before voting
- Understand ballot measures
- Verify campaign claims
- Make informed choices

**Community Engagement:**
- Understand local issues
- Connect with representatives
- Participate in public comment
- Advocate based on facts

---

## 9. Technical Implementation Details

### 9.1 Component Architecture

ClearPolicy uses a component-based architecture:

**Layout Components:**
- `Header.tsx`: Navigation and branding
- `Footer.tsx`: Site footer with links
- `TourOverlay.tsx`: Onboarding tour

**Feature Components:**
- `BillCard.tsx`: Measure summary display
- `InteractiveSummary.tsx`: Reading level management
- `ReadingLevelToggle.tsx`: Level selector
- `SourceMeter.tsx`: Citation coverage indicator
- `CitedLine.tsx`: Expandable quote display
- `DisambiguatorChips.tsx`: Query disambiguation
- `ZipPanel.tsx`: Representative lookup

**UI Components:**
- `HomeDemo.tsx`: Feature demonstration
- `FeatureGrid.tsx`: Feature showcase
- `Testimonials.tsx`: User testimonials
- `FeedbackBar.tsx`: Feedback collection

### 9.2 State Management

**Client-Side State:**
- React hooks for local state
- URL parameters for search state
- Local storage for preferences

**Server-Side State:**
- Database queries via Prisma
- API route handlers
- Server components for data fetching

**State Flow:**
- Search queries trigger API calls
- Results update UI state
- Navigation preserves context
- Reading level persists during session

### 9.3 Error Handling

**API Error Handling:**
- Graceful degradation when APIs unavailable
- Fallback to seeded data
- User-friendly error messages
- Retry mechanisms

**Validation:**
- Zod schemas for API inputs
- TypeScript for compile-time safety
- Runtime validation for user inputs

**User Experience:**
- Loading states
- Error messages
- Fallback content
- Helpful guidance

### 9.4 Performance Optimization

**Code Splitting:**
- Next.js automatic code splitting
- Dynamic imports where appropriate
- Route-based splitting

**Data Fetching:**
- Server-side rendering for initial load
- Client-side fetching for interactions
- Caching strategies
- Debounced search requests

**Asset Optimization:**
- Image optimization
- CSS minification
- JavaScript bundling
- Font optimization

---

## 10. Testing and Quality Assurance

### 10.1 Test Suite

ClearPolicy includes comprehensive end-to-end tests:

**Acceptance Tests:**
- Home page search functionality
- Measure card content validation
- Reading level differences
- Citation display
- Source meter accuracy
- ZIP panel functionality

**Accessibility Tests:**
- Axe-core integration
- WCAG AA compliance
- Score requirement: ≥95
- No critical violations

**Responsive Tests:**
- Mobile viewport validation
- Tablet viewport validation
- Desktop viewport validation

**Test Framework:**
- Playwright for E2E testing
- @axe-core/playwright for accessibility
- Test helpers for common operations

### 10.2 Quality Metrics

**Accessibility:**
- Lighthouse accessibility score
- ARIA label coverage
- Keyboard navigation
- Screen reader compatibility

**Performance:**
- Load time optimization
- Time to interactive
- Core Web Vitals
- Bundle size management

**Code Quality:**
- TypeScript strict mode
- ESLint enforcement
- Type safety throughout
- Consistent code style

---

## 11. Deployment and Infrastructure

### 11.1 Development Setup

**Requirements:**
- Node.js environment
- npm package manager
- API keys for external services

**Setup Process:**
1. Install dependencies: `npm install`
2. Configure environment variables
3. Initialize database: `npx prisma migrate dev`
4. Seed database: `npx prisma db seed`
5. Start dev server: `npm run dev`

**Environment Variables:**
- `CONGRESS_API_KEY`: Congress.gov API key
- `OPENSTATES_API_KEY`: Open States API key
- `GOOGLE_CIVIC_API_KEY`: Google Civic API key
- `DATABASE_URL`: SQLite database path
- `NEXT_PUBLIC_APP_NAME`: Application name

### 11.2 Production Deployment

**Platform:**
- Vercel (recommended)
- Automatic deployments from Git
- Environment variable configuration
- Database migration on deploy

**Build Process:**
- Next.js production build
- Prisma client generation
- Type checking
- Linting

**Monitoring:**
- Error tracking
- Performance monitoring
- Usage analytics
- API health checks

---

## 12. Future Enhancements and Roadmap

### 12.1 Planned Features

**Amendment Diff Visualization:**
- Green/red inline diff display
- Version comparison
- Change tracking

**Spanish Language Support:**
- Translated summaries
- Bilingual interface
- Cultural adaptation

**PDF Export:**
- Measure card PDF generation
- Printable summaries
- Shareable documents

**User Submissions:**
- Community-contributed summaries
- Moderation system
- Quality control

**AI-Powered Features:**
- Enhanced fact-checking
- Automated citation extraction
- Improved simplification

### 12.2 Scalability Considerations

**Multi-State Expansion:**
- Support for all 50 states
- State-specific data sources
- Jurisdiction-specific features

**International Expansion:**
- Other countries' legislation
- International data sources
- Multi-language support

**Performance Scaling:**
- Database optimization
- Caching strategies
- CDN integration
- API rate limit management

---

## 13. Conclusion: The Impact of ClearPolicy

ClearPolicy represents a significant advancement in civic technology. By combining sophisticated text simplification, intelligent search, comprehensive citation tracking, and seamless API integration, the platform makes policy accessible to everyone—from 5th-grade students to engaged citizens.

The application's commitment to non-partisanship, source transparency, and educational empowerment positions it as a trusted tool for civic engagement. Every feature is designed to teach users **how** to read and understand policy, not **what** to think about it.

As democracy faces challenges from misinformation and civic disengagement, tools like ClearPolicy are essential. They bridge the gap between complex government documents and public understanding, empowering citizens to make informed decisions and participate meaningfully in democratic processes.

The technical sophistication of ClearPolicy—from its rule-based NLP algorithms to its intelligent disambiguation system—demonstrates that civic technology can be both powerful and accessible. The platform's architecture supports future expansion while maintaining the simplicity and clarity that make it effective.

ClearPolicy is more than a web application; it's a tool for strengthening democracy through education, transparency, and accessibility. By making policy understandable, it empowers citizens to engage with their government, understand their representatives' actions, and make informed choices at the ballot box.

In an era where civic literacy is more important than ever, ClearPolicy provides a model for how technology can serve democracy. It demonstrates that complex problems can be solved with thoughtful design, rigorous engineering, and a commitment to public service.

---

## Technical Specifications Summary

**Technology Stack:**
- Frontend: Next.js 14, React 18, TypeScript, Tailwind CSS
- Backend: Next.js API Routes, Prisma ORM, SQLite
- APIs: Congress.gov v3, Open States v3, Google Civic Information
- Testing: Playwright, @axe-core/playwright
- Validation: Zod, TypeScript

**Key Algorithms:**
- Text simplification (rule-based NLP)
- Search ranking (multi-factor scoring)
- Disambiguation (pattern matching)
- Citation tracking (source ratio calculation)

**Database Models:**
- Measure (bills/propositions)
- Summary (reading-level content)
- SourceDoc (source documents)
- Feedback (user submissions)

**API Endpoints:**
- `/api/search` - Query search
- `/api/measure` - Measure data
- `/api/zip` - Representative lookup
- `/api/feedback` - User feedback
- `/api/prop/[num]` - Proposition routing

**Features:**
- 3 reading levels (5th, 8th, 12th grade)
- Source meter with citation tracking
- Disambiguation chips
- ZIP code representative lookup
- Non-partisan pros/cons
- Line-referenced citations
- Responsive design
- Dark mode support
- Accessibility (WCAG AA)

---

*This report provides a comprehensive overview of ClearPolicy, its features, architecture, and impact. For technical implementation details, refer to the source code and API documentation.*



