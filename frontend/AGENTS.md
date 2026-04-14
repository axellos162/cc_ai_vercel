# AGENTS.md — CONCEPT COMMERCE Frontend

This file defines the rules, constraints, and context the agent must follow
at all times while developing the CONCEPT COMMERCE frontend. Read this file
in full before writing any code. Re-read relevant sections before each task.

---

## Project context

CONCEPT COMMERCE is a dark, editorial fashion search application. Users type
natural language queries into a chat interface and receive dynamically rendered
results — product grids, store maps, availability answers, and brand comparisons.

The frontend is a Next.js App Router application that consumes the Query API
at POST /api/v1/query, which lives in the same project. The API returns a
typed JSON envelope with an `intent` field and a `results.type` field that
drives which component renders.

This project has two layers that must stay in sync at all times:
1. The Query API (src/app/api/v1/query/) — do not modify this in Phase 2
2. The Frontend (src/app/page.js + src/components/) — this is the build target

---

## Aesthetic direction — non-negotiable

The aesthetic is **dark, editorial, silent luxury**. Think high-fashion concept
store. Every decision must serve this direction. When in doubt, choose the
option that is more restrained, more typographic, and more considered.

### The rules that define the aesthetic

- **Dark only.** There is no light mode. Every surface uses a dark token.
  If any element renders with a white or light background, it is a bug.
- **Sharp corners.** border-radius: 2px maximum on all interactive elements.
  No rounded cards. No pill buttons. No friendly bubbles.
- **No decorative elements.** No icons (except the submit arrow), no
  illustrations, no gradients, no shadows, no glows. Negative space and
  typography do the work.
- **The 1px gap as border.** The product grid uses gap: 1px with the page
  background showing through. This creates grid lines without borders on cards.
  Never add borders to ProductCard — the gap IS the border.
- **Two fonts, two roles, no exceptions.**
  Cormorant Garamond → content: product titles, brand names, large display
  text, availability answers, section headers in results.
  DM Sans → UI: labels, metadata, buttons, inputs, chips, captions,
  small text, loading states.
  Never swap these roles. Never use a third font.

---

## Design system

### CSS variables

All color, spacing, and typography values are defined as CSS variables in
src/app/globals.css. Never hardcode hex values anywhere in component files.
Always reference a CSS variable or its Tailwind alias.

```
/* Backgrounds */
--color-bg-base:       #0a0a0a    → bg-bg-base
--color-bg-surface:    #111111    → bg-bg-surface
--color-bg-elevated:   #1a1a1a    → bg-bg-elevated
--color-bg-overlay:    #222222    → bg-bg-overlay

/* Borders */
--color-border-subtle: #1f1f1f    → border-border-subtle
--color-border-default:#2e2e2e    → border-border-default
--color-border-strong: #444444    → border-border-strong

/* Text */
--color-text-primary:  #f0ede8    → text-text-primary
--color-text-secondary:#8a8680    → text-text-secondary
--color-text-tertiary: #4a4845    → text-text-tertiary
--color-text-accent:   #c9b99a    → text-text-accent  (warm gold)

/* Functional */
--color-sale:          #c9b99a    → sale prices, active states
--color-sale-bg:       #1e1a14    → sale badge backgrounds

/* Spacing */
--space-page-x: 48px              → horizontal page padding
--space-page-y: 32px              → vertical page padding

/* Transitions */
--transition-base: 200ms ease
--transition-slow: 400ms ease
```

### Tailwind

The Tailwind config extends the default theme with all of the above tokens.
Never use default Tailwind color classes (bg-gray-900, text-white, etc.) in
component files. Always use the custom tokens (bg-bg-surface, text-text-primary).

### Typography scale

| Use case | Font | Size | Weight | Tracking |
|---|---|---|---|---|
| App name (HomeView) | Cormorant Garamond | clamp(32px, 5vw, 56px) | 300 | 0.25em |
| Result headings | Cormorant Garamond | 22–24px | 300–400 | default |
| Product titles | Cormorant Garamond | 15px | 400 | default |
| Brand headers (comparison) | Cormorant Garamond | 18px | 400 | 0.15em |
| Section labels (STORES, PRODUCTS) | DM Sans | 10px | 400 | 0.15em |
| Body / metadata | DM Sans | 12–13px | 400 | default |
| Chips / badges | DM Sans | 10–12px | 400 | 0.05–0.1em |
| Prices | DM Sans | 11–12px | 400–500 | default |

