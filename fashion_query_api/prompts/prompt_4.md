Continue building the fashion-query-api Next.js project.

Create src/services/response.js

This module takes raw search results and shapes them into the final API
response envelope. It is the only place response structure is defined.
The frontend uses this shape to decide what to render.

---

RESPONSE ENVELOPE

Every response from POST /api/v1/query must follow this structure:

{
  "ok": true | false,
  "intent": string,              // the classified intent
  "query": string,               // the original raw query
  "sort": string | null,         // sort applied
  "filters": { ... },            // filters that were applied
  "results": {
    "type": string,              // one of: "product_grid" | "store_map" |
                                 //  "availability" | "comparison" | "dual"
    "data": { ... }              // shape depends on type (see below)
  },
  "meta": {
    "total": number,             // total results returned
    "generated_at": string       // ISO timestamp
  }
}

On error:
{
  "ok": false,
  "error": string,
  "query": string
}

---

RESULT DATA SHAPES

type: "product_grid"
  data: {
    products: [
      {
        id, title, description, category,
        price, discounted_price, effective_price,
        images,
        brand: { name },
        store: { name, city, state, lat, lng }
      }
    ]
  }

type: "store_map"
  data: {
    stores: [
      {
        id, name, city, state, lat, lng,
        brand_name,
        product_count,
        sample_images
      }
    ]
  }

type: "availability"
  data: {
    available: boolean,
    store_name: string | null,
    city: string | null,
    brand_name: string | null,
    sample_images: string[]
  }

type: "comparison"
  data: {
    brand_a: {
      name: string,
      products: [ { id, title, price, discounted_price, effective_price, images, category } ]
    },
    brand_b: {
      name: string,
      products: [ { id, title, price, discounted_price, effective_price, images, category } ]
    }
  }

type: "dual"  (for ambiguous intent)
  data: {
    product_grid: { products: [ ... ] },  // same shape as product_grid.data
    store_map:    { stores:   [ ... ] }   // same shape as store_map.data
  }

---

FUNCTIONS

shapeProductGrid(rawRows)
  Maps raw match_products RPC rows into the product_grid data shape.

shapeStoreMap(rawRows)
  Maps raw findStores rows into the store_map data shape.

shapeAvailability(rawResult)
  Maps raw availability_check result into the availability data shape.

shapeComparison(rawResult)
  Maps { brand_a, brand_b } raw data into the comparison data shape.

shapeDual(productRows, storeRows)
  Combines both into the dual data shape.

buildResponse(classifiedIntent, shapedData, resultType)
  Assembles the full envelope:
  - ok: true
  - intent, query, sort, filters from classifiedIntent
  - results: { type: resultType, data: shapedData }
  - meta: { total, generated_at: new Date().toISOString() }
  total = array length for product_grid / store_map / dual,
          1 for availability and comparison

buildErrorResponse(queryString, errorMessage)
  Returns: { ok: false, error: errorMessage, query: queryString }

Export: {
  shapeProductGrid, shapeStoreMap, shapeAvailability,
  shapeComparison, shapeDual,
  buildResponse, buildErrorResponse
}

---

BACKTESTING

Create src/services/response.test.js

1. Call shapeProductGrid with 3 mock raw rows (invent plausible data)
   Assert: result.products is array of length 3, each has id, title,
   effective_price, brand.name, store.name

2. Call buildResponse with a mock classifiedIntent and mock shaped data
   Assert: response has ok: true, intent, query, results.type, results.data,
   meta.generated_at

3. Call buildErrorResponse("test query", "something went wrong")
   Assert: response has ok: false, error, query

Add script:
  "test:response": "node src/services/response.test.js"