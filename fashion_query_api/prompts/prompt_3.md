Continue building the fashion-query-api Next.js project.

Create src/services/search.js

This module contains all database query logic. It takes a classified intent
object (output of classifyQuery) and returns raw data from Supabase.

Import { supabase } from src/lib/db.js
Import { openai, EMBEDDING_MODEL } from src/lib/openai.js
Import { INTENTS, SORT_OPTIONS, PRICE_AROUND_BUFFER } from src/lib/constants.js

---

HELPER: generateQueryEmbedding(queryString)

- Calls OpenAI embeddings API with model EMBEDDING_MODEL
- Input: queryString
- Returns: number[] of length 1536
- On failure: throw with a descriptive error message

---

HELPER: effectivePrice(row)

The "effective price" is what the customer actually pays:
- If discounted_price is not null and discounted_price > 0, use discounted_price
- Otherwise use price
This logic must be applied consistently across all search and sort operations.
Never sort or filter on raw price alone when discounted_price is available.

This helper is used conceptually in SQL ordering — implement it as a Postgres
expression: COALESCE(NULLIF(discounted_price, 0), price)

---

HELPER: applyPriceFilter(query, filters)

Takes a Supabase query builder and the filters object. Applies price conditions:
- If price_max is set: effective price <= price_max
- If price_min is set: effective price >= price_min
- If price_around is set: effective price BETWEEN (price_around - PRICE_AROUND_BUFFER)
  AND (price_around + PRICE_AROUND_BUFFER)
- Uses the COALESCE(NULLIF(discounted_price, 0), price) expression for all comparisons
- Returns the modified query builder

Note: Supabase JS client does not support raw SQL expressions in filter clauses
directly. Use .filter() with the raw postgres expression via rpc, OR restructure
as a Postgres function. The cleanest approach for Phase 1: create a Supabase
RPC function called `search_products` (see below) and pass price params to it.
Use .gte() and .lte() on effective_price as a computed column if possible,
otherwise fall back to the RPC approach.

---

FUNCTION: searchProducts(classifiedIntent)

Handles intents: product_search, ambiguous (product half)

Steps:
1. Generate embedding for classifiedIntent.raw_query
2. Call the Supabase RPC function `match_products` (defined below) with:
   - query_embedding: the generated vector
   - filter_brand: filters.brand (null if not set)
   - filter_category: filters.category (null if not set)
   - filter_city: filters.city (null if not set)
   - filter_state: filters.state (null if not set)
   - price_min: resolved price_min (if price_around: price_around - PRICE_AROUND_BUFFER, else filters.price_min)
   - price_max: resolved price_max (if price_around: price_around + PRICE_AROUND_BUFFER, else filters.price_max)
   - sort_by: classifiedIntent.sort ?? DEFAULT_SORT
   - match_count: 40
3. Return the raw rows from the RPC response

The Supabase RPC function `match_products` must be created in schema.sql
(add it to the existing schema file in the scraper project, or document it
separately). The SQL function:

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
      ELSE 1 - (pe.embedding <=> query_embedding)  -- relevance default
    END DESC
  LIMIT match_count;
END;
$$;
```

Run this SQL in the Supabase SQL editor before testing.

---

FUNCTION: findStores(classifiedIntent)

Handles intents: store_finder, ambiguous (store half), availability_check

Steps:
1. Query the stores table joined to products and variants:
   - Filter by city (case-insensitive) if filters.city is set
   - Filter by state if filters.state is set
   - Filter by brand name (via brands join) if filters.brand is set
   - Only include stores where at least one variant has inventory_count > 0
   - Return distinct stores with their lat/lng and matched brand info
2. For availability_check: same query, but return a boolean `available` field
   (true if any rows returned) plus the product images (up to 6) for the brand
   at that store

Return shape for store_finder / ambiguous:
  [
    {
      store_id, store_name, city, state, lat, lng,
      brand_name,
      product_count,       // count of matching products with inventory > 0
      sample_images        // first 3 product image URLs for this store+brand
    }
  ]

Return shape for availability_check:
  {
    available: boolean,
    store_name: string | null,
    city: string | null,
    brand_name: string | null,
    sample_images: string[]   // up to 6 product images if available
  }

---

FUNCTION: compareProducts(classifiedIntent)

Handles intent: price_comparison

Steps:
1. Extract the two brands from filters.brands[]
2. For each brand (run in parallel with Promise.all):
   a. Generate an embedding for "{brand} {category}" where category comes
      from filters.category (use raw_query if category is null)
   b. Call match_products RPC with filter_brand set to that brand,
      filter_category set to filters.category,
      sort_by: "relevance", match_count: 20
3. Return both result sets side by side:
  {
    brand_a: { name: string, products: row[] },
    brand_b: { name: string, products: row[] }
  }

---

Export: { searchProducts, findStores, compareProducts }

---

BACKTESTING

Create src/services/search.test.js

Test the following (use real data from your Supabase instance):

1. PRODUCT SEARCH TEST
   Call searchProducts with a mock classified intent:
   {
     intent: "product_search",
     filters: { brand: null, category: "jeans", city: null, state: null,
                price_min: null, price_max: null, price_around: null },
     sort: "relevance",
     raw_query: "jeans"
   }
   Assert: result is an array, length > 0, each row has product_id, title,
   effective_price, images, store_name

2. PRICE FILTER TEST
   Same as above but with price_max: 200
   Assert: every row's effective_price <= 200

3. STORE FINDER TEST
   Call findStores with a mock intent for a city that exists in your data
   Assert: result is an array, each row has lat and lng, product_count > 0

4. DISCOUNT SORT TEST
   Call searchProducts with sort: "discount"
   Assert: first result has a discounted_price that is lower than price
   (if your data has discounted products)

Add script:
  "test:search": "node src/services/search.test.js"