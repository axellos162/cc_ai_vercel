# Setup Instructions for match_products Function

## Required: Create the match_products RPC function in Supabase

Before running tests, you must create the `match_products` function in your Supabase database.

### Steps:

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project
2. Select your project (khxsqcuykkpsxvsoaboj)
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy the entire contents of `/tmp/match_products.sql`  
   OR copy the SQL below:

```sql
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
```

6. Click **Run** or press Cmd/Ctrl + Enter
7. Verify success message appears

### Verify Setup:

Run the check script:
```bash
node check-function.js
```

You should see: `✓ match_products function exists and is working!`

### Then Run Tests:

```bash
npm run test:search
```
