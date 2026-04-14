Continue building the shopify-scraper project.

Create src/enrichment.js

This module is responsible for two things:
1. Upserting a brand record (from vendor name) into the brands table
2. Using GPT-4o-mini to infer category and style_tags for a product

---

FUNCTION: upsertBrand(vendorName)

- If vendorName is null or empty string, return null
- Normalize the vendor name: trim whitespace, title-case it
- Upsert into the brands table using:
  supabase.from('brands').upsert({ name: normalizedName }, { onConflict: 'name' })
- Return the brand's id (uuid)
- Cache brand ids in a Map so repeated calls for the same vendor
  don't hit the database again in the same scraper run
- Log: logger.info(`Brand upserted: ${normalizedName}`)

---

FUNCTION: inferProductMeta(title, description, vendor)

- Calls OpenAI chat completions with model: "gpt-4o-mini"
- max_tokens: 150
- temperature: 0

System prompt:
  "You are a fashion retail data classifier. Given a product title,
  description, and brand, return ONLY a valid JSON object with two fields:
  category (string) and style_tags (array of strings, max 5 tags).
  No explanation. No markdown. Raw JSON only."

User prompt:
  "Brand: {vendor}
   Title: {title}
   Description: {description?.slice(0, 400)}"

- Parse the JSON response
- If parsing fails, return { category: null, style_tags: [] }
- Return { category: string|null, style_tags: string[] }

IMPORTANT: Only call this function for NEW products or products whose
title/description has changed. Never call it on an incremental sync
where only price/inventory changed.

---

Export: { upsertBrand, inferProductMeta }

---

BACKTESTING STEP:
1. Write src/test-enrichment.js:
   - Call inferProductMeta with:
     title: "Relaxed Fit Straight Leg Jean"
     description: "100% organic cotton. Mid-rise. Available in multiple washes."
     vendor: "Agolde"
   - Assert that the response is valid JSON
   - Assert that category is a non-empty string
   - Assert that style_tags is an array with at least 1 item
   - Log the full result
   - Call upsertBrand("Acne Studios") twice and assert the same uuid is returned both times (cache hit)
2. Add "test:enrichment": "node src/test-enrichment.js" to package.json scripts