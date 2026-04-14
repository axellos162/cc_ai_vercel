You are building a Shopify-to-Supabase scraper in Node.js (ESM, not CommonJS).

Create the following project structure:

shopify-scraper/
├── .env.example
├── .gitignore
├── package.json
├── stores.config.json
├── src/
│   ├── index.js          ← entry point
│   ├── db.js             ← Supabase client
│   ├── schema.sql        ← full schema
│   └── logger.js         ← terminal logger

RULES:
- Use @supabase/supabase-js for the client
- Use dotenv for env loading
- ESM imports throughout (import/export, not require)

---

.env.example must contain:
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=

---

stores.config.json must be an array of store objects:
[
  {
    "name": "Store Display Name",
    "domain": "storename.myshopify.com",
    "city": "San Francisco",
    "state": "CA",
    "lat": 37.7749,
    "lng": -122.4194
  }
]

Populate it with 2 placeholder stores for testing.

---

schema.sql must create the following tables with these exact columns.
Run this SQL in Supabase to initialize the database.

Enable the pgvector extension first:
  CREATE EXTENSION IF NOT EXISTS vector;

TABLE: stores
- id: uuid PRIMARY KEY DEFAULT gen_random_uuid()
- name: text NOT NULL
- city: text
- state: text
- lat: numeric
- lng: numeric
- domain: text UNIQUE NOT NULL
- website: text
- created_at: timestamptz DEFAULT now()

TABLE: brands
- id: uuid PRIMARY KEY DEFAULT gen_random_uuid()
- name: text UNIQUE NOT NULL
- style_tags: text[] DEFAULT '{}'
- created_at: timestamptz DEFAULT now()

TABLE: products
- id: uuid PRIMARY KEY DEFAULT gen_random_uuid()
- shopify_product_id: bigint NOT NULL
- store_id: uuid REFERENCES stores(id) ON DELETE CASCADE
- brand_id: uuid REFERENCES brands(id)
- title: text NOT NULL
- description: text
- category: text
- price: numeric
- discounted_price: numeric
- images: text[] DEFAULT '{}'
- shopify_updated_at: timestamptz
- last_scraped_at: timestamptz DEFAULT now()
- created_at: timestamptz DEFAULT now()
- UNIQUE(shopify_product_id, store_id)

TABLE: variants
- id: uuid PRIMARY KEY DEFAULT gen_random_uuid()
- product_id: uuid REFERENCES products(id) ON DELETE CASCADE
- shopify_variant_id: bigint NOT NULL UNIQUE
- size: text
- color: text
- inventory_count: integer DEFAULT 0
- created_at: timestamptz DEFAULT now()

TABLE: product_embeddings
- id: uuid PRIMARY KEY DEFAULT gen_random_uuid()
- product_id: uuid REFERENCES products(id) ON DELETE CASCADE UNIQUE
- embedding: vector(1536)
- created_at: timestamptz DEFAULT now()

Create indexes:
- products(store_id)
- products(brand_id)
- products(shopify_updated_at)
- variants(product_id)
- product_embeddings using ivfflat (embedding vector_cosine_ops) WITH (lists = 100)

---

logger.js must export a simple logger:
- logger.info(msg)   → green timestamp prefix
- logger.warn(msg)   → yellow timestamp prefix  
- logger.error(msg)  → red timestamp prefix

Use chalk or picocolors for colors.

---

db.js must:
- Import createClient from @supabase/supabase-js
- Read SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from process.env
- Export a single supabase client instance

---

package.json must include:
- "type": "module"
- scripts: { "start": "node src/index.js" }
- dependencies: @supabase/supabase-js, dotenv, picocolors or chalk

---

BACKTESTING STEP — after writing all files:
1. Output the exact command to install dependencies
2. Output the exact command to verify the supabase client connects:
   node -e "import('./src/db.js').then(m => m.supabase.from('stores').select('count').then(console.log))"
3. Confirm that schema.sql has no forward references (brands must be created before products)
4. List every table and confirm each foreign key references a table that exists