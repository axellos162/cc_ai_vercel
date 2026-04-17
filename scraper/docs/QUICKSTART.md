# Shopify → Supabase Scraper

Quick start guide for running the scraper.

## Prerequisites

1. Node.js 18+ installed
2. `.env` file with credentials (see `.env.example`)
3. Database schema created in Supabase (run `src/schema.sql`)

## Quick Start

```bash
# Install dependencies (first time only)
npm install

# Scrape all stores
./run-scraper.sh

# Scrape a single store
./run-scraper.sh elkel.nyc
```

## Manual Usage

```bash
# All stores
npm start

# Single store
node src/index.js --store "elkel.nyc"
```

## Configuration

Edit `stores.config.json` to add/remove stores:

```json
[
  {
    "name": "Store Name",
    "domain": "store.com",
    "city": "New York",
    "state": "NY",
    "lat": 40.7128,
    "lng": -74.0060
  }
]
```

## What It Does

1. **Fetches** products from Shopify public API (250 per page)
2. **Enriches** with GPT-4o-mini (category + style tags)
3. **Generates** product embeddings with OpenAI (text-embedding-3-small, 1536-dim)
4. **Saves** to Supabase (products, variants, brands, product embeddings)

**Note:** This generates **product embeddings** only. For brand similarity features, see [EMBEDDINGS.md](./EMBEDDINGS.md) to learn how to generate brand embeddings.

## Incremental Sync

- First run: Full sync (all products)
- Subsequent runs: Only products updated since last sync
- Uses `shopify_updated_at` timestamp

## Rate Limiting

- 1 second delay between API pages
- Automatic retry with exponential backoff (up to 5 attempts)
- Handles 503/429 errors gracefully

## Monitoring

Watch the terminal output:
- Green logs = success
- Yellow warnings = retries happening
- Red errors = product skipped (run continues)

## Troubleshooting

**"SUPABASE_URL must be set"**
→ Create `.env` file

**"Store not found"**
→ Check domain spelling in `stores.config.json`

**"503 Service Unavailable"**
→ Store is rate limiting, scraper will retry automatically

**Very slow**
→ Expected! Large catalogs take time (e.g., 100K products ≈ 2+ hours)

## Next Steps

After scraping products:

1. **Enable brand similarity** - Generate brand embeddings
   ```bash
   # Optional: Enrich brand metadata first
   node src/enrich-brand-metadata.js

   # Generate brand embeddings (simple or hybrid mode)
   node src/generate-brand-embeddings.js
   node src/generate-brand-embeddings.js hybrid
   ```

2. **Read the full guide** - See [EMBEDDINGS.md](./EMBEDDINGS.md) for:
   - How product embeddings work
   - Brand metadata enrichment details
   - Brand embedding generation (simple vs hybrid)
   - Testing and verification
   - Troubleshooting

## Documentation

- **[EMBEDDINGS.md](./EMBEDDINGS.md)** - Complete embedding and brand similarity guide
- **[scraper-architecture.md](./scraper-architecture.md)** - Detailed architecture
- **[TESTING.md](./TESTING.md)** - Integration testing checklist
