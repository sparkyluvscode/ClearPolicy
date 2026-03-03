# ClearPolicy App (app.clearpolicy.org) - Comprehensive Style Report

**Purpose:** This document describes the visual design, typography, color system, component patterns, and overall aesthetic of the ClearPolicy web application so that external pages (e.g., clearpolicy.org waitlist) can align with or adapt to this style.

---

## 1. Design Philosophy and Identity

The ClearPolicy app is built around a **warm, civic, and trustworthy** visual identity. The design system explicitly aims for:

- **Non-partisan clarity** - Neutral, readable, and authoritative; suitable for students, journalists, and voters.
- **Liquid glass aesthetic** - Frosted, translucent surfaces with backdrop blur, inspired by modern app interfaces (e.g., Ramp, Apple).
- **Warm cream base** - A soft off-white background (#FAF9F6) inspired by OpenNote.com, reducing glare and feeling less harsh than pure white.
- **Civic/ institutional** - The primary accent is a muted blue (#4A7BBA) suggesting government, trust, and reliability rather than consumer-tech flashiness.

The app avoids playful or consumer-tech aesthetics. No emojis in production UI, no gradients on buttons, no bright neons. It reads as a professional, civic-focused research tool.

---

## 2. Color System

The color system is built on a small set of semantic tokens. Every background, text, accent, and border uses these variables rather than raw hex values, which makes theming and dark mode consistent.

### 2.1 Light Mode

**Backgrounds:**
- `--cp-bg`: `#FAF9F6` - Main page background (warm off-white)
- `--cp-surface`: `rgba(255, 253, 250, 0.9)` - Glass cards, inputs
- `--cp-surface-2`: `rgba(252, 251, 248, 0.95)` - Secondary panels, hover states
- `--cp-hover`: `rgba(248, 247, 244, 0.95)` - Hover backgrounds
- `--cp-doc`: `rgba(255, 253, 250, 0.95)` - Document-style containers

**Text:**
- `--cp-text`: `#1A1A1A` - Primary body and headings
- `--cp-muted`: `#5A5A5A` - Secondary text, labels
- `--cp-tertiary`: `#8A8A8A` - Captions, placeholders

**Civic Accents:**
- `--cp-accent`: `#4A7BBA` - Primary blue (buttons, links, focus rings)
- `--cp-accent-soft`: `rgba(74, 123, 186, 0.08)` - Soft accent backgrounds
- `--cp-green`: `#5EAF8E` - Verified checkmarks, success
- `--cp-coral`: `#E07A5F` - Debate mode, rhetoric alerts, warnings
- `--cp-gold`: `#D4A574` - Document analysis, highlights
- `--cp-warning`: `#E0A95F` - Inferred content badges
- `--cp-error`: `#D76A5F` - Error states

**Borders:**
- `--cp-border`: `rgba(26, 26, 26, 0.08)` - Subtle, translucent
- `--cp-border-medium`: `rgba(26, 26, 26, 0.12)` - Slightly stronger dividers

**Shadows:**
- `--cp-shadow-soft`: Very light shadows for cards
- `--cp-shadow-card`: Medium elevation for interactive elements
- `--cp-shadow-elevated`: Stronger for modals and elevated panels

**Atmospheric glows:**
- `--cp-glow-1`: `rgba(74, 123, 186, 0.06)` - Soft blue gradient
- `--cp-glow-2`: `rgba(94, 175, 142, 0.03)` - Soft green gradient

These glows are used in radial gradients on the body background to create a subtle atmospheric depth, not harsh gradients. The effect is intentionally subtle - users may not consciously notice the gradients, but they add warmth and depth. The blue glow sits near the top-left, the green near the top-right; both fade to transparent within 50–60% of their radius. No saturated color blocks or aggressive gradients appear anywhere in the interface.

**Usage guidelines:** The primary accent (`--cp-accent`) should be used sparingly - for primary CTAs, active states, links, and focus indicators. Overuse of the blue would dilute its impact. The semantic colors (green, coral, gold) are reserved for specific meaning: green for verified or success states, coral for debate/rhetoric or caution, gold for document-related content or highlights. The muted and tertiary text colors create a clear hierarchy: primary content in `--cp-text`, secondary in `--cp-muted`, and captions or metadata in `--cp-tertiary`.

### 2.2 Dark Mode

Dark mode uses a warm dark base:
- `--cp-bg`: `#1E1E1C` - Dark warm gray, not pure black
- `--cp-surface`, `--cp-surface-2`: Darker translucent layers
- `--cp-text`: `#FDFCF7` - Warm off-white for text
- `--cp-muted`: `#B8B6AD`, `--cp-tertiary`: `#7A7870`
- Accent colors are lightened for contrast (e.g., `--cp-accent`: `#7BA3D4`)

Dark mode is toggled via a class on `<html>` (`html.dark`) and respects `prefers-color-scheme` with localStorage override.

---

## 3. Typography

Typography is a major part of the ClearPolicy identity. The combination of a classic serif (Libre Baskerville) for headings and a clean sans-serif (Inter) for body creates an editorial, civic feel - similar to a trusted newspaper or government publication. It signals seriousness and clarity without feeling cold or corporate.

**Font stack:**
- **Headings:** Libre Baskerville (serif), loaded via `next/font/google` with weights 400 and 700
- **Body:** Inter (sans-serif), variable `--font-inter`

**Heading conventions:**
- Page titles: `font-heading text-4xl md:text-5xl font-bold tracking-tight`
- Section titles: `font-heading text-2xl font-bold` or `text-xl font-semibold`
- Card/component headings: `text-sm font-semibold` or `text-[15px] font-medium`

**Section labels (small caps):**
- `.section-label`: `11px`, `font-weight: 600`, `uppercase`, `letter-spacing: 0.1em`, `color: var(--cp-muted)`
- Used for "How it works", "Product", "Resources", "Try asking", etc.

**Body text:**
- Default: `16px`, `line-height: 1.6`
- Content paragraphs: `text-[15px] sm:text-[16px]`, `leading-[1.8]` for long-form
- Muted/tertiary: `text-sm text-[var(--cp-muted)]` or `text-xs text-[var(--cp-tertiary)]`

**Tracking:**
- Headlines: `tracking-tight` or `tracking-tighter`
- Section labels: `letter-spacing: 0.1em` or `0.12em`
- No dramatic letter-spacing on body

---

## 4. Liquid Glass System

The app relies heavily on **glassmorphism**, a design trend that uses translucent, blurred surfaces to create depth and a sense of layers. Unlike flat, opaque cards, glass surfaces allow a hint of the background to show through, which feels modern and lightweight. The effect is achieved with `backdrop-filter: blur()` and semi-transparent backgrounds. On supported browsers, this creates a frosted-glass look; on older browsers, the semi-transparent background still provides a softer appearance than solid blocks.

**`.glass-card`**
- Background: `var(--cp-surface)`
- Border: `1px solid var(--cp-border)`
- Shadow: `var(--cp-shadow-soft)`
- `backdrop-filter: blur(20px) saturate(140%)`
- Used for search box, feature cards, about blocks, etc.

**`.glass-doc`**
- Slightly stronger blur and shadow for document-style content

**`.glass-input`**
- Same translucent surface with lighter blur for inputs

**`.glass-nav`** (legacy)
- For navbar; includes a subtle top highlight gradient overlay

**Header states:**
- `.cp-header--top`: Fully transparent, no border or shadow (at top of page)
- `.cp-header--scrolled`: Liquid glass effect with blur, semi-transparent background, soft shadow - similar to Ramp’s scroll behavior

---

## 5. Component Patterns

### 5.1 Buttons

- **Primary (`.btn-primary`):** `background: var(--cp-accent)`, white text, `border-radius: 12px`, soft blue shadow, `hover: brightness(1.08)`, `active: scale(0.97)`
- **Secondary (`.btn-secondary`):** Glass surface, `border: 1px solid var(--cp-border)`, text color from `--cp-text`
- **Ghost (`.btn-ghost`):** Transparent, hover uses `--cp-accent-soft`
- **Pill CTA:** `rounded-full px-5 py-2` for "Get Started" in header

Common inline styles: `rounded-xl` (12px), `rounded-2xl` (16px) for larger cards.

### 5.2 Cards

- `glass-card rounded-xl p-5` or `rounded-2xl p-6 md:p-8`
- Often paired with `surface-lift` for hover: `translateY(-1px)` and stronger shadow
- Accent left border: `borderLeft: "3px solid var(--cp-accent)"` for featured blocks

### 5.3 Form Elements

- Inputs: Rounded (`rounded-xl`), subtle border, glass-style background
- Focus: `focus:ring-2 focus:ring-[var(--cp-accent)]/15` or similar
- ZIP input: Minimal, `border-b` only, inline with location icon

### 5.4 Badges and Chips

- Small labels: `text-[11px] font-semibold uppercase tracking-widest`
- Confidence dots: `w-1.5 h-1.5 rounded-full` with semantic colors (green/verified, gold/inferred, coral/unverified)
- Citation pills: `color-mix(in srgb, ${accentColor} 12%, transparent)` for pill background

### 5.5 Spacing and Layout

- Max content width: `max-w-[1200px]` for main layout, `max-w-3xl` for readable content columns
- Section spacing: `space-y-8`, `space-y-12`, `gap-10`
- Padding: `px-4 sm:px-6 lg:px-12`, `py-8`, `p-5`, `p-6 md:p-8`

---

## 6. Animation and Motion

**Animations:**
- `animate-fade-in`: Opacity 0 → 1
- `animate-fade-up`: Opacity 0 → 1 + `translateY(12px) → 0`
- `animate-slide-in`: `translateX(100%) → 0` (e.g., mobile menu, sources drawer)

**Stagger:**
- `.stagger > *:nth-child(n)` gets incremental `animation-delay` (0ms, 50ms, 100ms, …) for sequential reveals

**Transitions:**
- `transition-all duration-200 ease-out` or `duration-300`
- Header scroll transition: `duration-500 ease-out`
- Hover lift: `transform: translateY(-1px)`

**Reduced motion:**
- `@media (prefers-reduced-motion: reduce)` shortens animations to ~0.01ms

Animations are kept short (typically 200–500ms) so that the interface feels responsive. The stagger effect on lists (e.g., feature cards, example queries) creates a gentle cascade that draws the eye without feeling slow. The search page uses a slight entrance delay so that the portal renders first, then fades in - avoiding any flash of unstyled content.

---

## 7. Layout Architecture

The layout follows a classic app structure: fixed header, scrollable main content, footer. The header is full-width and spans the viewport, while the main content is constrained to a max-width for readability. On the search results page, the layout switches to an immersive full-screen mode where the normal chrome is hidden and the user sees only the search UI.

**Header:**
- Fixed, full-width, `z-50`
- Logo (image + "ClearPolicy" in heading font) on left
- Nav links (Browse, Compare, About, My Research, Settings) in center/right
- Dark mode toggle + "Get Started" / UserButton on right
- Mobile: Hamburger opens slide-in drawer from right

**Main content:**
- Wrapped in `max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-12 pb-20 pt-6`
- Header spacer: `h-16` to account for fixed header

**Footer:**
- Divider line, brand block, link columns (Product, Resources)
- Small text: `text-sm text-[var(--cp-tertiary)]`
- "Powered by Omni-Search" in accent color

**Immersive mode (search results):**
- `body.cp-immersive` hides header, footer, and main wrapper
- Full-screen portal (`createPortal`) with `z-index: 99999`
- Split layout: left = content (top bar + scroll + input), right = sources sidebar (320px)
- Mobile: Sources in slide-out drawer, FAB to open

---

## 8. Homepage Structure

The homepage is the primary entry point and is designed to feel welcoming yet focused. The hero takes up significant vertical space to establish the product's value proposition before the user reaches the search box. When a user is signed in, the hero switches from marketing copy to a personalized greeting (e.g., "Good afternoon, [Name]") to create a sense of continuity and ownership.

- **Hero:** Large serif headline, supporting copy, optional personalized greeting when signed in
- **Search box:** Large glass card with textarea, Attach, ZIP, Debate toggle, Search button
- **Trust line:** Small text like "Drop any PDF or document to analyze · Powered by Omni-Search"
- **Example queries:** Chips with `border border-[var(--cp-border)]`, hover states
- **Topics:** Grid of topic buttons (Healthcare, Immigration, etc.)
- **Footer trust badges:** Icons + "Every claim cited", "Non-partisan", "Local context"

---

## 9. Search / Results Experience

The search results view is the core product experience. It is rendered as a full-screen portal (using React's createPortal) so that it overlays the entire page and feels like a dedicated workspace rather than a section within the main site. The layout is split: content on the left, sources sidebar on the right (hidden on mobile, accessible via a floating action button that opens a slide-out drawer).

- **Top bar:** Back button, policy name, reading level toggle (Simple / Standard / Detailed)
- **Content area:** Max-width 3xl, flowing text (not chunky cards), section headings with confidence dots
- **Trust line:** "X/Y cited · N sources" with green check icon
- **Rhetoric vs. Reality:** Coral accent, left border, compact typography
- **Follow-up input:** Fixed bottom bar, glass input, send button
- **Sources panel:** Numbered list, click to preview, "View source" links

---

## 10. Iconography

Icons are used sparingly and consistently. The app avoids icon libraries in favor of inline SVGs, which keeps the bundle small and ensures visual consistency. All icons use `stroke="currentColor"` so they inherit the text color of their parent.

- **Style:** Outline/stroke icons only (no filled shapes in primary UI)
- **Source:** Inline SVG, `stroke="currentColor"`, `strokeWidth="2"` or `1.8`
- **Size:** Typically `w-4 h-4` (16px) or `w-3.5 h-3.5` (14px)
- No icon library; custom SVGs for consistency

---

## 11. Responsive Breakpoints

- Tailwind defaults: `sm` 640px, `md` 768px, `lg` 1024px
- Mobile: Single column, hamburger menu, slide-out panels
- Desktop: Multi-column grids (e.g., `md:grid-cols-3`), visible nav, sources sidebar

---

## 12. Scrollbar and Overscroll

- Scrollbars hidden: `scrollbar-width: none`, `::-webkit-scrollbar { display: none }`
- `overscroll-behavior-y: none` on body
- `scroll-behavior: smooth` on html

---

## 13. Accessibility

- `focus-ring` utility for focus-visible states
- `aria-label` on icon-only buttons
- Semantic HTML (nav, main, footer, section)
- Reduced-motion support
- Color contrast: Dark text on light cream, muted grays for secondary

---

## 14. Summary: Key Differentiators from Typical Marketing Sites

The ClearPolicy app deliberately diverges from generic SaaS or startup marketing aesthetics. It does not use gradients on buttons, neon accents, or playful illustrations. Instead, it opts for a restrained, editorial feel that fits its civic-education mission. Below are the most important differentiators that should be preserved or replicated when aligning other pages.

1. **Warm cream base (#FAF9F6)** - Not pure white
2. **Serif + sans pairing** - Libre Baskerville for headings, Inter for body
3. **Liquid glass** - Translucent cards with backdrop blur
4. **Civic blue accent (#4A7BBA)** - Institutional, not consumer
5. **Semantic accent palette** - Green (verified), coral (debate/rhetoric), gold (doc)
6. **Soft shadows and glows** - No harsh drop shadows
7. **No emojis** - Professional, text-only
8. **Rounded corners** - 12px (xl) and 16px (2xl) consistently
9. **Full-width header with scroll transition** - Transparent at top, glass when scrolled
10. **Immersive full-screen search** - Portal-based, not inline

---

## 15. Design Rationale: Why This Style Works for Civic Tech

ClearPolicy is a civic-education tool. Its users include students researching policy for assignments, journalists fact-checking legislation, and voters preparing for elections. The design choices reflect this audience:

- **Trust and neutrality:** The muted blue accent and lack of bold consumer-style colors signal seriousness. Users are more likely to trust content that doesn't look like a flashy ad.
- **Readability first:** Long-form policy content requires comfortable reading. The cream background reduces eye strain, and the serif/sans pairing creates clear hierarchy without overwhelming the reader.
- **Professional, not corporate:** Libre Baskerville and Inter feel editorial rather than corporate. The glass effects and subtle animations add polish without feeling gimmicky.
- **Accessibility and inclusiveness:** The design supports dark mode, reduced motion, and clear focus states. The typography and contrast are tuned for extended reading sessions.

When adapting another page (e.g., a waitlist or landing page) to match the app, these principles should guide decisions: prioritize readability, maintain a calm and trustworthy tone, and avoid visual noise that could distract from the core message.

---

## 16. Detailed Implementation Notes for Alignment

### CSS Variables to Replicate

If rebuilding the style from scratch, these are the critical variables:

```css
:root {
  --cp-bg: #FAF9F6;
  --cp-surface: rgba(255, 253, 250, 0.9);
  --cp-surface-2: rgba(252, 251, 248, 0.95);
  --cp-text: #1A1A1A;
  --cp-muted: #5A5A5A;
  --cp-tertiary: #8A8A8A;
  --cp-accent: #4A7BBA;
  --cp-accent-soft: rgba(74, 123, 186, 0.08);
  --cp-green: #5EAF8E;
  --cp-coral: #E07A5F;
  --cp-gold: #D4A574;
  --cp-border: rgba(26, 26, 26, 0.08);
  --font-heading: "Libre Baskerville", Georgia, serif;
  --font-sans: "Inter", system-ui, sans-serif;
}
```

### Font Loading

The app uses Next.js font optimization:

- `Inter` with `variable: "--font-inter"`, `display: "swap"`
- `Libre_Baskerville` with weights 400 and 700, `variable: "--font-heading"`

Both are applied to `<html>` via `className`. Ensure equivalent loading (e.g., Google Fonts) for non-Next.js projects.

### Body Background

The body uses a layered gradient for subtle depth:

```css
background:
  radial-gradient(ellipse 1400px 900px at 10% -15%, var(--cp-glow-1), transparent 60%),
  radial-gradient(ellipse 1000px 700px at 90% 5%, var(--cp-glow-2), transparent 50%),
  var(--cp-bg);
background-attachment: fixed;
```

This creates soft blue and green glows in the corners without drawing attention.

### Header Scroll Behavior

The header has two distinct states:

- **At top of page:** `background: transparent`, no border, no shadow. The header visually "floats" and blends with the hero.
- **On scroll:** Background becomes `rgba(250, 249, 246, 0.82)` with `backdrop-filter: blur(20px) saturate(140%)`, a 1px border, and soft shadow. This is the "liquid glass" effect.

Dark mode equivalents use darker translucent backgrounds (`rgba(30, 30, 28, 0.72)`).

### Spacing Scale

The app uses a consistent spacing scale:

- `gap-2` (8px), `gap-3` (12px), `gap-4` (16px) for inline/tight layouts
- `p-4`, `p-5`, `p-6` for card padding
- `mb-2`, `mb-3`, `mb-4`, `mb-6`, `mb-8` for vertical rhythm
- `space-y-6`, `space-y-8`, `space-y-10`, `space-y-12` for stacked sections

### Border Radius Hierarchy

- Buttons, inputs, small chips: `rounded-xl` (12px)
- Large cards, modals: `rounded-2xl` (16px)
- Pill buttons (e.g., Get Started): `rounded-full`
- Small badges: `rounded-lg` (8px) or `rounded-md` (6px)

### Interaction Feedback

- Buttons: `hover:brightness-110`, `active:scale-[0.97]`
- Cards: `surface-lift` for `hover:translateY(-1px)` and stronger shadow
- Links: `hover:text-[var(--cp-text)]` for muted links, `hover:underline` for accent links
- Focus: `focus-visible:ring-2 focus-visible:ring-offset-2` with `--tw-ring-color: var(--cp-ring)`

---

## 17. Content and Copy Tone

The app’s copy is:

- **Direct and informative** - No marketing fluff
- **Trust-oriented** - "Every claim cited", "Non-partisan", "Plain-English"
- **Action-oriented** - "Search", "Get Started", "Try it yourself"
- **Audience-aware** - "Built for students, journalists, and voters"

Headlines use clear value statements (e.g., "Policy research that actually explains things") rather than vague slogans.

---

## 18. Grid and Column Patterns

- **2-column feature grid:** `grid-cols-1 sm:grid-cols-2` with `gap-3`
- **3-column steps/how-it-works:** `md:grid-cols-3` with `gap-3` or `gap-4`
- **Max widths:** `max-w-md` for narrow modals, `max-w-xl` for hero copy, `max-w-2xl` for search box, `max-w-3xl` for content columns, `max-w-4xl` for immersive content

---

## 19. Error and Loading States

- **Loading spinner:** 24px circle, `border-2 border-[var(--cp-accent)]/30 border-t-[var(--cp-accent)]`, `animate-spin`
- **Skeleton:** `bg-[var(--cp-surface-2)] animate-pulse` with varied heights/widths
- **Error messages:** Red-tinted backgrounds (`bg-red-50/60 dark:bg-red-900/10`), `text-red-600 dark:text-red-400`
- **Empty states:** Centered icon in circular accent background, headline, supporting text, CTA button

---

## 20. Modal and Overlay Patterns

- **Backdrop:** `fixed inset-0 bg-black/20 backdrop-blur-sm`
- **Modal content:** `glass-card` or solid `bg-[var(--cp-bg)]`, `rounded-2xl`, `shadow-elevated`
- **Slide-in panels:** `animate-slide-in` from right, `w-72` or `w-80`, full height
- **Z-index layering:** Backdrop ~40, panel ~50; immersive portal ~99999

---

## 21. Checklist for Style Alignment

When adapting another page (e.g., clearpolicy.org waitlist) to match the app:

- [ ] Use `#FAF9F6` as primary background (or equivalent warm off-white)
- [ ] Use Libre Baskerville for headings and Inter for body
- [ ] Set primary accent to `#4A7BBA`
- [ ] Apply glassmorphism (backdrop-filter blur, translucent backgrounds) to cards
- [ ] Use `rounded-xl` and `rounded-2xl` for corners
- [ ] Add subtle radial gradients to body background
- [ ] Implement header that transitions from transparent to glass on scroll
- [ ] Use `.section-label` style for small caps section headers
- [ ] Ensure focus rings use the accent color at low opacity
- [ ] Respect `prefers-color-scheme` and offer dark mode with warm dark base `#1E1E1C`
- [ ] Avoid emojis and playful visuals; keep a civic, professional tone

To align another site (e.g., clearpolicy.org) with this app, adopt the same color variables, font stack, glass-card treatment, button styles, and spacing conventions described above, and use this report as a reference for implementation details.
