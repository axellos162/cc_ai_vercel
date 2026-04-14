import './src/load-env.js';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const matchProductsSQL = `
CREATE OR REPLACE FUNCTION match_products(
  query_embedding vector(1536),
  filter_brand    text    DEFAULT NULL,
  filter_category text    DEFAULT NULL,
  filter_city     text    DEFAULT NULL,
  filter_state    text    DEFAULT NULL,
  price_min       numeric DEFAULT NULL,
  price_max       numeric DEFAULT NULL,
  sort_by         text    DEFAULT 'relevance',
  match_count     int     DEFAULT 40
)
RETURNS TABLE (
  product_id        uuid,
  title             text,
  description       text,
  category          text,
  price             numeric,
  discounted_price  numeric,
  effective_price   numeric,
  images            text[],
  brand_name        text,
  store_name        text,
  store_city        text,
  store_state       text,
  store_lat         numeric,
  store_lng         numeric,
  similarity        float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id                                                          AS product_id,
    p.title,
    p.description,
    p.category,
    p.price,
    p.discounted_price,
    COALESCE(NULLIF(p.discounted_price, 0), p.price)             AS effective_price,
    p.images,
    b.name                                                        AS brand_name,
    s.name                                                        AS store_name,
    s.city                                                        AS store_city,
    s.state                                                       AS store_state,
    s.lat                                                         AS store_lat,
    s.lng                                                         AS store_lng,
    1 - (pe.embedding <=> query_embedding)                       AS similarity
  FROM products p
  JOIN product_embeddings pe ON pe.product_id = p.id
  JOIN stores s              ON s.id = p.store_id
  LEFT JOIN brands b         ON b.id = p.brand_id
  WHERE
    (filter_brand    IS NULL OR lower(b.name)    = lower(filter_brand))
    AND (filter_category IS NULL OR lower(p.category) ILIKE '%' || lower(filter_category) || '%')
    AND (filter_city     IS NULL OR lower(s.city)     = lower(filter_city))
    AND (filter_state    IS NULL OR lower(s.state)    = lower(filter_state))
    AND (price_min       IS NULL OR COALESCE(NULLIF(p.discounted_price,0),p.price) >= price_min)
    AND (price_max       IS NULL OR COALESCE(NULLIF(p.discounted_price,0),p.price) <= price_max)
  ORDER BY
    CASE sort_by
      WHEN 'discount'   THEN
        CASE WHEN p.discounted_price IS NOT NULL AND p.discounted_price > 0
             THEN (p.price - p.discounted_price) / NULLIF(p.price, 0)
             ELSE 0 END
      WHEN 'price_asc'  THEN COALESCE(NULLIF(p.discounted_price,0),p.price)
      WHEN 'price_desc' THEN -COALESCE(NULLIF(p.discounted_price,0),p.price)
      ELSE 1 - (pe.embedding <=> query_embedding)
    END DESC
  LIMIT match_count;
END;
$$;
`;

const matchSimilarProductsSQL = `
CREATE OR REPLACE FUNCTION match_similar_products(
  source_product_ids uuid[],
  exclude_brands     text[]  DEFAULT NULL,
  filter_category    text    DEFAULT NULL,
  filter_city        text    DEFAULT NULL,
  filter_state       text    DEFAULT NULL,
  price_min          numeric DEFAULT NULL,
  price_max          numeric DEFAULT NULL,
  sort_by            text    DEFAULT 'relevance',
  match_count        int     DEFAULT 40
)
RETURNS TABLE (
  product_id        uuid,
  title             text,
  description       text,
  category          text,
  price             numeric,
  discounted_price  numeric,
  effective_price   numeric,
  url               text,
  images            text[],
  brand_name        text,
  store_name        text,
  store_city        text,
  store_state       text,
  store_lat         numeric,
  store_lng         numeric,
  similarity        float
)
LANGUAGE plpgsql
AS $$
DECLARE
  avg_embedding vector(1536);
BEGIN
  -- Return empty if no source products provided
  IF source_product_ids IS NULL OR array_length(source_product_ids, 1) IS NULL THEN
    RETURN;
  END IF;

  -- Calculate average embedding from source products
  SELECT AVG(pe.embedding)
  INTO avg_embedding
  FROM product_embeddings pe
  WHERE pe.product_id = ANY(source_product_ids);

  -- Return empty if no embeddings found
  IF avg_embedding IS NULL THEN
    RETURN;
  END IF;

  -- Search for similar products
  RETURN QUERY
  SELECT
    p.id                                                          AS product_id,
    p.title,
    p.description,
    p.category,
    p.price,
    p.discounted_price,
    COALESCE(NULLIF(p.discounted_price, 0), p.price)             AS effective_price,
    p.url,
    p.images,
    b.name                                                        AS brand_name,
    s.name                                                        AS store_name,
    s.city                                                        AS store_city,
    s.state                                                       AS store_state,
    s.lat                                                         AS store_lat,
    s.lng                                                         AS store_lng,
    1 - (pe.embedding <=> avg_embedding)                         AS similarity
  FROM products p
  JOIN product_embeddings pe ON pe.product_id = p.id
  JOIN stores s              ON s.id = p.store_id
  LEFT JOIN brands b         ON b.id = p.brand_id
  WHERE
    -- Exclude source products
    (p.id != ALL(source_product_ids))
    -- Exclude specified brands
    AND (exclude_brands IS NULL OR b.name != ALL(exclude_brands))
    -- Apply filters
    AND (filter_category IS NULL OR lower(p.category) ILIKE '%' || lower(filter_category) || '%')
    AND (filter_city     IS NULL OR lower(s.city)     = lower(filter_city))
    AND (filter_state    IS NULL OR lower(s.state)    = lower(filter_state))
    AND (price_min       IS NULL OR COALESCE(NULLIF(p.discounted_price,0),p.price) >= price_min)
    AND (price_max       IS NULL OR COALESCE(NULLIF(p.discounted_price,0),p.price) <= price_max)
  ORDER BY
    CASE sort_by
      WHEN 'discount'   THEN
        CASE WHEN p.discounted_price IS NOT NULL AND p.discounted_price > 0
             THEN (p.price - p.discounted_price) / NULLIF(p.price, 0)
             ELSE 0 END
      WHEN 'price_asc'  THEN COALESCE(NULLIF(p.discounted_price,0),p.price)
      WHEN 'price_desc' THEN -COALESCE(NULLIF(p.discounted_price,0),p.price)
      ELSE 1 - (pe.embedding <=> avg_embedding)
    END DESC
  LIMIT match_count;
END;
$$;
`;

