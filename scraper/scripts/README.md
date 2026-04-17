# Scraper Development Scripts & Utilities

This folder contains development tools, test scripts, and utility scripts for the Shopify scraper. These files are not part of the core scraper application.

## Core Utility Scripts

### `enrich-brand-metadata.js`
Enriches brand records with metadata (categories, price segments, style descriptions).

**Usage:**
```bash
node scripts/enrich-brand-metadata.js
```

**What it does:**
- Calculates top 5 categories per brand by product count
- Determines price segment (Budget, Mid, Premium, Luxury)
- Generates AI-powered style descriptions using GPT-4o-mini
- Updates `brands` table with enriched metadata

**When to run:**
- After scraping new products
- When new brands are added
- Periodically to refresh brand descriptions

### `generate-brand-embeddings.js`
Generates 1536-dimensional embeddings for brand similarity search.

**Usage:**
```bash
# Simple mode (averages product embeddings)
node scripts/generate-brand-embeddings.js

# Hybrid mode (products 70% + metadata 30%)
node scripts/generate-brand-embeddings.js hybrid
```

**What it does:**
- Creates vector embeddings for each brand
- **Simple mode**: Averages all product embeddings for the brand
- **Hybrid mode**: Combines product embeddings (70%) with metadata embeddings (30%)
- Stores in `brand_embeddings` table with pgvector index

**When to run:**
- After running `enrich-brand-metadata.js` (for hybrid mode)
- After scraping significant new products
- When product catalogs change

**See:** [../EMBEDDINGS.md](../EMBEDDINGS.md) for complete documentation

## Test Scripts

### `test-shopify.js`
Tests Shopify API connectivity and data fetching.

**Usage:**
```bash
npm run test:shopify
```

### `test-enrichment.js`
Tests product enrichment (category and tag inference) with GPT-4o-mini.

**Usage:**
```bash
npm run test:enrichment
```

### `test-sync.js`
Tests the complete sync flow (fetch, enrich, embed, save).

**Usage:**
```bash
npm run test:sync
```

## Database Utilities

### `run-sql-updates.js`
Executes SQL updates or migrations against the database.

**Usage:**
```bash
node scripts/run-sql-updates.js
```

### `update-existing-products.js`
Updates existing product records with new data or corrections.

**Usage:**
```bash
node scripts/update-existing-products.js
```

### `verify-prices.js`
Verifies price data integrity (checks for discounted_price vs price).

**Usage:**
```bash
node scripts/verify-prices.js
```

### `verify-sql.js`
Verifies SQL schema and database structure.

**Usage:**
```bash
node scripts/verify-sql.js
```

## Convenience Scripts

### `run-scraper.sh`
Shell wrapper for running the scraper with optional store filtering.

**Usage:**
```bash
# All stores
./scripts/run-scraper.sh

# Single store
./scripts/run-scraper.sh elkel.nyc
```

**Note:** This is a convenience wrapper. You can also use `npm start` directly.

## Typical Workflow

### Initial Setup
```bash
# 1. Run scraper to get products and generate product embeddings
npm start

# 2. Enrich brand metadata
node scripts/enrich-brand-metadata.js

# 3. Generate brand embeddings (hybrid mode recommended)
node scripts/generate-brand-embeddings.js hybrid
```

### Regular Updates
```bash
# Run scraper daily or weekly to get new products
npm start

# Regenerate brand embeddings after significant changes
node scripts/generate-brand-embeddings.js hybrid
```

### Testing
```bash
# Test individual components
npm run test:shopify
npm run test:enrichment
npm run test:sync
```

## Environment Requirements

All scripts require:
- `.env` file with `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`
- Database schema created (see `src/schema.sql`)
- Node.js 18+

## Notes

- All scripts should be run from the `scraper` root directory
- Scripts are for development and manual operations
- Not included in production builds (not imported by `src/index.js`)
- Safe to modify for debugging purposes

## Documentation

For more details, see:
- [../EMBEDDINGS.md](../EMBEDDINGS.md) - Complete embedding guide
- [../EMBEDDING-QUICKREF.md](../EMBEDDING-QUICKREF.md) - Quick reference
- [../QUICKSTART.md](../QUICKSTART.md) - Scraper quick start
- [../scraper-architecture.md](../scraper-architecture.md) - Architecture details
