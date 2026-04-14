# AGENTS.md

This file defines the rules, constraints, and context the agent must follow
at all times while developing the fashion-query-api project. Read this file
in full before writing any code. Re-read relevant sections before each task.

---

## Project context

This is a Next.js application that exposes a single versioned API endpoint:
`POST /api/v1/query`. It accepts natural language fashion search queries,
classifies their intent, runs the appropriate database search, and returns
structured JSON results.

It is designed as a proper multi-client API — not a private backend. The
response envelope is stable and versioned. Do not change its shape without
explicit instruction, as downstream clients depend on it.

The data lives in a Supabase (Postgres + pgvector) database populated by a
separate scraper project. This project is read-only with respect to that
database. It never writes, updates, or deletes data.

---

## Language and module system

- Next.js App Router, JavaScript (not TypeScript).
- ESM throughout. Use `import`/`export`. Never use `require()`.
- `"type": "module"` is set in `package.json`.
- All API routes must declare `export const runtime = "nodejs"` — never Edge.
- Do not add TypeScript unless explicitly instructed.

---

## Project structure

Do not deviate from this structure without explicit instruction:

```
fashion-query-api/
├── .env.local              ← secrets, gitignored
├── .env.local.example      ← committed, empty values
├── .gitignore
├── AGENTS.md
├── package.json
├── next.config.js
└── src/
    ├── app/
    │   └── api/
    │       └── v1/
    │           └── query/
    │               └── route.js     ← the only API endpoint
    ├── lib/
    │   ├── db.js            ← Supabase client singleton
    │   ├── openai.js        ← OpenAI client + model constants
    │   └── constants.js     ← INTENTS, SORT_OPTIONS, defaults
    └── services/
        ├── classifier.js    ← intent classification
        ├── search.js        ← pgvector + SQL search functions
        └── response.js      ← response shaping + envelope builder
```

Do not add new files without a clear reason. Do not create additional API
routes — there is exactly one endpoint in Phase 1.

---

## Environment and secrets

