Continue building CONCEPT COMMERCE.

The design system and layout shell are in place. Now build the two primary
view states and the shared query input component.

---

CREATE: src/components/QueryInput.jsx

This is the shared text input used in both HomeView and ChatView.
It is a controlled component that accepts these props:
  - value: string
  - onChange: (value: string) => void
  - onSubmit: (query: string) => void
  - isLoading: boolean
  - placeholder: string (optional, default: "What are you looking for?")
  - variant: "centered" | "bottom" (default: "centered")

Behaviour:
- Pressing Enter submits (if not loading and value is not empty)
- Clicking the submit button submits
- While isLoading, the submit button shows a subtle animated spinner
  (CSS only, no library) and the input is disabled
- Input never shows a browser default outline — use a custom focus ring:
  border-color: var(--color-border-strong) on focus

Visual design:
- Full width of its container
- Height: 56px
- Background: var(--color-bg-elevated)
- Border: 1px solid var(--color-border-default)
- Border-radius: 2px (intentionally sharp — editorial aesthetic)
- Text: 16px, font-body, color: var(--color-text-primary)
- Placeholder: color: var(--color-text-tertiary)
- Padding: 0 16px on input text, 0 8px on right for button area
- Submit button: a minimal right-pointing arrow icon (use an SVG inline,
  no icon library). Color: var(--color-text-secondary), hover: var(--color-text-accent)
- Transition: border-color var(--transition-base), color var(--transition-base)
- variant="bottom": add a subtle top border only, no full border, no border-radius,
  background: var(--color-bg-base), width: 100%

---

CREATE: src/components/HomeView.jsx

The initial state shown when no queries have been made yet. Think of this
as a luxury search engine homepage.

Props:
  - onSubmit: (query: string) => void
  - isLoading: boolean

Layout (vertically centered in the viewport):
  - App name: "CONCEPT COMMERCE"
    Font: Cormorant Garamond, weight 300, size: clamp(32px, 5vw, 56px)
    Letter-spacing: 0.25em (wide tracking — editorial feel)
    Color: var(--color-text-primary)
    Margin-bottom: 8px

  - Tagline: "Search across stores. Find what matters."
    Font: DM Sans, weight 300, size: 14px
    Color: var(--color-text-secondary)
    Letter-spacing: 0.05em
    Margin-bottom: 48px

  - <QueryInput variant="centered"> — width: min(640px, 90vw)

  - Example query suggestions — rendered below the input as a row of chips.
    Show exactly 5 chips. Hard-code these values:
    1. "Acne Studios jeans in New York"
    2. "Stores in Austin carrying Agolde"
    3. "Show me dresses under $300 in LA"
    4. "Which is cheaper, Toteme or Agolde?"
    5. "Does any SF store carry Jacquemus?"

    Chip design:
    - Background: transparent
    - Border: 1px solid var(--color-border-default)
    - Border-radius: 2px
    - Padding: 6px 12px
    - Font: DM Sans, 12px, weight 400
    - Color: var(--color-text-secondary)
    - Hover: border-color var(--color-border-strong),
             color var(--color-text-primary)
    - Cursor: pointer
    - Clicking a chip calls onSubmit with that chip's text

  - Chips wrap on narrow viewports. Gap: 8px between chips.
  - Chips container: margin-top: 20px

The whole HomeView is absolutely or flex centered — vertically and horizontally
in the viewport. Use min-h-screen with flex items-center justify-center.

---

CREATE: src/components/ChatView.jsx

The view rendered after the first query. Has two regions:

REGION 1 — Scrollable history area (top, fills available space)
  - overflow-y: auto
  - Padding: var(--space-page-y) var(--space-page-x)
  - Each turn is rendered as a <TurnBlock> (built in Prompt 3)
  - After a new turn is added, auto-scroll to the bottom of this region
    (use a ref + scrollIntoView on the last turn)

REGION 2 — Fixed bottom input bar
  - Position: fixed, bottom: 0, left: 0, right: 0
  - Background: var(--color-bg-base)
  - Border-top: 1px solid var(--color-border-subtle)
  - Padding: 16px var(--space-page-x)
  - Contains <QueryInput variant="bottom">
  - App name "CONCEPT COMMERCE" rendered as a small label top-left of the
    input bar area, in DM Sans 10px, letter-spacing: 0.15em,
    color: var(--color-text-tertiary)

  Layout of the bottom bar:
    - Two rows stacked:
      Row 1: "CONCEPT COMMERCE" label (left-aligned)
      Row 2: the QueryInput spanning full width

  The scrollable history area must have padding-bottom of at least 120px
  so content is not hidden behind the fixed input bar.

Props:
  - turns: Array<{ query: string, result: object }>
  - onSubmit: (query: string) => void
  - isLoading: boolean

For now, render each turn as:
  <TurnBlock key={index} turn={turn} />

TurnBlock is a placeholder div for now — it will be built in Prompt 3:
  <div className="mb-12">
    <p className="text-text-secondary text-sm mb-4">{turn.query}</p>
    <p className="text-text-tertiary text-xs">Result type: {turn.result?.results?.type}</p>
  </div>

---

WIRE UP src/app/page.js

Replace the placeholder divs with the real components.

Add the handleSubmit function:
  async function handleSubmit(query) {
    if (!query.trim() || isLoading) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      setTurns(prev => [...prev, { query, result: data }]);
    } catch (err) {
      setTurns(prev => [...prev, {
        query,
        result: { ok: false, error: "Something went wrong. Please try again." }
      }]);
    } finally {
      setIsLoading(false);
      setInputValue("");
    }
  }

Pass handleSubmit as onSubmit to both HomeView and ChatView.

---

BACKTESTING

1. Load localhost:3000 — confirm HomeView renders centered with app name,
   tagline, input, and 5 suggestion chips
2. Click a suggestion chip — confirm it submits the query and transitions
   to ChatView
3. Confirm the input moves to the fixed bottom bar after first query
4. Confirm the app name label appears small in the bottom bar
5. Type a second query — confirm a second TurnBlock appears and the page
   auto-scrolls to it
6. Confirm the result type (e.g. "product_grid") is visible in the
   placeholder TurnBlock output
7. Confirm the page background remains dark throughout all states