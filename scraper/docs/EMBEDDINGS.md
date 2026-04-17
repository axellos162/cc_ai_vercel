# Embedding & Brand Similarity Guide

Complete guide for generating product embeddings, enriching brand metadata, and creating brand similarity embeddings.

---

## Table of Contents

1. [Overview](#overview)
2. [Product Embeddings (Automatic)](#product-embeddings-automatic)
3. [Brand Metadata Enrichment](#brand-metadata-enrichment)
4. [Brand Embeddings Generation](#brand-embeddings-generation)
5. [Complete Flow Diagram](#complete-flow-diagram)
6. [Verification & Testing](#verification--testing)
7. [Troubleshooting](#troubleshooting)

---

## Overview

The CONCEPT COMMERCE system uses a three-tier embedding approach:

1. **Product Embeddings** - Generated automatically during scraping
2. **Brand Metadata** - Enriches brands with categories, price segments, and style descriptions
3. **Brand Embeddings** - Creates similarity vectors for brand-to-brand matching

### Why This Matters

- Product embeddings enable "find similar products" searches
- Brand embeddings power "brands like X" queries
- Metadata enrichment provides context for better brand matching

---

## Product Embeddings (Automatic)

### When They're Generated

Product embeddings are **automatically created** during the scraping process when:

- A product is **new** (first time seen)
- The product's **title** or **description** has changed

Price or inventory changes do NOT trigger re-embedding.

### How They Work

**Input Text Format:**
```
"{title}. Brand: {vendor}. Category: {category}. Tags: {tags}. {description.slice(0, 300)}"
```

**Model:** OpenAI `text-embedding-3-small`
**Dimensions:** 1536
**Storage:** `product_embeddings` table with pgvector IVFFlat index

### Running Product Embeddings

Simply run the scraper:

```bash
# All stores
npm start

# Single store
node src/index.js --store "elkel.nyc"
```

Product embeddings are generated automatically during this process.

### Verify Product Embeddings

```bash
# Check that embeddings exist and are 1536 dimensions
node -e "
  import('./src/db.js').then(async ({supabase}) => {
    const {data} = await supabase
      .from('product_embeddings')
      .select('embedding')
      .limit(1);
    const emb = data?.[0]?.embedding;
    console.log('Embedding length:', emb?.length);
    console.log('Is 1536:', emb?.length === 1536 ? 'PASS' : 'FAIL');
    process.exit(0);
  })
"
```

**Expected Output:**
```
Embedding length: 1536
Is 1536: PASS
```

---

## Brand Metadata Enrichment

### What It Does

Enriches each brand with:

1. **Top Categories** - Top 5 categories by product count (e.g., `["Denim", "Outerwear", "T-Shirts"]`)
2. **Price Segment** - Budget, Mid, Premium, or Luxury based on average price
3. **Style Description** - 1-2 sentence LLM-generated description of brand aesthetic

### Price Segment Thresholds

- **Budget**: Average price < $100
- **Mid**: $100 ≤ price < $300
- **Premium**: $300 ≤ price < $800
- **Luxury**: price ≥ $800

### Running Brand Metadata Enrichment

```bash
# From the scraper directory
node scripts/enrich-brand-metadata.js
```

**What Happens:**
1. Fetches all brands from database
2. For each brand:
   - Calculates category distribution from products
   - Determines price segment from average product price
   - Generates style description using GPT-4o-mini (samples up to 10 products)
3. Updates `brands` table with:
   - `top_categories` (text array)
   - `price_segment` (text)
   - `style_description` (text)
   - `metadata_updated_at` (timestamp)

### Example Output

```
Starting brand metadata enrichment...
Found 145 brands to enrich
Processing Rick Owens...
  Categories: Outerwear (45), Denim (32), T-Shirts (28), Footwear (15), Accessories (8)
  Price segment: Luxury
  Style description: Dark, avant-garde aesthetic with draped silhouettes...
✓ Rick Owens
Processing Acne Studios...
...
Brand metadata enrichment complete!
Enriched: 145 brands
```

### When to Run

- **After scraping new products** - Especially when new brands are added
- **Periodically** - If product catalogs change significantly
- **Before generating brand embeddings** - For hybrid mode (optional)

---

## Brand Embeddings Generation

### What It Does

Creates 1536-dimensional embeddings for each brand to enable similarity search.

### Two Modes

#### 1. Simple Mode (Default)

Averages all product embeddings for each brand.

**Formula:** For each dimension: `sum(product_embeddings) / product_count`

**Pros:**
- Fast and straightforward
- Pure product-based similarity
- No dependencies

**When to Use:**
- You want brand similarity based purely on products
- You haven't run metadata enrichment yet
- You prefer simplicity

#### 2. Hybrid Mode

Combines product embeddings (70%) with metadata embeddings (30%).

**Formula:**
```
metadata_text = "{brand_name}. Categories: {top_categories}. Price: {price_segment}. {style_description}"
metadata_embedding = embed(metadata_text)
brand_embedding = normalize((0.7 * avg_product_embedding) + (0.3 * metadata_embedding))
```

**Pros:**
- Richer brand representation
- Captures brand identity beyond just products
- Better semantic matching

**When to Use:**
- After running brand metadata enrichment
- You want more nuanced brand similarity
- Brand aesthetic matters as much as products

### Running Brand Embeddings

```bash
# Simple mode (default) - averages product embeddings only
node scripts/generate-brand-embeddings.js

# Hybrid mode - combines products (70%) + metadata (30%)
node scripts/generate-brand-embeddings.js hybrid
```

**What Happens:**
1. Fetches all brands with products
2. For each brand:
   - **Simple:** Averages all product embeddings
   - **Hybrid:** Generates metadata embedding, combines with product average
3. Normalizes to unit vector
4. Stores in `brand_embeddings` table with:
   - `brand_id` (UUID, UNIQUE)
   - `embedding` (vector(1536))
   - `product_count` (int)
   - `updated_at` (timestamp)

### Example Output

```
Starting brand embedding generation (mode: simple)...
Processing 145 brands...
✓ Rick Owens (284 products)
✓ Acne Studios (156 products)
✓ Lemaire (89 products)
...
Brand embeddings complete!
Generated: 145 brand embeddings
Skipped: 0 brands (no products)
```

### When to Run

- **After initial scraping** - Once you have product embeddings
- **After brand metadata enrichment** - If using hybrid mode
- **Periodically** - When product catalogs change significantly

---

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     STEP 1: SCRAPE PRODUCTS                      │
│                                                                   │
│  Run: npm start  OR  node src/index.js --store "store.com"       │
│                                                                   │
│  ┌──────────────┐                                                │
│  │ Shopify API  │                                                │
│  └──────┬───────┘                                                │
│         │                                                         │
│         ▼                                                         │
│  ┌─────────────────┐                                             │
│  │ Extract Product │                                             │
│  │     Data        │                                             │
│  └────────┬────────┘                                             │
│           │                                                       │
│           ▼                                                       │
│  ┌──────────────────────┐                                        │
│  │ If NEW or CHANGED:   │                                        │
│  │ 1. Enrich (GPT-4o)   │ → category, style_tags                 │
│  │ 2. Embed (OpenAI)    │ → 1536-dim vector                      │
│  └──────────┬───────────┘                                        │
│             │                                                     │
│             ▼                                                     │
│  ┌──────────────────────┐                                        │
│  │ product_embeddings   │                                        │
│  │ table (pgvector)     │                                        │
│  └──────────────────────┘                                        │
└─────────────────────────────────────────────────────────────────┘

                            ↓

┌─────────────────────────────────────────────────────────────────┐
│            STEP 2: ENRICH BRAND METADATA (Optional)              │
│                                                                   │
│  Run: node scripts/enrich-brand-metadata.js                          │
│                                                                   │
│  For each brand:                                                 │
│  1. Calculate category distribution                              │
│  2. Determine price segment                                      │
│  3. Generate style description (GPT-4o-mini)                     │
│                                                                   │
│  ┌──────────────────────┐                                        │
│  │ brands table:        │                                        │
│  │ - top_categories     │                                        │
│  │ - price_segment      │                                        │
│  │ - style_description  │                                        │
│  └──────────────────────┘                                        │
└─────────────────────────────────────────────────────────────────┘

                            ↓

┌─────────────────────────────────────────────────────────────────┐
│              STEP 3: GENERATE BRAND EMBEDDINGS                   │
│                                                                   │
│  Run: node scripts/generate-brand-embeddings.js [mode]               │
│                                                                   │
│  ┌──────────────┐         ┌──────────────┐                      │
│  │ Simple Mode  │         │ Hybrid Mode  │                      │
│  └──────┬───────┘         └──────┬───────┘                      │
│         │                        │                               │
│         ▼                        ▼                               │
│  Average product          0.7 * avg_product +                   │
│  embeddings               0.3 * metadata_embedding               │
│         │                        │                               │
│         └────────┬───────────────┘                               │
│                  │                                               │
│                  ▼                                               │
│  ┌──────────────────────────────┐                               │
│  │ brand_embeddings table       │                               │
│  │ (pgvector IVFFlat index)     │                               │
│  └──────────────────────────────┘                               │
└─────────────────────────────────────────────────────────────────┘

                            ↓

┌─────────────────────────────────────────────────────────────────┐
│                      API QUERY: SIMILARITY                       │
│                                                                   │
│  User: "brands like Rick Owens"                                  │
│                                                                   │
│  ┌──────────────────────┐                                        │
│  │ Classifier detects:  │                                        │
│  │ brand_similarity     │                                        │
│  └──────────┬───────────┘                                        │
│             │                                                     │
│             ▼                                                     │
│  ┌──────────────────────────────┐                                │
│  │ match_similar_brands() RPC   │                                │
│  │ - Get Rick Owens embedding   │                                │
│  │ - Cosine similarity search   │                                │
│  │ - Return top 10 matches      │                                │
│  └──────────┬───────────────────┘                                │
│             │                                                     │
│             ▼                                                     │
│  Response: Ann Demeulemeester (87%), Lemaire (82%), ...          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Verification & Testing

### Test Brand Similarity Search

After completing all steps, test the brand similarity:

```bash
# Run from fashion_query_api directory
node test-brand-similarity.js
```

This will test queries like:
- "brands like Rick Owens"
- "similar brands to Acne Studios"
- "brands like Lemaire in New York"

### Manual Database Check

Run in Supabase SQL Editor:

```sql
-- Check brand embedding counts
SELECT
  (SELECT count(*) FROM brands) AS total_brands,
  (SELECT count(*) FROM brand_embeddings) AS brands_with_embeddings,
  (SELECT count(*) FROM brands WHERE metadata_updated_at IS NOT NULL) AS brands_with_metadata;

-- View a sample brand with metadata
SELECT
  b.name,
  b.top_categories,
  b.price_segment,
  b.style_description,
  be.product_count,
  be.updated_at
FROM brands b
LEFT JOIN brand_embeddings be ON be.brand_id = b.id
WHERE b.name = 'Rick Owens';

-- Test similarity search
SELECT
  b2.name,
  1 - (be1.embedding <=> be2.embedding) AS similarity
FROM brands b1
JOIN brand_embeddings be1 ON be1.brand_id = b1.id
CROSS JOIN brand_embeddings be2
JOIN brands b2 ON b2.id = be2.brand_id
WHERE b1.name = 'Rick Owens'
  AND b2.name != 'Rick Owens'
ORDER BY similarity DESC
LIMIT 10;
```

---

## Troubleshooting

### "No product embeddings found"

**Cause:** Products haven't been scraped yet.

**Solution:**
```bash
npm start
```

### "Brand has no products"

**Cause:** Brand exists but has no products with embeddings.

**Solution:** This is normal. The script will skip brands with no products. Check if the brand's products were scraped:

```sql
SELECT count(*) FROM products WHERE brand_id = (SELECT id FROM brands WHERE name = 'BrandName');
```

### "Failed to generate style description"

**Cause:** OpenAI API error or rate limit.

**Solution:** The script will continue and skip the description. You can:
- Re-run `enrich-brand-metadata.js` to fill in missing descriptions
- Check your OpenAI API key and quota

### "Brand embeddings table doesn't exist"

**Cause:** Database schema not created.

**Solution:** Run the schema SQL in Supabase:
```bash
# In Supabase SQL Editor, run:
# scraper/src/schema.sql
```

### Simple vs Hybrid - Which to Use?

**Use Simple when:**
- You want product-based similarity only
- You haven't enriched brand metadata
- You prefer faster execution

**Use Hybrid when:**
- You've run `enrich-brand-metadata.js`
- You want richer brand matching
- Brand aesthetic matters (e.g., "Luxury minimalist brands")

### Embeddings Seem Stale

**Cause:** Product catalog has changed significantly.

**Solution:** Regenerate brand embeddings:
```bash
# Re-run to update with latest products
node scripts/generate-brand-embeddings.js
```

---

## Quick Reference Commands

```bash
# 1. Scrape products (generates product embeddings automatically)
npm start

# 2. Enrich brand metadata (optional, but recommended for hybrid mode)
node scripts/enrich-brand-metadata.js

# 3. Generate brand embeddings
node scripts/generate-brand-embeddings.js          # Simple mode
node scripts/generate-brand-embeddings.js hybrid   # Hybrid mode (requires step 2)

# 4. Test brand similarity
cd ../fashion_query_api
node test-brand-similarity.js
```

---

## Database Tables Reference

### `product_embeddings`
```sql
- product_id UUID (UNIQUE, FK to products)
- embedding vector(1536)
- created_at TIMESTAMPTZ
- updated_at TIMESTAMPTZ
Index: idx_product_embeddings_embedding (IVFFlat, vector_cosine_ops)
```

### `brands` (with metadata)
```sql
- id UUID (PK)
- name TEXT (UNIQUE)
- top_categories TEXT[]
- price_segment TEXT
- style_description TEXT
- metadata_updated_at TIMESTAMPTZ
```

### `brand_embeddings`
```sql
- brand_id UUID (UNIQUE, FK to brands)
- embedding vector(1536)
- product_count INT
- updated_at TIMESTAMPTZ
Index: idx_brand_embeddings_embedding (IVFFlat, vector_cosine_ops)
```

---

## Summary

To get full brand similarity working:

1. **Run scraper** → Product embeddings created automatically
2. **Enrich brands** (optional) → Adds metadata for richer matching
3. **Generate brand embeddings** → Enables "brands like X" queries
4. **Test** → Verify everything works

The entire process from scratch takes:
- Initial scrape: 30min - 2hrs (depends on catalog size)
- Brand metadata enrichment: 5-15min (depends on brand count)
- Brand embeddings: 1-5min (simple) or 5-10min (hybrid)

**Total**: ~1-2 hours for initial setup, then incremental updates are fast.