---

## Project structure

Do not deviate from this structure without explicit instruction:

```
src/
├── app/
│   ├── layout.js              ← fonts, globals, metadata
│   ├── globals.css            ← CSS variables, base styles, scrollbar
│   ├── page.js                ← main chat page ("use client")
│   └── api/
│       └── v1/
│           └── query/
│               └── route.js  ← DO NOT MODIFY in Phase 2
├── components/
│   ├── QueryInput.jsx         ← shared input, variant: centered | bottom
│   ├── HomeView.jsx           ← pre-query centered state
│   ├── ChatView.jsx           ← post-query chat history + fixed input
│   ├── TurnBlock.jsx          ← one query + result pair
│   ├── ResultMeta.jsx         ← filter chips, shown at top of every result
│   ├── LoadingTurn.jsx        ← animated dots while API is in flight
│   ├── ProductCard.jsx        ← single product card
│   ├── ComparisonProductRow.jsx ← single row in comparison view
│   └── results/
│       ├── ProductGridResult.jsx
│       ├── StoreMapResult.jsx
│       ├── AvailabilityResult.jsx
│       ├── ComparisonResult.jsx
│       ├── DualResult.jsx
│       └── ErrorResult.jsx
```

Do not add new component files without a clear reason. Do not create
subdirectories within components/ beyond the existing results/ folder.

---

## Page state rules

src/app/page.js manages all top-level state. No other file should manage
query submission state or chat history.

State shape:
```js
const [turns, setTurns]               = useState([]);   // { query, result }[]
const [inputValue, setInputValue]     = useState("");
const [isLoading, setIsLoading]       = useState(false);
const [pendingQuery, setPendingQuery] = useState("");    // shown in LoadingTurn
```

State rules:
- `turns` is append-only. Never mutate or remove items from it.
- `inputValue` clears immediately on submit, before the API responds.
- `pendingQuery` is set when submit fires, cleared when the response arrives.
- `isLoading` gates the input — the input is disabled while true.
- The page renders `<HomeView>` when `turns.length === 0`,
  `<ChatView>` when `turns.length > 0`. No other condition.

---

## Component rules

### QueryInput

