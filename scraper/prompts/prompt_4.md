Continue building the shopify-scraper project.

Create src/sync.js

This is the core sync module. It handles writing products to Supabase
and implementing incremental sync (skip unchanged products).

---

FUNCTION: getStoreRecord(domain)

- Look up store by domain in the stores table
- If not found, INSERT it using data from the config file entry for that domain
- Return the store row (id, name, domain, city, state, lat, lng)

---

FUNCTION: getLastScrapedTimestamp(storeId)

- Query: SELECT MAX(shopify_updated_at) FROM products WHERE store_id = storeId
- Return the result as a Date object, or null if no products exist yet

---

FUNCTION: upsertProduct(normalizedProduct, brandId, category, styleTags)

Takes:
- normalizedProduct: output of extractProductData
- brandId: uuid or null
- category: string or null
- styleTags: string[]

Steps:
1. Upsert into products table using UNIQUE(shopify_product_id, store_id).
   On conflict, update: title, description, brand_id, category, price,
   discounted_price, images, shopify_updated_at, last_scraped_at
2. For each variant in normalizedProduct.variants:
   Upsert into variants using shopify_variant_id as conflict key.
   Update: size, color, inventory_count
3. Return the product id (uuid) and a boolean `isNew` 
   (true if it was inserted, false if updated)

---

FUNCTION: upsertEmbedding(productId, embeddingVector)

- Upsert into product_embeddings using product_id as conflict key
- embeddingVector is a number[] of length 1536
- On conflict, update the embedding

---

FUNCTION: syncStore(storeConfig)

This is the main function that orchestrates one full store sync.

storeConfig is one entry from stores.config.json.

Steps:
1. Call getStoreRecord(storeConfig.domain) to get/create the store DB row
2. Call getLastScrapedTimestamp(storeId)
   - If null → full sync: call fetchAllProducts(domain)
   - If exists → incremental sync: call fetchUpdatedProducts(domain, lastTimestamp)
3. Log: logger.info(`[${storeConfig.name}] Syncing ${products.length} products`)
4. For each product (process sequentially, not in parallel):
   a. Call extractProductData(rawProduct, storeId)
   b. Call upsertBrand(normalizedProduct.vendor)
   c. Determine if enrichment is needed:
      - Always enrich if isNew === true
      - If updated: only enrich if title or description changed
        (compare against DB values before upsert)
   d. If enrichment needed: call inferProductMeta(title, description, vendor)
   e. Call upsertProduct(normalizedProduct, brandId, category, styleTags)
   f. If enrichment was done OR isNew: generate and upsert embedding (Step 5)
   g. Log per-product: logger.info(`[${name}] ✓ ${title}`)
5. For embedding generation, create the embedding text as:
   "{title}. Brand: {vendor}. Category: {category}. Tags: {styleTags.join(', ')}. {description?.slice(0, 300)}"
   Call OpenAI embeddings API: model "text-embedding-3-small", input: embeddingText
   Call upsertEmbedding(productId, embeddingVector)
6. At the end, log a summary:
   logger.info(`[${storeConfig.name}] Done. ${newCount} new, ${updatedCount} updated, ${skippedCount} skipped`)

---

Export: { syncStore }

---

BACKTESTING STEP:
1. Write src/test-sync.js:
   - Import syncStore
   - Use the first store from stores.config.json
   - Call syncStore on it
   - After completion, query Supabase:
     SELECT count(*) FROM products WHERE store_id = <the store id>
     SELECT count(*) FROM product_embeddings
   - Assert both counts are > 0
   - Run syncStore again on the same store immediately
   - Assert the log shows 0 new products (all skipped, incremental sync working)
2. Add "test:sync": "node src/test-sync.js" to package.json scripts