# Embedding Quick Reference

Fast reference for embedding generation commands.

## TL;DR - Complete Setup

```bash
# 1. Scrape products (auto-generates product embeddings)
npm start

# 2. Enrich brand metadata (optional, recommended)
node src/enrich-brand-metadata.js

# 3. Generate brand embeddings (choose one mode)
node src/generate-brand-embeddings.js          # Simple: product-based only
node src/generate-brand-embeddings.js hybrid   # Hybrid: products + metadata
```

---

## Common Commands

### Scrape All Stores
```bash
npm start
```
- Generates product embeddings automatically
- Takes 30min - 2hrs depending on catalog size

### Scrape Single Store
```bash
node src/index.js --store "elkel.nyc"
```

### Enrich Brand Metadata
```bash
node src/enrich-brand-metadata.js
```
- Adds: top categories, price segment, style description
- Takes 5-15min depending on brand count
- **Run this before hybrid mode**

### Generate Brand Embeddings - Simple
```bash
node src/generate-brand-embeddings.js
```
- Averages product embeddings only
- Fast, no dependencies
- Takes 1-5min

### Generate Brand Embeddings - Hybrid
```bash
node src/generate-brand-embeddings.js hybrid
```
- Combines products (70%) + metadata (30%)
- Requires brand metadata enrichment first
- Takes 5-10min

---

## Verification Commands

### Check Product Embeddings
```bash
node -e "
  import('./src/db.js').then(async ({supabase}) => {
    const {data} = await supabase.from('product_embeddings').select('count');
    console.log('Product embeddings:', data?.[0]?.count || 0);
    process.exit(0);
  })
"
```

### Check Brand Embeddings
```bash
node -e "
  import('./src/db.js').then(async ({supabase}) => {
    const {data} = await supabase.from('brand_embeddings').select('count');
    console.log('Brand embeddings:', data?.[0]?.count || 0);
    process.exit(0);
  })
"
```

### Test Brand Similarity
```bash
cd ../fashion_query_api
node test-brand-similarity.js
```

---

## Decision Tree

**Do you have product embeddings?**
- No → Run `npm start`
- Yes → Continue

**Do you want brand similarity?**
- No → You're done!
- Yes → Continue

**Do you want richer brand matching?**
- No → Run `node src/generate-brand-embeddings.js` (simple mode)
- Yes → Run both:
  1. `node src/enrich-brand-metadata.js`
  2. `node src/generate-brand-embeddings.js hybrid`

---

## When to Re-run

### Product Embeddings
Re-run scraper when:
- New products added to stores
- Product descriptions change
- **Frequency:** Daily or weekly

### Brand Metadata
Re-run enrichment when:
- New brands added
- Product catalogs change significantly
- **Frequency:** Weekly or monthly

### Brand Embeddings
Re-run generation when:
- After enriching brand metadata
- Product catalogs change significantly
- **Frequency:** After metadata enrichment

---

## Simple vs Hybrid Mode

| Feature | Simple | Hybrid |
|---------|--------|--------|
| Speed | Fast (1-5min) | Slower (5-10min) |
| Dependencies | None | Requires metadata enrichment |
| Based on | Products only | Products (70%) + Metadata (30%) |
| Best for | Product similarity | Brand aesthetic matching |
| Example match | "Brands with similar products" | "Luxury avant-garde brands" |

**Recommendation:** Use hybrid for better brand similarity results.

---

## Troubleshooting

### "No product embeddings found"
```bash
# Solution: Run scraper first
npm start
```

### "Brand has no products"
```bash
# Solution: This is normal, script skips brands with no products
# Check if brand has products:
node -e "
  import('./src/db.js').then(async ({supabase}) => {
    const {data} = await supabase.from('products')
      .select('count')
      .eq('brand_id', (await supabase.from('brands').select('id').eq('name', 'BrandName').single()).data.id);
    console.log('Products:', data?.[0]?.count || 0);
    process.exit(0);
  })
"
```

### "OpenAI API error"
```bash
# Check API key and quota
echo $OPENAI_API_KEY
# Re-run the failed command
```

---

## Full Documentation

For detailed explanations, see:
- **[EMBEDDINGS.md](./EMBEDDINGS.md)** - Complete guide
- **[QUICKSTART.md](./QUICKSTART.md)** - Scraper quick start
- **[scraper-architecture.md](./scraper-architecture.md)** - Architecture details
