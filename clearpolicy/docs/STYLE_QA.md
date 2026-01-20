## ClearPolicy UI/UX Style QA

This checklist is a repeatable audit for readability, contrast, and interaction safety.

### Contrast + Readability (manual)
- Body text on glass panels is legible (no text opacity < 0.75).
- Headings stand out against body text (size + weight difference).
- Muted text is still readable on glass cards.
- Badges are readable on glass backgrounds.
- Tooltips have readable contrast and remain within viewport.

### Component Checks
- Buttons: primary/secondary/ghost have clear states, visible focus rings.
- Inputs: placeholder text readable; focus ring visible; no transparent text.
- Cards: glass panels readable; document cards feel denser but legible.
- Disclosures: button labels visible; content not hidden behind overlays.
- Tabs/Segmented controls: selected state clear.

### Accessibility
- Keyboard navigation works across header, search, toggles, disclosures.
- All icon-only buttons include `aria-label`.
- Links are real anchors with `href`.
- Focus rings visible on dark and light themes.

### Performance
- Glass blur is used on nav + cards only.
- No full-screen backdrop-filter overlays blocking clicks.
- Motion respects `prefers-reduced-motion`.

### Automated Checks
- Run Playwright acceptance: `npm run test:accept`
- Run a11y checks (axe): `npm run test:accept` includes critical violations gate.
