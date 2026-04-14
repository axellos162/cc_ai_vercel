# CONCEPT COMMERCE

AI-powered fashion discovery platform with natural language search, brand similarity matching, and intelligent product recommendations.

## Overview

CONCEPT COMMERCE combines Shopify product data with AI embeddings to enable:

- **Natural language search** - "black jeans from Rick Owens in New York"
- **Brand similarity** - "brands like Acne Studios"
- **Similar products** - "find similar items from other brands"
- **Store finder** - "where can I find Lemaire in LA"
- **Price comparison** - "compare Rick Owens vs Ann Demeulemeester prices"

## Architecture

The system consists of three main components:

1. **Scraper** (`/scraper`) - Fetches products from 15 Shopify stores, enriches with AI, generates embeddings
2. **Fashion Query API** (`/fashion_query_api`) - Natural language query endpoint with intelligent intent classification
3. **Frontend** (`/frontend`) - Modern web interface for searching and browsing

## Quick Start

### Prerequisites

- Node.js 18+
- Supabase account with pgvector enabled
- OpenAI API key

### Setup

1. **Clone and install dependencies:**
   ```bash
   npm install
   cd scraper && npm install
   cd ../fashion_query_api && npm install
   cd ../frontend && npm install
   cd ..
   ```

2. **Configure environment variables:**
   ```bash
   # scraper/.env
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   OPENAI_API_KEY=your_openai_key

   # fashion_query_api/.env.local
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   OPENAI_API_KEY=your_openai_key

   # frontend/.env.local
   NEXT_PUBLIC_API_URL=http://localhost:3001
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_maps_key
   ```

3. **Create database schema:**
   ```bash
   # Run scraper/src/schema.sql in Supabase SQL Editor
   ```

4. **Scrape initial product data:**
   ```bash
   cd scraper
   npm start
   ```

5. **Generate brand embeddings** (for brand similarity):
   ```bash
   # Optional: Enrich brand metadata first
   node src/enrich-brand-metadata.js

   # Generate brand embeddings
   node src/generate-brand-embeddings.js hybrid
   ```

6. **Start the application:**
   ```bash
   cd ..
   ./start.sh
   ```

   Access the app at http://localhost:3000

## Documentation

### Core Guides

- **[STARTUP.md](./STARTUP.md)** - Quick start scripts and server management
- **[scraper/EMBEDDINGS.md](./scraper/EMBEDDINGS.md)** - Complete guide to embeddings and brand similarity
- **[scraper/QUICKSTART.md](./scraper/QUICKSTART.md)** - Scraper quick start
- **[scraper/scraper-architecture.md](./scraper/scraper-architecture.md)** - Detailed architecture docs
- **[scraper/TESTING.md](./scraper/TESTING.md)** - Integration testing checklist

### Key Features

#### Natural Language Understanding

The API uses GPT-4o-mini to classify user intent into 7 categories:

1. `product_search` - Find products by attributes
2. `store_finder` - Find stores carrying a brand
3. `availability_check` - Check if specific store has brand
4. `price_comparison` - Compare prices between brands
5. `similar_products` - Find similar products from other brands
6. `brand_similarity` - Find brands similar to a specific brand
7. `ambiguous` - Could be product search OR store finder

#### Intelligent Embeddings

- **Product Embeddings** - Auto-generated during scraping (1536-dim vectors)
- **Brand Embeddings** - Two modes:
  - **Simple**: Averages all product embeddings
  - **Hybrid**: Combines product embeddings (70%) + brand metadata (30%)

See [scraper/EMBEDDINGS.md](./scraper/EMBEDDINGS.md) for complete details.

#### Brand Similarity

Powered by pgvector cosine similarity on brand embeddings:

```bash
# Example query
curl -X POST http://localhost:3001/api/v1/query \
  -H "Content-Type: application/json" \
  -d '{"query": "brands like Rick Owens"}'
```

Returns brands ranked by similarity score with product counts.

## Project Structure

```
cc_ai/
├── scraper/                      # Shopify scraper + embeddings
│   ├── src/
│   │   ├── index.js             # Main scraper orchestrator
│   │   ├── sync.js              # Product sync + embeddings
│   │   ├── shopify.js           # Shopify API client
│   │   ├── enrichment.js        # GPT-4o-mini category/tag inference
│   │   ├── enrich-brand-metadata.js    # Brand metadata enrichment
│   │   └── generate-brand-embeddings.js # Brand embedding generation
│   ├── EMBEDDINGS.md            # Embedding guide
│   ├── QUICKSTART.md            # Quick start
│   └── scraper-architecture.md  # Architecture docs
│
├── fashion_query_api/           # Next.js API
│   ├── src/
│   │   ├── lib/
│   │   │   ├── classifier.js    # Intent classification
│   │   │   ├── constants.js     # Aliases, synonyms
│   │   │   └── db.js            # Supabase client
│   │   └── services/
│   │       ├── search.js        # Search orchestration
│   │       └── response.js      # Response shaping
│   └── pages/api/v1/
│       └── query.js             # Main API endpoint
│
├── frontend/                    # Next.js frontend
│   └── src/
│       └── app/
│
├── start.sh                     # Start all services
├── stop.sh                      # Stop all services
└── STARTUP.md                   # Server management guide
```

## Usage Examples

### Product Search
```bash
curl -X POST http://localhost:3001/api/v1/query \
  -d '{"query": "black leather jackets under $500"}'
```

### Brand Similarity
```bash
curl -X POST http://localhost:3001/api/v1/query \
  -d '{"query": "brands like Rick Owens in New York"}'
```

### Store Finder
```bash
curl -X POST http://localhost:3001/api/v1/query \
  -d '{"query": "where can I find Lemaire in LA"}'
```

### Similar Products
```bash
curl -X POST http://localhost:3001/api/v1/query \
  -d '{"query": "similar to this but from other brands", "context": {"previous_product_ids": ["uuid"]}}'
```

## Technology Stack

- **Backend**: Next.js API Routes, Supabase (Postgres + pgvector)
- **AI/ML**: OpenAI GPT-4o-mini (classification, enrichment), OpenAI text-embedding-3-small (1536-dim vectors)
- **Frontend**: Next.js, React, Google Maps API
- **Database**: Postgres 15+ with pgvector extension
- **Scraping**: Shopify public API (/products.json)

## Data Sources

Currently scraping 15 fashion stores including:
- Elkel NYC
- Odin New York
- STAG Provisions
- 14 other curated Shopify stores

See `scraper/stores.config.json` for full list.

## Development

### Run Scraper
```bash
cd scraper
npm start                          # All stores
node src/index.js --store "elkel.nyc"  # Single store
```

### Run API + Frontend
```bash
./start.sh    # Starts both on ports 3001 and 3000
./stop.sh     # Stops both services
```

### View Logs
```bash
tail -f logs/api.log
tail -f logs/frontend.log
```

## Testing

```bash
# Test scraper integration
cd scraper
node src/test-sync.js

# Test brand similarity
cd fashion_query_api
node test-brand-similarity.js

# Full integration test
cd scraper
# Follow steps in TESTING.md
```

## Troubleshooting

See individual guides:
- [STARTUP.md](./STARTUP.md) - Server issues
- [scraper/EMBEDDINGS.md](./scraper/EMBEDDINGS.md) - Embedding issues
- [scraper/QUICKSTART.md](./scraper/QUICKSTART.md) - Scraper issues

## Contributing

This is an experimental project. See `scraper/AGENTS.md` and `fashion_query_api/AGENTS.md` for development constraints and guidelines.

## License

MIT
