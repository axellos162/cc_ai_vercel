Continue building CONCEPT COMMERCE.

The chat shell is working. Now build the TurnBlock component that renders
each query + result pair, and the result type router that decides which
renderer to show.

---

CREATE: src/components/TurnBlock.jsx

Props:
  - turn: { query: string, result: object }

Structure:
  1. Query line — the user's raw query text
     Font: DM Sans, 13px, color: var(--color-text-secondary)
     Before the query text, render a small right-arrow character "→"
     in color: var(--color-text-tertiary)
     Margin-bottom: 24px

  2. Result area — renders the appropriate result component based on
     turn.result.results.type

  3. Divider — after the result area, a full-width horizontal rule:
     border: none; border-top: 1px solid var(--color-border-subtle);
     margin-top: 48px

Result routing logic (a switch or if/else on results.type):
  "product_grid"  → <ProductGridResult data={result.results.data} />
  "store_map"     → <StoreMapResult data={result.results.data} filters={result.filters} />
  "availability"  → <AvailabilityResult data={result.results.data} />
  "comparison"    → <ComparisonResult data={result.results.data} />
  "dual"          → <DualResult data={result.results.data} filters={result.filters} />
  default         → <ErrorResult message="Unknown result type" />

If turn.result.ok === false:
  → <ErrorResult message={turn.result.error} />

All result components (ProductGridResult, StoreMapResult, etc.) are built in
subsequent prompts. For now, create placeholder components for each in
src/components/results/ that render the result type name and a JSON preview:
  <div className="text-text-secondary text-sm">
    <p className="font-mono text-xs text-text-tertiary mb-2">[{type}]</p>
    <pre className="text-xs overflow-auto">{JSON.stringify(data, null, 2)}</pre>
  </div>

---

CREATE: src/components/results/ErrorResult.jsx

Props: message: string

Design:
  - A single line, left-aligned
  - A small "×" character in color: var(--color-text-tertiary), margin-right: 8px
  - Message text: DM Sans, 13px, color: var(--color-text-secondary)
  - No background, no border, no card — just text
  - Below the message: a subtle hint in 11px var(--color-text-tertiary):
    "Try rephrasing your query or check the example suggestions."

---

CREATE: src/components/ResultMeta.jsx

A small metadata line rendered at the top of every successful result,
showing what the API understood. This addresses gap #9 from the gaps document
(visible filters).

Props:
  - result: the full API response object

Renders a single line of metadata chips:
  - Intent chip: e.g. "Product search" or "Store finder"
  - Filter chips (only render if value is not null):
    Brand: {brand}, City: {city}, Under ${price_max}, etc.
  - Result count: "{n} results"

Chip design:
  - Display: inline-flex, gap: 6px, flex-wrap: wrap
  - Each chip: padding 2px 8px, border: 1px solid var(--color-border-subtle),
    border-radius: 2px, font-size: 11px, color: var(--color-text-tertiary),
    font-family: var(--font-body), letter-spacing: 0.03em
  - No interactivity in Phase 2 (gap #9 dismissible chips is a future improvement)
  - Margin-bottom: 20px

Intent label mapping:
  product_search    → "Product search"
  store_finder      → "Store finder"
  availability_check→ "Availability"
  price_comparison  → "Comparison"
  ambiguous         → "Broad search"

Render <ResultMeta> at the top of each result component (ProductGridResult,
StoreMapResult, etc.). Import and use it inside each result component,
not in TurnBlock itself.

---

UPDATE: src/components/TurnBlock.jsx

Replace the placeholder routing divs with the real result components now
that they are created (as placeholders). The routing switch must be clean
and all result component imports must be at the top of the file.

---

BACKTESTING

1. Submit a query — confirm TurnBlock renders with the query line, arrow
   prefix, and the placeholder result component
2. Confirm ResultMeta renders with intent and filter chips above the result
3. Submit a second query — confirm both TurnBlocks are visible in the
   scroll history with the divider between them
4. Simulate an error by temporarily pointing the fetch at a bad URL —
   confirm ErrorResult renders cleanly with the hint text
5. Restore the correct fetch URL