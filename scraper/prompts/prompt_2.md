Continue building the shopify-scraper project from the previous step.

Create src/shopify.js

This module fetches all products from a Shopify store using the public
/products.json endpoint. It must handle pagination correctly.

---

FUNCTION: fetchAllProducts(domain)

- Takes a Shopify domain string e.g. "storename.myshopify.com"
- Fetches from https://{domain}/products.json
- Shopify returns max 250 products per page
- Paginate using the `page_title` cursor approach:
  First call:  /products.json?limit=250
  Next calls:  /products.json?limit=250&page_title={last_product_title_encoded}
  
  Actually, the correct public API pagination uses `since_id`:
  First call:  /products.json?limit=250
  Next calls:  /products.json?limit=250&since_id={last_product_id}
  Stop when the returned array length is 0.

- Add a 600ms delay between pages to avoid rate limiting (2 req/sec max)
- Log progress: logger.info(`[${domain}] Fetched page ${page}, ${products.length} products`)
- Return a flat array of all raw Shopify product objects

---

FUNCTION: fetchUpdatedProducts(domain, sinceDate)

- sinceDate is a JS Date object
- Fetches /products.json?limit=250&updated_at_min={sinceDate.toISOString()}
- Also paginate with since_id as above
- Returns only products updated after sinceDate
- Log: logger.info(`[${domain}] ${n} products updated since ${sinceDate.toISOString()}`)

---

FUNCTION: extractProductData(rawProduct, storeId)

Takes one raw Shopify product object and returns a normalized object:
{
  shopify_product_id: rawProduct.id,          // bigint
  store_id: storeId,
  vendor: rawProduct.vendor?.trim() || null,   // used as brand name
  title: rawProduct.title?.trim(),
  description: stripHtml(rawProduct.body_html),// strip HTML tags
  price: parseFloat(rawProduct.variants[0]?.price) || null,
  discounted_price: parseFloat(rawProduct.variants[0]?.compare_at_price) || null,
  images: rawProduct.images?.map(i => i.src) || [],
  shopify_updated_at: rawProduct.updated_at,
  variants: rawProduct.variants.map(v => ({
    shopify_variant_id: v.id,
    size: extractSize(v.option1, v.option2, v.option3),
    color: extractColor(v.option1, v.option2, v.option3),
    inventory_count: v.inventory_quantity ?? 0
  }))
}

Helper: stripHtml(html) — remove all HTML tags, decode &amp; &nbsp; etc., return clean text. Handle null/undefined gracefully.

Helper: extractSize(o1, o2, o3) — return whichever option contains a size-like value. Size options typically contain: XS, S, M, L, XL, XXL, numbers like 28, 29, 30, 32, or "One Size". Return the matching option or null.

Helper: extractColor(o1, o2, o3) — return whichever option is NOT a size and NOT "Default Title". Return null if none found.

---

Export: { fetchAllProducts, fetchUpdatedProducts, extractProductData }

---

BACKTESTING STEP:
1. Write a test script src/test-shopify.js that:
   - Imports fetchAllProducts and extractProductData
   - Fetches from this real public Shopify store: "kith.myshopify.com" (or any known public store)
   - Logs the first 3 raw products
   - Runs extractProductData on the first product and logs the result
   - Confirms: shopify_product_id is a number, price is a float or null,
     images is an array, variants is a non-empty array
2. The script must exit cleanly with process.exit(0) on success, process.exit(1) on error
3. Add "test:shopify": "node src/test-shopify.js" to package.json scripts