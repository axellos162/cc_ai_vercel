# Shopify Scraper - Integration Backtesting Checklist

Run these commands in order to verify the scraper is working correctly.

## Prerequisites

1. Ensure `.env` file exists with valid credentials:
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   OPENAI_API_KEY=sk-your_openai_key
   ```

2. Run `schema.sql` in Supabase SQL editor to create all tables

3. Update `stores.config.json` with real Shopify store domains

---

## Test 1: Schema Check

Verify all database tables are accessible:

```bash
node -e "
  import('./src/db.js').then(async ({supabase}) => {
    const tables = ['stores','brands','products','variants','product_embeddings'];
    for (const t of tables) {
      const {error} = await supabase.from(t).select('count').limit(1);
      console.log(t, error ? 'FAIL: '+error.message : 'OK');
    }
    process.exit(0);
  })
"
```

**Expected Output:**
```
stores OK
brands OK
products OK
variants OK
product_embeddings OK
```

**Status:** [ ] PASS / [ ] FAIL

---

## Test 2: Single Store Run (First Sync)

Run scraper on a single store:

```bash
node src/index.js --store "allbirds.com"
```

(Replace `allbirds.com` with your actual test store domain from `stores.config.json`)

**Expected Behavior:**
- ✓ Banner shows "Shopify → Supabase Scraper"
- ✓ Logs show "Full sync (no previous data)"
- ✓ Products are fetched page by page
- ✓ Each product logs "✓ [Product Title]"
- ✓ Summary shows: "X new, 0 updated, 0 skipped"
- ✓ newCount > 0
- ✓ No unhandled errors or crashes

**Observed newCount:** ___________

**Status:** [ ] PASS / [ ] FAIL

---

## Test 3: Incremental Sync Check

Run the **exact same command** again immediately:

```bash
node src/index.js --store "allbirds.com"
```

**Expected Behavior:**
- ✓ Logs show "Incremental sync from [timestamp]"
- ✓ Shopify API called with `updated_at_min` parameter
- ✓ Summary shows: "0 new, 0 updated, 0 skipped" (if no products changed)
- ✓ Or: "0 new, X updated, Y skipped" (if some products changed)
- ✓ newCount = 0

**Observed Summary:** ___________

**Status:** [ ] PASS / [ ] FAIL

---

## Test 4: Embedding Sanity Check

Verify embeddings are 1536 dimensions:

```bash
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

**Status:** [ ] PASS / [ ] FAIL

---

## Test 5: Data Integrity Check

Run this SQL directly in **Supabase SQL Editor**:

```sql
SELECT 
  (SELECT count(*) FROM products) AS products,
  (SELECT count(*) FROM variants) AS variants,
  (SELECT count(*) FROM product_embeddings) AS embeddings,
  (SELECT count(*) FROM brands) AS brands;
```

**Expected Results:**
- ✓ products > 0
- ✓ variants > 0
- ✓ embeddings > 0
- ✓ brands > 0
- ✓ embeddings ≈ products (should be roughly equal)

**Observed Counts:**
- products: ___________
- variants: ___________
- embeddings: ___________
- brands: ___________

**Status:** [ ] PASS / [ ] FAIL

---

## Test 6: Multiple Stores (Optional)

Run scraper with all stores:

```bash
npm start
```

**Expected Behavior:**
- ✓ Shows "Stores to sync: X"
- ✓ Processes each store sequentially
- ✓ Logs "Waiting 2 seconds before next store..." between stores
- ✓ If one store fails, others continue
- ✓ Shows "Scraper complete" at end
- ✓ Shows total elapsed time

**Status:** [ ] PASS / [ ] FAIL / [ ] SKIPPED

---

## Overall Result

If **all required tests (1-5) pass**, the scraper is production-ready.

**Final Status:** [ ] READY / [ ] NEEDS FIXES

---

## Common Issues & Solutions

### "SUPABASE_URL must be set"
→ Create `.env` file with credentials

### "Store not found: X"
→ Check domain spelling in `stores.config.json`

### "Failed to fetch from X: 404"
→ Store domain is incorrect or not publicly accessible

### "Embedding length: undefined"
→ No embeddings generated yet, run Test 2 first

### Embedding length not 1536
→ OpenAI API issue or wrong model, check `sync.js` uses `text-embedding-3-small`

### Very slow execution
→ Expected! Shopify has rate limits (600ms between pages)
   Processing 1000 products can take 10+ minutes

### "brands FAIL: relation does not exist"
→ Run `schema.sql` in Supabase first
