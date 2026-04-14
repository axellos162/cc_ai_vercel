# Shopify → Supabase Scraper — Architecture

## Overview

```
┌─────────────────────┐     ┌─────────────────────┐
│  stores.config.json │     │     .env secrets     │
│  (15 store domains) │     │  Supabase, OpenAI    │
└────────┬────────────┘     └──────────┬───────────┘
         │                             │
         └──────────────┬──────────────┘
                        ▼
           ┌────────────────────────┐
           │   Scraper orchestrator │
           │  Loops stores, manages │
           │        state           │
           └────────────┬───────────┘
                        │
                        ▼
           ┌────────────────────────┐
           │   Shopify public API   │
           │  /products.json        │
           │  updated_at diff       │
           └────────┬───────────────┘
                    │
          ┌─────────┴──────────┐
          │                    │
          ▼                    ▼
┌──────────────────┐  ┌──────────────────────┐
│ Embedding        │  │ Tag + category        │
│ pipeline         │  │ inference             │
│ OpenAI           │  │ GPT-4o-mini           │
│ text-embedding   │  │                       │
│ -3-small         │  │                       │
└────────┬─────────┘  └──────────┬────────────┘
         │                       │
         └──────────┬────────────┘
                    │
                    ▼
     ┌──────────────────────────┐
     │  Supabase                │
     │  Postgres + pgvector     │
     └──────────────────────────┘
```

---

## Components

### Inputs

**`stores.config.json`**
A JSON array of store objects, each containing the Shopify domain, display name, city, state, and lat/lng coordinates. The scraper reads this file at startup to determine which stores to sync.

**`.env` secrets**
Holds `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `OPENAI_API_KEY`. Never committed to version control.

---

### Scraper orchestrator (`src/index.js` + `src/sync.js`)

The entry point that loops through every store in the config sequentially (not in parallel, to stay within Shopify's rate limit). For each store it:

- Reads or creates the store record in the database
- Determines whether to run a full sync or an incremental sync
- Coordinates the Shopify fetch, enrichment, and database write steps
- Logs a summary on completion

Supports a `--store` flag to sync a single store by domain.

---

### Shopify public API (`src/shopify.js`)

Fetches product data from each store's public `/products.json` endpoint.

**Full sync** — used on first run when no products exist yet for a store. Paginates through the entire catalog using `since_id`.

**Incremental sync** — used on subsequent runs. Queries only products where `updated_at` is newer than the `MAX(shopify_updated_at)` stored in the database. This avoids re-processing and re-embedding unchanged products.

Enforces a 600ms delay between paginated requests to stay within Shopify's 2 req/sec public API limit.

---

### Embedding pipeline (`src/sync.js` + OpenAI API)

Generates a 1536-dimension vector for each new or meaningfully changed product using OpenAI's `text-embedding-3-small` model.

The embedding input is a concatenation of: title, brand, category, style tags, and the first 300 characters of the description.

Embeddings are only generated when a product is new or when its title or description has changed. Price and inventory updates do not trigger re-embedding.

Vectors are stored in the `product_embeddings` table with a pgvector `ivfflat` index for fast cosine similarity search.

**For brand similarity embeddings and detailed embedding documentation, see [EMBEDDINGS.md](./EMBEDDINGS.md).**

---

### Tag + category inference (`src/enrichment.js` + GPT-4o-mini)

For each new or changed product, calls GPT-4o-mini with a structured prompt to infer:

- `category` — a single string (e.g. "Denim", "Outerwear", "Footwear")
- `style_tags` — an array of up to 5 descriptive tags (e.g. ["relaxed fit", "mid-rise", "organic cotton"])

The model is instructed to return raw JSON only, with no markdown or explanation. The response is parsed and stored on the product record. If parsing fails, the product is written with null category and empty tags rather than failing the whole run.

---

### Supabase — Postgres + pgvector

The database layer. Schema consists of five tables:

| Table | Purpose |
|---|---|
| `stores` | One row per Shopify store with geo data |
| `brands` | Deduplicated brand names sourced from Shopify's `vendor` field |
| `products` | Core product data with `UNIQUE(shopify_product_id, store_id)` |
| `variants` | Size, color, and inventory per variant |
| `product_embeddings` | 1536-dim vectors linked to products |

---

## Incremental sync logic

```
Run scraper
    │
    ▼
Get MAX(shopify_updated_at) for store
    │
    ├─── NULL (first run) ──► fetchAllProducts()
    │
    └─── Has timestamp ──────► fetchUpdatedProducts(sinceDate)
                                        │
                                        ▼
                              For each product:
                                  Has title/description changed?
                                  ├── YES ──► re-enrich + re-embed
                                  └── NO  ──► update price/inventory only
```

---

## Data flow summary

```
Shopify API
    │
    │  raw product JSON
    ▼
extractProductData()
    │
    │  normalized product object
    ▼
upsertBrand()          ← vendor field → brands table
    │
upsertProduct()        ← products + variants tables
    │
    ├── if new or changed
    │       │
    │       ├── inferProductMeta()   → category, style_tags (GPT-4o-mini)
    │       └── generateEmbedding() → 1536-dim vector (text-embedding-3-small)
    │               │
    │               └── upsertEmbedding() → product_embeddings table
    │
    └── if unchanged (price/inventory only)
            └── skip enrichment + embedding
```

---

## Key design decisions

**Sequential store processing** — stores are synced one at a time to avoid saturating Shopify's public rate limit. With 15 stores this adds minimal wall-clock time compared to the risk of being throttled.

**`updated_at` diffing for incremental sync** — Shopify exposes an `updated_at` timestamp on every product. Storing and comparing this value is simpler and more reliable than hashing product content, and requires no additional storage.

**Embedding only on meaningful change** — embeddings are expensive relative to a simple SQL update. Only title and description changes trigger re-embedding; price and inventory changes do not, since those fields are not part of the embedding input text.

**Vendor field as brand source** — Shopify's public API does not expose a structured brand field. The `vendor` field is the closest equivalent and is used as-is after normalization (trim + title-case). Brands are upserted with `ON CONFLICT (name)` and cached in memory during each run to avoid redundant DB calls.

**GPT-4o-mini for tagging** — chosen for cost and speed. The prompt instructs the model to return raw JSON only, avoiding the need to strip markdown fences. Invalid responses fall back gracefully rather than failing the product write.

---

## Additional Documentation

- **[EMBEDDINGS.md](./EMBEDDINGS.md)** - Complete guide to product embeddings, brand metadata enrichment, and brand similarity embeddings
- **[EMBEDDING-QUICKREF.md](./EMBEDDING-QUICKREF.md)** - Quick reference for common embedding commands
- **[QUICKSTART.md](./QUICKSTART.md)** - Quick start guide for running the scraper
- **[TESTING.md](./TESTING.md)** - Integration testing checklist
