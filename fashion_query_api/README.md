# Fashion Query API

Natural language query endpoint for CONCEPT COMMERCE fashion discovery platform.

## Overview

A Next.js API that accepts natural language queries and returns structured fashion search results. Powers:

- Product search with semantic similarity
- Brand similarity matching
- Store finder
- Availability checks
- Price comparisons
- Similar product recommendations

## Architecture

Single endpoint: `POST /api/v1/query`

**Flow:**
1. Receive natural language query
2. Classify intent using GPT-4o-mini
3. Execute appropriate search (pgvector similarity, SQL filters, or both)
4. Shape response into standardized envelope
5. Return JSON

## Quick Start

### Prerequisites

- Node.js 18+
- Supabase project with:
  - Product data (scraped via `/scraper`)
  - Product embeddings (1536-dim vectors)
  - Brand embeddings (for brand similarity)
  - pgvector extension enabled

### Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your credentials:
   # NEXT_PUBLIC_SUPABASE_URL
   # NEXT_PUBLIC_SUPABASE_ANON_KEY
   # OPENAI_API_KEY
   ```

3. **Ensure database is populated:**
   ```bash
   # From the scraper directory
   cd ../scraper
   npm start  # Scrapes products + generates embeddings
   ```

4. **Generate brand embeddings** (for brand similarity):
   ```bash
   # Still in scraper directory
   node src/enrich-brand-metadata.js
   node src/generate-brand-embeddings.js hybrid
   ```

   See [../scraper/EMBEDDINGS.md](../scraper/EMBEDDINGS.md) for complete guide.

5. **Start the server:**
   ```bash
   cd ../fashion_query_api
   PORT=3001 npm run dev
   ```

   API available at http://localhost:3001

## Usage

### Example Requests

**Product Search:**
```bash
curl -X POST http://localhost:3001/api/v1/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "black leather jackets under $500",
    "sort": "price_asc"
  }'
```

**Brand Similarity:**
```bash
curl -X POST http://localhost:3001/api/v1/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "brands like Rick Owens in New York"
  }'
```

**Store Finder:**
```bash
curl -X POST http://localhost:3001/api/v1/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "where can I find Lemaire in LA"
  }'
```

**Similar Products:**
```bash
curl -X POST http://localhost:3001/api/v1/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "similar to this but from other brands",
    "context": {
      "previous_product_ids": ["uuid-of-product"]
    }
  }'
```

### Response Format

All responses follow a standardized envelope:

**Success:**
```json
{
  "ok": true,
  "intent": "brand_similarity",
  "query": "brands like Rick Owens",
  "sort": "relevance",
  "filters": {
    "brand": "Rick Owens",
    "city": "New York"
  },
  "results": {
    "type": "brand_similarity",
    "data": {
      "brands": [
        {
          "id": "uuid",
          "name": "Ann Demeulemeester",
          "similarity": 87,
          "product_count": 45
        }
      ],
      "summary": "Found 8 brands similar to Rick Owens..."
    }
  },
  "meta": {
    "total": 8,
    "generated_at": "2026-04-13T..."
  }
}
```

**Error:**
```json
{
  "ok": false,
  "error": "Query parameter is required",
  "query": null
}
```

## Intent Classification

The API classifies queries into 7 intent types:

| Intent | Description | Example |
|--------|-------------|---------|
| `product_search` | Find products by attributes | "black jeans under $200" |
| `store_finder` | Find stores carrying a brand | "where to find Lemaire" |
| `availability_check` | Check specific store for brand | "does Odin NYC have Rick Owens" |
| `price_comparison` | Compare prices between brands | "Rick Owens vs Ann D prices" |
| `similar_products` | Find similar items from other brands | "similar to this" |
| `brand_similarity` | Find brands similar to a brand | "brands like Acne Studios" |
| `ambiguous` | Could be product search OR store finder | "Lemaire in LA" |

## Sort Options

Valid sort values (pass in request body):
- `relevance` (default) - Semantic similarity
- `discount` - Highest discount percentage first
- `price_asc` - Lowest price first
- `price_desc` - Highest price first

## Dependencies & Embeddings

This API relies on:

1. **Product embeddings** - Generated during scraping
2. **Brand embeddings** - Generated separately for brand similarity

**To enable brand similarity queries:**

Brand similarity requires brand embeddings. Generate them using:

```bash
cd ../scraper
node src/generate-brand-embeddings.js hybrid
```

See [../scraper/EMBEDDINGS.md](../scraper/EMBEDDINGS.md) for:
- How embeddings are generated
- Simple vs hybrid mode
- When to regenerate
- Troubleshooting

**Quick check:**
```bash
# Test if brand similarity is working
node test-brand-similarity.js
```

## Project Structure

```
fashion_query_api/
├── src/
│   ├── app/api/v1/query/
│   │   └── route.js           # Main API endpoint
│   ├── lib/
│   │   ├── db.js              # Supabase client
│   │   ├── openai.js          # OpenAI client + model constants
│   │   └── constants.js       # INTENTS, SORT_OPTIONS, defaults
│   └── services/
│       ├── classifier.js      # Intent classification
│       ├── search.js          # Search orchestration
│       └── response.js        # Response shaping
├── test-brand-similarity.js   # Brand similarity tests
└── AGENTS.md                  # Development constraints
```

## Development

### Running Locally

```bash
# Development mode (hot-reload)
PORT=3001 npm run dev