- All secrets live in `.env.local`. Never in any other file.
- Required variables: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`.
- Never hardcode secrets, API keys, or base URLs anywhere in source files.
- Never log secrets or full API response bodies.
- `.env.local` must be in `.gitignore`. `.env.local.example` must be committed.

---

## Model references — critical rule

**Never hardcode model names anywhere in the codebase.**

The only place model names are defined is `src/lib/openai.js`:
```js
export const CHAT_MODEL      = "gpt-4o-mini";
export const EMBEDDING_MODEL = "text-embedding-3-small";
```

Every file that makes an OpenAI API call must import these constants.
This makes swapping models a one-line change. A hardcoded model string
anywhere else is a bug.

---

## Constants — critical rule

All shared constants live in `src/lib/constants.js`. This includes:

- `INTENTS` — the full set of valid intent strings
- `SORT_OPTIONS` — the full set of valid sort strings
- `DEFAULT_SORT` — the fallback sort when none is specified
- `EMBEDDING_DIM` — 1536, the expected embedding vector length
- `PRICE_AROUND_BUFFER` — 50, the ± buffer for "around $X" price queries

Never duplicate these values in other files. Always import from constants.js.

---

## API design rules

### The endpoint

There is exactly one endpoint: `POST /api/v1/query`

Do not add new endpoints in Phase 1. Do not add query parameters — all input
comes from the JSON request body.

### Request shape

```json
{
  "query": "string (required)",
  "sort":  "string (optional, one of SORT_OPTIONS)"
}
```

### Response envelope

Every response — success or error — must follow the defined envelope exactly.
Never return a bare array, bare string, or ad-hoc object. The envelope is:

```json
{
  "ok": true,
  "intent": "...",
  "query": "...",
  "sort": "...",
  "filters": { ... },
  "results": { "type": "...", "data": { ... } },
  "meta": { "total": 0, "generated_at": "..." }
}
```

On error:
```json
{ "ok": false, "error": "...", "query": "..." }
```

### HTTP status codes

- 200 — successful response
- 400 — missing query, empty query, invalid sort option
- 500 — unhandled internal error

### CORS

Every response must include CORS headers:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

The OPTIONS preflight handler must return 204. This is non-negotiable — the
frontend will be on a different origin.

### Versioning

The route is versioned at `/api/v1/`. Do not change this path. When breaking
changes are needed in future, a new `/api/v2/` route will be created rather
than modifying v1.

---

## Intent classification rules

- The classifier calls GPT-4o-mini via `CHAT_MODEL` with `temperature: 0`.
- It always returns a valid intent from the `INTENTS` constant.
- If the LLM response cannot be parsed as JSON, return the safe fallback
  object with `intent: INTENTS.AMBIGUOUS`. Never throw from the classifier.
- The client's explicit `sort` in the request body always overrides the
  classifier's inferred sort. Apply this override in the route handler,
  not inside the classifier.
- Valid intents: `product_search`, `store_finder`, `availability_check`,
  `price_comparison`, `ambiguous`.

---

## Search layer rules

### General

- The search layer is read-only. It never writes to the database.
- Import `supabase` only from `src/lib/db.js`. Never instantiate a new client.
- Never use `SELECT *`. Always specify the columns needed.

### Effective price

The effective price is always:
```sql
COALESCE(NULLIF(discounted_price, 0), price)
```

This logic must be applied consistently in all SQL filtering and sorting.
Never filter or sort on raw `price` alone when `discounted_price` may exist.
The `match_products` RPC function enforces this — do not bypass it.

### The match_products RPC function

Product search goes through the `match_products` Postgres function. This
function must exist in Supabase before the search layer can be tested. It is
defined in the project's SQL setup documentation. Do not replicate its logic
in application code — call it via `supabase.rpc("match_products", { ... })`.

### Price filtering

- `price_max` → effective price <= price_max
- `price_min` → effective price >= price_min
- `price_around` → resolve to price_min = price_around - PRICE_AROUND_BUFFER,
  price_max = price_around + PRICE_AROUND_BUFFER before passing to RPC.
  Never pass `price_around` directly to the database.

### Inventory

- Store finder and availability check must only return stores where at least
  one variant has `inventory_count > 0`.
- Product search does not filter by inventory at this stage.

### Parallel execution

- `ambiguous` intent runs `searchProducts` and `findStores` in parallel.
  Always use `Promise.all`. Never await them sequentially.
- `price_comparison` runs one embedding + one RPC call per brand in parallel.
  Always use `Promise.all` for the per-brand calls.

---

## Response shaping rules

- All response shaping happens in `src/services/response.js` only.
- Route handler must not construct data shapes itself — it calls shapers.
- The `effective_price` field must always be present in product results.
- `sample_images` in store results must be a plain string array, never an
  array of objects.
- `generated_at` must always be a valid ISO 8601 string from `new Date().toISOString()`.

---

## Error handling rules

- The route handler must have a top-level try/catch that returns HTTP 500 on
  any unhandled error.
- Log all unhandled errors server-side with `console.error` before responding.
- The classifier must never throw — it returns a safe fallback on failure.
- If `searchProducts` or `findStores` throws, let the error propagate to the
  route handler's top-level catch.
- Never return stack traces or internal error details to the client. The error
  message in the response envelope is always a safe, generic string.

---

## Database rules

- This project is read-only. Never write, update, or delete data.
- Use the service role key for Phase 1 (no RLS enforcement needed for reads).
- Never instantiate a Supabase client outside of `src/lib/db.js`.
- Never construct raw SQL strings in application code. Use the Supabase client
  methods or RPC calls only.

---

## Code style

- Use `async/await` throughout. No `.then()/.catch()` chains.
- Keep functions small and single-purpose.
- No commented-out code in committed files.
- No `TODO` comments without a corresponding issue reference.
- Use `console.error` for server-side error logging. Do not use a custom
  logger in this project (unlike the scraper, this is a web server where
  Next.js handles log formatting).
- No `console.log` in production code paths. Only in test scripts.

---

## Testing rules

- Each service module has a corresponding test file: `src/services/{module}.test.js`
- Test scripts exit `process.exit(0)` on success, `process.exit(1)` on failure.
- Tests are integration tests — they run against real APIs and the real database.
- Tests must be registered as npm scripts in `package.json`.
- The `match_products` SQL function must exist in Supabase before running
  `test:search`. Confirm this before running the test.

---

## Dependency rules

Approved dependencies only:

| Package | Purpose |
|---|---|
| `next` | Framework |
| `react`, `react-dom` | Required by Next.js |
| `@supabase/supabase-js` | Database client |
| `openai` | OpenAI SDK |

Do not add any other dependency without explicit approval. In particular:
- No validation libraries (Zod, Yup, Joi)
- No HTTP client libraries (use native fetch)
- No ORM
- No rate limiting libraries (not in scope for Phase 1)
- No auth libraries (not in scope for Phase 1)

---

## Things the agent must never do

- Never write, update, or delete data in Supabase.
- Never hardcode a model name — always import from `src/lib/openai.js`.
- Never duplicate constants — always import from `src/lib/constants.js`.
- Never return a response that does not follow the defined envelope shape.
- Never expose stack traces or internal error messages to API clients.
- Never await parallel searches sequentially — use `Promise.all`.
- Never filter or sort on raw `price` alone — always use effective price logic.
- Never add a new API endpoint without explicit instruction.
- Never change the `/api/v1/` path prefix.
- Never commit `.env.local` or any file containing real credentials.
- Never use Edge runtime — always Node runtime.

---

## Before submitting any code

Run through this checklist before considering any task complete:

1. Are all model names imported from `src/lib/openai.js`, never hardcoded?
2. Are all intent and sort constants imported from `src/lib/constants.js`?
3. Does the route handler have a top-level try/catch returning HTTP 500?
4. Does every response follow the defined envelope (ok, intent, results, meta)?
5. Are CORS headers present on every response including errors?
6. Does `ambiguous` intent use `Promise.all` for parallel search?
7. Does `price_around` get resolved to min/max before hitting the database?
8. Does every sort and filter operation use effective price, not raw price?
9. Is there a test script for each service module registered in package.json?
10. Is `.env.local` gitignored and `.env.local.example` committed?