# AGENTS.md

This file defines the rules, constraints, and context that the agent must follow
at all times while developing the Shopify → Supabase scraper project. Read this
file in full before writing any code, and re-read the relevant sections before
each task.

---

## Project context

This is a Node.js scraper that reads Shopify store product data via the public
API and writes it into a Supabase (Postgres + pgvector) database. It runs
locally on the developer's machine, on demand, at most once per week.

The output of this scraper feeds a downstream fashion product search application
that uses vector similarity and structured SQL filters to answer natural language
queries. Every decision about data shape, naming, and quality has downstream
consequences for that search layer.

---

## Language and module system

- Node.js only. No Python, no shell scripts for application logic.
- ESM throughout. Use `import`/`export` everywhere. Never use `require()`.
- `"type": "module"` must be set in `package.json`.
- File extensions must be `.js`. Do not use `.mjs` or `.cjs`.
- Do not use TypeScript unless explicitly instructed.

---

## Project structure

Do not deviate from this structure without explicit instruction:

```
shopify-scraper/
├── .env                  ← never committed, gitignored
├── .env.example          ← committed, no real values
├── .gitignore
├── package.json
├── stores.config.json
├── AGENTS.md
└── src/
    ├── index.js          ← entry point
    ├── db.js             ← Supabase client singleton
    ├── shopify.js        ← Shopify API + data normalisation
    ├── enrichment.js     ← brand upsert + GPT-4o-mini inference
    ├── sync.js           ← orchestration + DB write layer
    ├── logger.js         ← terminal logger
    └── schema.sql        ← full Postgres schema, run once in Supabase
```

Do not add new files without a clear reason. Do not split a module into
multiple files unless the module exceeds ~300 lines and splitting aids clarity.

---

## Environment and secrets

- All secrets live in `.env` and are loaded via `dotenv` at the top of `src/index.js`.
- Required variables: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`.
- Never hardcode secrets, URLs, or API keys anywhere in source files.
- Never log secrets, keys, or full API responses that might contain them.
- `.env` must be in `.gitignore`. `.env.example` must be committed with empty values.

---

## Configuration

- The list of stores to scrape lives exclusively in `stores.config.json`.
- No store-specific logic should be hardcoded in source files.
- Each store entry must have: `name`, `domain`, `city`, `state`, `lat`, `lng`.
- The agent must never modify `stores.config.json` unless explicitly asked to.

---

## Database rules

### Schema

- Never modify the schema without being explicitly asked to.
- All schema changes must be made in `schema.sql` AND reflected in a comment
  explaining what changed and why.
- Never run destructive SQL (DROP, TRUNCATE, DELETE without WHERE) unless
  explicitly instructed by the developer.
- Always use `gen_random_uuid()` for primary keys. Never use serial integers.
- All timestamps must be `timestamptz`, never `timestamp` without timezone.

### Writes

- All product writes use upsert with `ON CONFLICT` — never blind inserts.
- The conflict key for products is `(shopify_product_id, store_id)`.
- The conflict key for variants is `shopify_variant_id`.
- The conflict key for brands is `name`.
- The conflict key for product_embeddings is `product_id`.
- On conflict, always update the relevant fields. Never silently discard updates.

### Queries

- Always scope product queries by `store_id`. Never query products globally
  without a filter unless the intent is explicitly cross-store.
- Never use `SELECT *` in application code. Always name the columns needed.
- Use the Supabase client for all DB access. Never construct raw SQL strings
  in application code except in `schema.sql`.

---

## Shopify API rules

- Only use the public Shopify API. Never use authenticated Admin API endpoints.
- Base URL pattern: `https://{domain}/products.json`
- Always paginate using `since_id`. Never assume all products fit in one response.
- Always set `limit=250` (the maximum allowed).
- Enforce a minimum 600ms delay between paginated requests per store.
- For incremental syncs, use `updated_at_min` query parameter with the ISO
  timestamp of the last known `shopify_updated_at` value from the database.
- Never retry a failed request more than 3 times. On the 3rd failure, log an
  error and skip to the next store — do not crash the whole run.
- Never store or log raw Shopify API responses in full. Only log counts and
  identifiers.

---

## Incremental sync rules

This is the most critical logic in the project. Get it right.

- On each run, query `MAX(shopify_updated_at)` from products for the current store.
- If the result is NULL, this is a full sync: fetch all products.
- If the result is a timestamp, this is an incremental sync: fetch only products
  updated after that timestamp.
- After writing a product, always store its `updated_at` value from the Shopify
  API response as `shopify_updated_at` in the database. This is what the next
  run's incremental sync depends on.