# Production build
npm run build
npm start
```

### Testing

```bash
# Test brand similarity
node test-brand-similarity.js

# Test full integration
node test-brand-integration.js
```

### Environment Variables

Required in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
OPENAI_API_KEY=sk-your_openai_key
```

## Database Requirements

### Required Tables

- `products` - Product catalog
- `brands` - Brand metadata
- `stores` - Store locations
- `variants` - Product variants
- `product_embeddings` - 1536-dim vectors (pgvector)
- `brand_embeddings` - 1536-dim brand vectors (pgvector)

### Required Functions

- `match_products(query_embedding, filter_*)` - Product similarity search
- `match_similar_brands(source_brand_name, filter_*)` - Brand similarity search
- `match_similar_products_from_brands(query_product_id, brand_ids, limit)` - Cross-brand product similarity

See `../scraper/src/schema.sql` for full schema.

## Development Constraints

This project follows strict development rules defined in [AGENTS.md](./AGENTS.md):

- **Read-only** - Never writes to database
- **Single endpoint** - `POST /api/v1/query` only
- **Versioned** - Breaking changes require new `/api/v2/` route
- **No hardcoded models** - All model names in `src/lib/openai.js`
- **Standardized envelope** - All responses follow defined structure
- **ESM only** - No CommonJS

Read AGENTS.md before contributing.

## Troubleshooting

### "Brand similarity returns empty results"

**Cause:** Brand embeddings not generated.

**Solution:**
```bash
cd ../scraper
node src/generate-brand-embeddings.js hybrid
```

See [../scraper/EMBEDDINGS.md](../scraper/EMBEDDINGS.md)

### "Product search returns no results"

**Cause:** No products or embeddings in database.

**Solution:**
```bash
cd ../scraper
npm start  # Scrapes products + generates embeddings
```

### "OpenAI API error"

**Cause:** Missing or invalid API key.

**Solution:** Check `.env.local` has valid `OPENAI_API_KEY`

### "Supabase connection error"

**Cause:** Invalid credentials or database not accessible.

**Solution:** Verify `.env.local` has correct Supabase URL and key

## Documentation

- **[AGENTS.md](./AGENTS.md)** - Development constraints and rules
- **[../scraper/EMBEDDINGS.md](../scraper/EMBEDDINGS.md)** - Complete embedding guide
- **[../STARTUP.md](../STARTUP.md)** - Server startup and management
- **[../README.md](../README.md)** - Main project documentation

## API Version

Current: **v1**

The API is versioned at the route level (`/api/v1/`). This version will remain stable. Breaking changes will be introduced as `/api/v2/` while maintaining v1 compatibility.

## Technology Stack

- **Framework:** Next.js 15+ (App Router, Node runtime)
- **Database:** Supabase (Postgres 15+ with pgvector)
- **AI/ML:** OpenAI GPT-4o-mini (classification), text-embedding-3-small (1536-dim vectors)
- **Language:** JavaScript (ESM)

## License

MIT
