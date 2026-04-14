Continue building CONCEPT COMMERCE.

Build the dual result renderer for ambiguous queries, add a proper loading
state to the chat interface, and apply final polish passes.

---

CREATE: src/components/results/DualResult.jsx

Props:
  - data: { product_grid: { products[] }, store_map: { stores[] } }
  - result: full API response
  - filters: filters object

Structure:
  1. <ResultMeta result={result} />

  2. A label line explaining the dual result:
     "We found both stores and products matching your search."
     DM Sans, 12px, color: var(--color-text-tertiary), margin-bottom: 32px

  3. Store map section:
     Section label: "STORES" — DM Sans, 10px, uppercase, letter-spacing: 0.15em,
     color: var(--color-text-tertiary), margin-bottom: 12px
     Render <StoreMapResult data={data.store_map} result={result} filters={filters} />
     but with height: 360px on the map (not the default 520px)

  4. Divider: margin: 40px 0, border-top: 1px solid var(--color-border-subtle)

  5. Product grid section:
     Section label: "PRODUCTS" — same style as "STORES" label
     Render <ProductGridResult data={data.product_grid} result={result} />

---

CREATE: src/components/LoadingTurn.jsx

Rendered in ChatView while isLoading is true, after the user submits a query.
It appears at the bottom of the chat history as a pending turn.

Props: query: string

Design:
  - Query line: same style as TurnBlock query line (arrow + text)
  - Below the query: a loading indicator
    Three dots that animate in sequence (CSS keyframes):
    Each dot: 4px × 4px circle, background: var(--color-text-tertiary)
    Gap: 6px between dots
    Animation: each dot fades up to var(--color-text-accent) and back,
    staggered by 200ms
    The three dots sit on their own line, margin-top: 16px

  No text label — the animated dots communicate "thinking" without words.

UPDATE src/components/ChatView.jsx:

At the bottom of the turns list, if isLoading is true, render:
  <LoadingTurn query={currentQuery} />

currentQuery is the query that was just submitted but not yet answered.
Pass it as a prop from the page: src/app/page.js must track it in state
as pendingQuery (set when submit fires, cleared when result arrives).

---

FINAL POLISH PASS

Apply the following refinements throughout the app:

1. PAGE TRANSITIONS
   When transitioning from HomeView to ChatView (first query submitted),
   add a fade transition:
   - HomeView: opacity 1 → 0 over 200ms, then unmount
   - ChatView: mounts at opacity 0, fades to 1 over 300ms
   Implement with CSS classes and a short setTimeout. No animation library.

2. SCROLLBAR STYLING
   In globals.css, style the scrollbar for the chat history area:
   ::-webkit-scrollbar { width: 4px; }
   ::-webkit-scrollbar-track { background: transparent; }
   ::-webkit-scrollbar-thumb {
     background: var(--color-border-default);
     border-radius: 2px;
   }
   ::-webkit-scrollbar-thumb:hover { background: var(--color-border-strong); }

3. INPUT SUBMISSION FEEDBACK
   After a query is submitted, briefly flash the input border to
   var(--color-text-accent) before it clears. Duration: 150ms.
   Implement with a CSS class toggled via state.

4. PRODUCT CARD IMAGE LOADING
   Add a shimmer loading state for product card images while they load.
   Implement as a CSS animation on the fallback background:
   @keyframes shimmer {
     0%   { background-position: -200% 0; }
     100% { background-position:  200% 0; }
   }
   background: linear-gradient(90deg,
     var(--color-bg-elevated) 25%,
     var(--color-bg-overlay) 50%,
     var(--color-bg-elevated) 75%);
   background-size: 200% 100%;
   animation: shimmer 1.5s infinite;
   Remove shimmer once the image has loaded (onLoad event on <Image>).

5. EMPTY RESULTS STATE
   In ProductGridResult, if data.products.length === 0:
   Render a centered message:
   - "·" in Cormorant Garamond, 48px, color: var(--color-text-tertiary)
   - "No results found." in Cormorant Garamond, 20px, weight 300,
     color: var(--color-text-secondary), margin-top: 8px
   - "Try a different city, brand, or price range." in DM Sans, 12px,
     color: var(--color-text-tertiary), margin-top: 4px

6. RESULT META SPACING
   Ensure ResultMeta always has margin-bottom: 20px and is always the
   first element inside every result component.

7. QUERY INPUT CLEAR ON SUBMIT
   Confirm the input value clears immediately on submit (before the API
   response arrives), not after. This gives immediate feedback that the
   query was registered.

---

FINAL INTEGRATION BACKTESTING

Run through the following complete user journeys end to end:

JOURNEY 1 — Product search with discount
  1. Load localhost:3000 — HomeView renders centered
  2. Click chip "Acne Studios jeans in New York"
  3. HomeView fades out, ChatView fades in
  4. LoadingTurn appears with the three-dot animation
  5. Product grid renders with cards
  6. Any discounted products show struck-through price + gold sale price
  7. "Load more" appears if > 12 results, works on click
  8. Type a second query in the bottom input — second TurnBlock appears below

JOURNEY 2 — Store map
  1. Type "stores in Austin carrying Agolde"
  2. Dark map renders with gold markers
  3. Map auto-fits to show all markers
  4. Click a marker — sidebar slides in with store details + images
  5. Click × — sidebar closes

JOURNEY 3 — Availability
  1. Type "does any SF store carry Toteme"
  2. Availability result renders with ✓ or · and brand imagery

JOURNEY 4 — Comparison
  1. Type "which is cheaper, Toteme or Agolde"
  2. Two-column comparison renders with avg prices and product rows
  3. Resize to < 768px — tab layout appears, switching works

JOURNEY 5 — Ambiguous / dual
  1. Type "good denim in LA"
  2. Dual result renders: store map on top, product grid below
  3. Map has reduced height (360px), markers visible, sidebar works

JOURNEY 6 — Error handling
  1. Type gibberish or a very unusual query
  2. Either a low-result product grid renders, or a clean error state
  3. No white flash, no broken layout, no console errors

JOURNEY 7 — Empty result
  1. Query for a brand + city combination that doesn't exist in the data
  2. Empty state renders with "·" and guidance text

All 7 journeys must complete without console errors before Phase 2 is
considered done.