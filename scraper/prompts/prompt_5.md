Continue building the shopify-scraper project.

Update src/index.js to be the main entry point that runs the full scraper.

---

src/index.js must:

1. Load .env using dotenv
2. Read stores.config.json
3. Log a startup banner:
   logger.info("=== Shopify → Supabase Scraper ===")
   logger.info(`Stores to sync: ${stores.length}`)
   logger.info(`Started at: ${new Date().toISOString()}`)

4. Loop through each store in the config SEQUENTIALLY (not parallel).
   Parallel runs would exceed Shopify's rate limit.
   
   For each store:
   - Log: logger.info(`\n--- Starting: ${store.name} ---`)
   - Call syncStore(store)
   - Catch and log any error without crashing the whole run:
     logger.error(`[${store.name}] Failed: ${err.message}`)
   - Add a 2 second delay between stores

5. At the end log:
   logger.info(`\n=== Scraper complete ===`)
   logger.info(`Total time: ${elapsed}s`)
   process.exit(0)

---

Also add a --store flag for running a single store:
  node src/index.js --store "storename.myshopify.com"
  
If --store is passed, only sync that one store.
Use process.argv to parse this flag. No additional libraries needed.

---

FINAL INTEGRATION BACKTESTING:
Write a final checklist that a human must verify by running these exact commands:

1. SCHEMA CHECK
   node -e "
     import('./src/db.js').then(async ({supabase}) => {
       const tables = ['stores','brands','products','variants','product_embeddings'];
       for (const t of tables) {
         const {error} = await supabase.from(t).select('count').limit(1);
         console.log(t, error ? 'FAIL: '+error.message : 'OK');
       }
     })
   "
   Expected: all 5 tables print OK

2. SINGLE STORE RUN
   node src/index.js --store "your-test-store.myshopify.com"
   Expected:
   - Logs show products being fetched and written
   - No unhandled errors
   - Summary shows newCount > 0

3. INCREMENTAL SYNC CHECK
   Run the same command again immediately.
   Expected:
   - Logs show fetchUpdatedProducts was called (not fetchAllProducts)
   - Summary shows newCount = 0, skippedCount > 0

4. EMBEDDING SANITY CHECK
   node -e "
     import('./src/db.js').then(async ({supabase}) => {
       const {data} = await supabase
         .from('product_embeddings')
         .select('embedding')
         .limit(1);
       const emb = data?.[0]?.embedding;
       console.log('Embedding length:', emb?.length);
       console.log('Is 1536:', emb?.length === 1536 ? 'PASS' : 'FAIL');
     })
   "
   Expected: Embedding length: 1536, Is 1536: PASS

5. DATA INTEGRITY CHECK
   Run this SQL directly in Supabase's SQL editor:
   SELECT 
     (SELECT count(*) FROM products) AS products,
     (SELECT count(*) FROM variants) AS variants,
     (SELECT count(*) FROM product_embeddings) AS embeddings,
     (SELECT count(*) FROM brands) AS brands;
   
   Expected: All counts > 0, embeddings count should roughly equal products count.

If all 5 checks pass, the scraper is working correctly.