- Never use `last_scraped_at` (our own write timestamp) as the basis for
  incremental sync. Use `shopify_updated_at` (Shopify's timestamp). These are
  different things.

---

## Embedding rules

- Only generate embeddings for new products or products whose `title` or
  `description` has changed since the last scrape.
- Never re-embed a product that only had price, inventory, or image changes.
- The embedding input string must follow this exact format:
  `"{title}. Brand: {vendor}. Category: {category}. Tags: {tags}. {description.slice(0, 300)}"`
- Use model `text-embedding-3-small`. Do not change the model without
  explicit instruction.
- Embeddings are 1536 dimensions. If the vector returned is any other length,
  log an error and skip the upsert — do not write a malformed vector.
- Embedding generation happens after enrichment (category + tags must exist
  before the embedding is generated).

---

## Enrichment rules (GPT-4o-mini)

- Only call GPT-4o-mini for new products or products whose `title` or
  `description` has changed.
- Always use `temperature: 0` and `max_tokens: 150`.
- The system prompt must instruct the model to return raw JSON only — no
  markdown, no explanation, no code fences.
- Always wrap the JSON parse in a try/catch. On failure, return
  `{ category: null, style_tags: [] }` and log a warning. Never throw.
- `style_tags` must be stored as a Postgres `text[]`. Ensure the value passed
  to Supabase is always a JS array, even if empty.
- Never call enrichment for a product where only price or inventory changed.

---

## Brand handling

- Brand name comes exclusively from Shopify's `vendor` field.
- Normalize before upsert: `.trim()` and title-case (first letter of each word
  capitalised).
- If vendor is null, empty string, or "Default Title", set brand to null.
  Do not create a brand record for these values.
- Cache brand IDs in a `Map` keyed by normalized name for the duration of each
  run. Never hit the database twice for the same brand in one run.

---

## Logging rules

- Use `src/logger.js` for all output. Never use `console.log` directly in
  application modules.
- Log levels: `info` (green), `warn` (yellow), `error` (red).
- Every store sync must log: start, pages fetched, products processed, and a
  final summary line showing new / updated / skipped counts.
- Every product write must log at `info` level: the product title and whether
  it was new or updated.
- Errors must always include the store domain and product ID (if available).
- Do not log full API response bodies. Do not log embedding vectors.

---

## Error handling

- Never let an error in one store crash the entire run. Wrap each store's sync
  in a try/catch at the orchestrator level.
- Log the error with full message and move to the next store.
- Never silently swallow errors. Every catch block must log at `error` level.
- On OpenAI API errors (embeddings or enrichment), log and skip that product's
  enrichment/embedding step. Do not fail the product write itself — write the
  product with null category and empty tags if enrichment fails.
- On Supabase write errors, log and skip that product. Do not retry
  automatically.

---

## Performance rules

- Process stores sequentially, never in parallel.
- Process products within a store sequentially, never with `Promise.all`.
- Add a 2-second delay between stores.
- Add a 600ms delay between Shopify API pages within a store.
- The in-memory brand cache must be cleared between store runs (not between
  product runs). A fresh Map per store is acceptable; a global Map persisted
  across the whole session is also fine since brand names are stable.

---

## Code style

- Use `async/await` throughout. Never use `.then()/.catch()` chains in
  application code.
- Keep functions small and single-purpose. If a function exceeds ~40 lines,
  consider splitting it.
- Use descriptive variable names. Avoid abbreviations except for universally
  understood ones (`id`, `url`, `db`).
- No commented-out code in committed files.
- No `TODO` comments unless accompanied by a GitHub issue reference.
- Do not use a linter or formatter unless explicitly asked to set one up.

---

## Testing rules

- Each source module must have a corresponding test script in `src/test-{module}.js`.
- Test scripts must exit with `process.exit(0)` on success and `process.exit(1)`
  on failure.
- Each test script must be runnable standalone with `node src/test-{module}.js`.
- Tests must be registered as npm scripts in `package.json`.
- Tests are integration tests, not unit tests — they run against real APIs and
  the real database. There is no mocking.
- The incremental sync test is mandatory: run the scraper twice on the same store
  and assert that the second run shows 0 new products.

---

## Things the agent must never do

- Never use `process.exit()` anywhere except test scripts and the very end of
  `src/index.js`.
- Never mutate `stores.config.json` programmatically.
- Never run `DROP TABLE`, `TRUNCATE`, or schema-altering SQL without explicit
  developer instruction.
- Never use `SELECT *` in application code.
- Never use `console.log` outside of `logger.js`.
- Never install a dependency without a clear reason. Keep the dependency list
  minimal.
- Never generate an embedding for a product that already has an up-to-date
  embedding (title and description unchanged since last scrape).
- Never commit `.env` or any file containing real credentials.
- Never bypass the incremental sync logic to force a full re-scrape unless
  explicitly instructed.

---

## Dependency guidelines

Keep dependencies minimal. The approved list is:

| Package | Purpose |
|---|---|
| `@supabase/supabase-js` | Supabase client |
| `openai` | OpenAI SDK (embeddings + chat completions) |
| `dotenv` | Environment variable loading |
| `picocolors` or `chalk` | Terminal colour output in logger |

Do not add any other dependency without explicit approval. In particular:
- No ORM (Drizzle, Prisma, etc.)
- No HTTP client libraries (use the built-in `fetch`, available in Node 18+)
- No task queue libraries
- No test frameworks (Jest, Vitest, etc.)

---

## Before submitting any code

Run through this checklist mentally before considering a task complete:

1. Does every file use ESM imports?
2. Are all secrets read from `process.env`, never hardcoded?
3. Does every DB write use upsert with the correct conflict key?
4. Does the incremental sync use `shopify_updated_at` (not `last_scraped_at`)?
5. Are embeddings only generated for new or meaningfully changed products?
6. Is GPT-4o-mini only called for new or meaningfully changed products?
7. Does every catch block log at error level?
8. Does the logger use `logger.info/warn/error`, not `console.log`?
9. Is there a test script for the module, registered in `package.json`?
10. Does the test script exit 0 on success and 1 on failure?