const matchSimilarBrandsSQL = `
CREATE OR REPLACE FUNCTION match_similar_brands(
  source_brand_name text,
  filter_city       text    DEFAULT NULL,
  filter_state      text    DEFAULT NULL,
  match_count       int     DEFAULT 10
)
RETURNS TABLE (
  brand_id          uuid,
  brand_name        text,
  product_count     int,
  similarity        float
)
LANGUAGE plpgsql
AS $$
DECLARE
  source_embedding vector(1536);
BEGIN
  -- Get the embedding for the source brand
  SELECT be.embedding
  INTO source_embedding
  FROM brand_embeddings be
  JOIN brands b ON b.id = be.brand_id
  WHERE LOWER(b.name) = LOWER(source_brand_name);

  -- Return empty if brand not found
  IF source_embedding IS NULL THEN
    RETURN;
  END IF;

  -- Find similar brands
  RETURN QUERY
  SELECT
    b.id                                    AS brand_id,
    b.name                                  AS brand_name,
    be.product_count,
    1 - (be.embedding <=> source_embedding) AS similarity
  FROM brand_embeddings be
  JOIN brands b ON b.id = be.brand_id
  WHERE
    -- Exclude the source brand itself
    LOWER(b.name) != LOWER(source_brand_name)
    -- Optional: filter by location (brands available in specific locations)
    AND (filter_city IS NULL OR EXISTS (
      SELECT 1 FROM products p
      JOIN stores s ON s.id = p.store_id
      WHERE p.brand_id = b.id AND LOWER(s.city) = LOWER(filter_city)
    ))
    AND (filter_state IS NULL OR EXISTS (
      SELECT 1 FROM products p
      JOIN stores s ON s.id = p.store_id
      WHERE p.brand_id = b.id AND LOWER(s.state) = LOWER(filter_state)
    ))
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;
`;

async function setupFunctions() {
  console.log('Setting up RPC functions...\n');

  // Setup match_products
  console.log('1. Creating match_products function...');
  try {
    const { error } = await supabase.rpc('exec', { sql: matchProductsSQL });
    if (error) throw error;
    console.log('✓ match_products function created successfully\n');
  } catch (err) {
    console.log('⚠ Failed to create match_products via RPC');
    console.log('Please run this SQL in Supabase SQL Editor:\n');
    console.log(matchProductsSQL);
    console.log('\n');
  }

  // Setup match_similar_products
  console.log('2. Creating match_similar_products function...');
  try {
    const { error } = await supabase.rpc('exec', { sql: matchSimilarProductsSQL });
    if (error) throw error;
    console.log('✓ match_similar_products function created successfully\n');
  } catch (err) {
    console.log('⚠ Failed to create match_similar_products via RPC');
    console.log('Please run this SQL in Supabase SQL Editor:\n');
    console.log(matchSimilarProductsSQL);
    console.log('\n');
  }

  // Setup match_similar_brands
  console.log('3. Creating match_similar_brands function...');
  try {
    const { error } = await supabase.rpc('exec', { sql: matchSimilarBrandsSQL });
    if (error) throw error;
    console.log('✓ match_similar_brands function created successfully\n');
  } catch (err) {
    console.log('⚠ Failed to create match_similar_brands via RPC');
    console.log('Please run this SQL in Supabase SQL Editor:\n');
    console.log(matchSimilarBrandsSQL);
    console.log('\n');
  }

  console.log('Setup complete!');
}

setupFunctions();