- Two variants: "centered" (HomeView) and "bottom" (ChatView fixed bar).
- variant="bottom" uses a full border (not top-only), border-radius: 4px
  (exception to the 2px rule for ChatGPT-like docked input pattern),
  background: var(--color-bg-elevated) (#1a1a1a).
- variant="bottom" on focus: border-color: var(--color-border-strong) (#444444)
  with subtle gold glow: box-shadow: 0 0 0 1px rgba(201, 185, 154, 0.15).
- variant="bottom" height: 60px (not 56px).
- variant="centered" keeps original styling: border all sides, border-radius: 2px,
  no focus glow.
- Submit on Enter key or button click.
- Disabled and shows spinner while isLoading.
- Never shows a browser default focus outline. Custom focus styling only.
- Submit button uses an inline SVG arrow — no icon library.

### HomeView

- Vertically and horizontally centered in the viewport (min-h-screen, flex).
- Exactly 5 hardcoded suggestion chips. Do not make these dynamic.
- Clicking a chip calls onSubmit — it does not just fill the input.
- Chip design: transparent background, sharp border, no hover fill —
  only border and text color change on hover.

### ChatView

- History area: no overflow-y auto on the main container (scrolling happens
  inside ProductGridResult), padding-bottom: 160px (clears fixed bar).
- Auto-scrolls to the latest TurnBlock when a new turn is added.
  Use a ref + scrollIntoView({ behavior: "smooth" }) on the last turn element.
- Fixed bottom bar: position fixed, bottom 0, full width.
- Bottom bar background: var(--color-bg-surface) (#111111), not var(--color-bg-base).
- Bottom bar box-shadow: 0 -1px 0 #2e2e2e, 0 -24px 48px rgba(0,0,0,0.7) for
  visual separation from content above.
- Bottom bar padding: 20px 64px 20px (more horizontal breathing room).
- Bottom bar inner content: max-width 900px, margin 0 auto (centered on wide
  viewports).
- App name "CONCEPT COMMERCE" renders as a small label above the input
  inside the bottom bar. DM Sans, 10px, letter-spacing: 0.15em,
  color: var(--color-text-tertiary), margin-bottom: 6px.

### TurnBlock

- Query line: DM Sans, 13px, color: var(--color-text-secondary),
  preceded by "→" in var(--color-text-tertiary).
- Result area: routed by results.type. See routing table below.
- Divider after result: 1px solid var(--color-border-subtle), margin-top: 48px.
- If result.ok === false: render ErrorResult.

### Result routing table

| results.type | Component |
|---|---|
| "product_grid" | ProductGridResult |
| "store_map" | StoreMapResult |
| "availability" | AvailabilityResult |
| "price_comparison" | ComparisonResult |
| "dual" | DualResult |
| anything else | ErrorResult |
| result.ok === false | ErrorResult |

### ResultMeta

- Always the first element rendered inside every result component.
- Never rendered by TurnBlock directly — each result component imports
  and renders it internally.
- Receives the full API response object as the `result` prop.
- Renders intent label + non-null filter chips + result count.
- Chips are display only in Phase 2 — no interactivity.
- Always has margin-bottom: 20px.
- Intent label mapping:
  product_search → "Product search"
  store_finder → "Store finder"
  availability_check → "Availability"
  price_comparison → "Comparison"
  ambiguous → "Broad search"

### ProductCard

- Entire card is an anchor tag linking to https://{store.domain} in a new tab.
- If store.domain is missing, render as a non-clickable div. Never throw.
- Image aspect ratio: 3/4 (portrait). Use Next.js <Image> with fill.
- Shimmer loading state on image placeholder until onLoad fires.
- No border on the card itself — the grid gap creates the visual separation.
- No border-radius.
- Price display logic:
  - If discounted_price exists and discounted_price < price:
    struck-through original price + gold sale price + "SALE" badge
  - Otherwise: single price in var(--color-text-secondary)
  - Format: no decimals if .00, otherwise 2 decimal places.
    Use: `price % 1 === 0 ? \`$\${price}\` : \`$\${price.toFixed(2)}\``

### ProductGridResult

- Grid: CSS Grid, auto-fill, minmax(220px, 1fr), gap: 1px.
- Show first 12 products. "Load more" button reveals 12 more per click.
- "Load more" button text: "Load {remaining} more".
- Empty state: centered "·" + "No results found." + guidance line.
- Never paginate with page numbers — always "load more" append.

### StoreMapResult

- Uses @vis.gl/react-google-maps — no other Maps library.
- API key from process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY only.
- Map options: disableDefaultUI: true, gestureHandling: "cooperative",
  colorScheme: "DARK". Never use custom JSON map styles.
- On mount: fit bounds to all markers with 60px padding.
- Marker design: 14px green circle (#5ab85f for stores carrying queried brand),
  border: 2px solid #0a0a0a (black).
  Selected marker: 18px, border: 2px solid #f0ede8 (light gray).
- Markers are JSX children of AdvancedMarker, not DOM elements passed to content prop.
- Sidebar: width 600px, slides in on marker click (width transition 300ms).
  width: 0, overflow: hidden when nothing selected.
  Sidebar has position: relative to contain the absolute-positioned close button.
  Sidebar padding: 28px. Close button: position absolute, top 16px, right 16px.
- When a marker is clicked, make a secondary fetch to /api/v1/query with a
  product-focused query: "{brand} products in {city}". This ensures the API
  returns products, not stores.
- While fetching, show sidebarLoading state with three animated dots
  (same style as LoadingTurn).
- Once loaded, filter products to only those belonging to the selected store
  by matching store.name.
- Display products in a 2-column grid with 1px gap. Show all products (no limit).
  Each product card shows image (3/4 ratio), title (Cormorant Garamond 13px),
  and effective price (DM Sans 11px) with discount logic.
- Local state in StoreMapResult:
  - sidebarProducts: [] — filtered products for the selected store
  - sidebarLoading: false — loading state during fetch
- Map height: 600px in StoreMapResult, 360px when used inside DualResult.

### AvailabilityResult

- Available true: "✓" in var(--color-text-accent) + message in Cormorant Garamond.
- Available false: "·" in var(--color-text-tertiary) + message in Cormorant Garamond.
- Sample images: horizontal row, overflow-x auto, 140px wide each, 3/4 ratio.
- Section label: "From the collection" — only shown when available and
  images exist.

### ComparisonResult

- Desktop (>= 768px): two columns side by side, gap: 1px.
- Mobile (< 768px): tab switcher. Two tab labels, active tab has bottom
  border in var(--color-text-accent). useState for active tab — no library.
- Each column shows brand name + avg effective price header, then
  ComparisonProductRow list.
- Show 8 rows per brand. "See all {n}" link if more exist.
- ComparisonProductRow: 72px tall, 48×64px image, title + category + price.

### DualResult

- Label line: "We found both stores and products matching your search."
- StoreMapResult renders first (map height: 360px).
- Divider between map and grid sections.
- Section labels: "STORES" and "PRODUCTS" — DM Sans, 10px, uppercase,
  letter-spacing: 0.15em, var(--color-text-tertiary).
- ProductGridResult renders below the divider.

### LoadingTurn

- Query line same style as TurnBlock.
- Three animated dots below the query line.
- Each dot: 4px circle, staggered fade animation to var(--color-text-accent).
- No text label — dots only.
- CSS keyframes only — no animation library.

### ErrorResult

- "×" character + message text. No card, no background.
- Hint line below: "Try rephrasing your query or check the example suggestions."
- DM Sans, 13px, var(--color-text-secondary).

---

## Google Maps rules

- Only use @vis.gl/react-google-maps. Never use @react-google-maps/api,
  google-maps-react, or any other Maps wrapper.
- The API key is NEXT_PUBLIC_GOOGLE_MAPS_API_KEY — always from env, never
  hardcoded.
- Always pass colorScheme: "DARK" — never attempt custom JSON styling.
- Always use AdvancedMarkerElement for markers — not the legacy Marker.
- Always fit bounds on mount using google.maps.LatLngBounds.
- Never render the map server-side — it must be a client component.

---

## API integration rules

- The Query API endpoint is POST /api/v1/query.
- Request body: { query: string, sort?: string }
- Never modify the API route file (src/app/api/v1/query/route.js) during
  Phase 2 frontend work.
- Always handle fetch errors gracefully — catch block pushes an error turn,
  never throws to the UI.
- Never display raw API error messages to the user — always show the
  ErrorResult component with a safe message.
- The full API response object must be passed to result components as the
  `result` prop so ResultMeta can access intent, filters, and meta.
- The store domain for product links comes from store.domain in the API
  response. Construct links as: https://{store.domain}

---

## Transitions and animation rules

- Page transition (HomeView → ChatView): fade out HomeView (opacity 0, 200ms),
  fade in ChatView (opacity 1, 300ms). CSS classes + setTimeout only.
- Sidebar (store map): width transition 300ms ease. No opacity trick.
- Shimmer (product card image): CSS keyframes on background-position only.
- Loading dots: CSS keyframes on opacity only, staggered 200ms per dot.
- Input border flash on submit: toggle CSS class, 150ms, then remove.
- No animation libraries (Framer Motion, GSAP, etc.) in Phase 2.
- All animations must respect prefers-reduced-motion. Wrap keyframe
  animations in @media (prefers-reduced-motion: no-preference).

---

## Responsive design rules

- Desktop-first. Primary target: 1280px+ viewport width.
- page padding: var(--space-page-x) = 48px horizontal.
- Product grid: auto-fill minmax(220px, 1fr) — reflows naturally.
- ComparisonResult: two-column on >= 768px, tabs on < 768px.
- Suggestion chips: flex-wrap on narrow viewports.
- No mobile-specific layouts beyond the comparison tab switch.
- Never use horizontal scroll on the page level.

---

## Performance rules

- Use Next.js <Image> for all product images. Never use <img> tags.
- Always set a fixed aspect ratio container around <Image fill> components.
- Lazy load images below the fold using loading="lazy" on <Image>.
- Show first 12 products in the grid — never render all 40 at once.
- Do not use any client-side data fetching library (SWR, React Query).
  The fetch call in page.js is the only data fetching mechanism.

---

## Dependency rules

Approved dependencies only:

| Package | Purpose |
|---|---|
| `next` | Framework |
| `react`, `react-dom` | Required by Next.js |
| `@supabase/supabase-js` | Database (API layer only) |
| `openai` | OpenAI SDK (API layer only) |
| `@vis.gl/react-google-maps` | Google Maps in StoreMapResult |

Do not add any other dependency without explicit approval. In particular:
- No animation libraries (Framer Motion, GSAP, Motion)
- No icon libraries (Lucide, Heroicons, FontAwesome)
- No component libraries (shadcn, Radix, MUI, Chakra)
- No data fetching libraries (SWR, React Query, Tanstack Query)
- No map libraries other than @vis.gl/react-google-maps
- No CSS-in-JS libraries

---

## Things the agent must never do

- Never use a light background on any element. Every surface is a dark token.
- Never hardcode a hex color value in a component file.
- Never use default Tailwind color classes (gray-900, white, black, etc.).
- Never use border-radius above 2px on interactive elements or cards, EXCEPT
  variant="bottom" QueryInput which uses 4px (ChatGPT-like docked input pattern).
- Never add borders to ProductCard — the grid gap is the border.
- Never use an icon library — the only icon is the submit arrow as inline SVG.
- Never use a third font — only Cormorant Garamond and DM Sans.
- Never use Cormorant Garamond for UI text (labels, buttons, chips, inputs).
- Never use DM Sans for product titles, brand names, or large display text.
- Never modify src/app/api/v1/query/route.js during frontend work.
- Never render ResultMeta inside TurnBlock — always inside the result component.
- Never use @react-google-maps/api or any Maps library other than @vis.gl/react-google-maps.
- Never hardcode the Google Maps API key — always use the env variable.
- Never pass colorScheme anything other than "DARK" to the Google Maps component.
- Never use an animation library — CSS keyframes and transitions only.
- Never render all 40 products at once — lazy load with "load more".
- Never use <img> tags — always Next.js <Image>.
- Never throw an unhandled error to the UI — always render ErrorResult.
- Never reduce ChatView history area padding-bottom below 160px — the fixed
  bottom bar requires this clearance.
- Never set variant="bottom" QueryInput border-radius above 4px.
- Never apply the focus glow (gold box-shadow) to variant="centered" QueryInput —
  only variant="bottom" gets the subtle glow.

---

## Before submitting any code

Run through this checklist before considering any task complete:

1. Does every background use a CSS variable dark token? No hardcoded hex?
2. Does every component use only Cormorant Garamond and DM Sans in their
   correct roles?
3. Do all cards and buttons have border-radius of 2px or less (except
   variant="bottom" QueryInput which is 4px)?
4. Does ProductCard have no border (only the grid gap creates separation)?
5. Is ResultMeta the first element inside every result component?
6. Does the Google Maps component use colorScheme: "DARK"?
7. Is the Google Maps API key read from process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?
8. Are all animations CSS-only with no animation library imports?
9. Does the product grid show max 12 products initially with load more?
10. Does every fetch error render ErrorResult rather than crashing?
11. Are all product images using Next.js <Image> with a fixed aspect ratio container?
12. Is the API route file untouched?
13. Is ChatView history area padding-bottom set to 160px minimum?
14. Does variant="bottom" QueryInput have the focus glow, but not variant="centered"?
15. Does StoreMapResult make a secondary fetch for products when a marker is clicked?
```
