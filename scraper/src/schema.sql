-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- TABLE: stores
CREATE TABLE IF NOT EXISTS stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  city text,
  state text,
  lat numeric,
  lng numeric,
  domain text UNIQUE NOT NULL,
  website text,
  created_at timestamptz DEFAULT now()
);

-- TABLE: brands
CREATE TABLE IF NOT EXISTS brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  style_tags text[] DEFAULT '{}',
  price_segment text,
  style_description text,
  top_categories text[],
  metadata_updated_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- TABLE: products
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shopify_product_id bigint NOT NULL,
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  brand_id uuid REFERENCES brands(id),
  title text NOT NULL,
  description text,
  category text,
  price numeric,
  discounted_price numeric,
  images text[] DEFAULT '{}',
  shopify_updated_at timestamptz,
  last_scraped_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(shopify_product_id, store_id)
);

-- TABLE: variants
CREATE TABLE IF NOT EXISTS variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  shopify_variant_id bigint NOT NULL UNIQUE,
  size text,
  color text,
  inventory_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- TABLE: product_embeddings
CREATE TABLE IF NOT EXISTS product_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE UNIQUE,
  embedding vector(1536),
  created_at timestamptz DEFAULT now()
);

-- TABLE: brand_embeddings
CREATE TABLE IF NOT EXISTS brand_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid REFERENCES brands(id) ON DELETE CASCADE UNIQUE,
  embedding vector(1536),
  product_count int NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_shopify_updated_at ON products(shopify_updated_at);
CREATE INDEX IF NOT EXISTS idx_variants_product_id ON variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_embeddings_embedding ON product_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_brand_embeddings_embedding ON brand_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
