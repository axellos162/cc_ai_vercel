Continue building the fashion-query-api Next.js project.

Create src/app/api/v1/query/route.js

This is the single API endpoint. It accepts POST requests and orchestrates
the classifier → search → response pipeline.

---

ROUTE SETUP

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

---

REQUEST SHAPE

POST /api/v1/query
Content-Type: application/json

{
  "query": string,         // required — the natural language query
  "sort":  string | null   // optional — overrides classifier sort if provided
                           // one of: "relevance" | "discount" | "price_asc" | "price_desc"
}

---

HANDLER: POST(request)

Steps:

1. Parse the request body. If body is invalid JSON or "query" is missing or
   empty string, return HTTP 400 with buildErrorResponse(query, "query is required").

2. Validate "sort" if provided. If it is not one of the SORT_OPTIONS values,
   return HTTP 400 with buildErrorResponse(query, "invalid sort option").

3. Call classifyQuery(query). If it throws, return HTTP 500.

4. If a sort was provided in the request body, override classifiedIntent.sort
   with it. The client's explicit sort always takes precedence over the
   classifier's inferred sort.

5. Branch on intent:

   PRODUCT_SEARCH:
     - Call searchProducts(classifiedIntent)
     - Shape with shapeProductGrid(rows)
     - Return buildResponse(classifiedIntent, shaped, "product_grid") HTTP 200

   STORE_FINDER:
     - Call findStores(classifiedIntent)
     - Shape with shapeStoreMap(rows)
     - Return buildResponse(classifiedIntent, shaped, "store_map") HTTP 200

   AVAILABILITY_CHECK:
     - Call findStores(classifiedIntent)  ← findStores handles availability logic
     - Shape with shapeAvailability(result)
     - Return buildResponse(classifiedIntent, shaped, "availability") HTTP 200

   PRICE_COMPARISON:
     - Call compareProducts(classifiedIntent)
     - Shape with shapeComparison(result)
     - Return buildResponse(classifiedIntent, shaped, "comparison") HTTP 200

   AMBIGUOUS:
     - Call searchProducts(classifiedIntent) and findStores(classifiedIntent)
       IN PARALLEL using Promise.all
     - Shape with shapeDual(productRows, storeRows)
     - Return buildResponse(classifiedIntent, shaped, "dual") HTTP 200

6. Wrap the entire handler body in try/catch.
   On any unhandled error: log the error server-side, return HTTP 500 with
   buildErrorResponse(query, "internal server error").

7. Set the following response headers on every response:
   Content-Type: application/json
   X-Query-Intent: {classifiedIntent.intent}

---

CORS

Add an OPTIONS handler that returns HTTP 204 with these headers:
  Access-Control-Allow-Origin: *
  Access-Control-Allow-Methods: POST, OPTIONS
  Access-Control-Allow-Headers: Content-Type

This makes the API usable from any frontend client.

---

FINAL INTEGRATION BACKTESTING

Start the dev server: npm run dev

Run each of the following curl commands and verify the response shape manually.

1. PRODUCT SEARCH
   curl -X POST http://localhost:3000/api/v1/query \
     -H "Content-Type: application/json" \
     -d '{"query": "find me jeans"}'
   Expected: ok=true, intent="product_search", results.type="product_grid",
   results.data.products is non-empty array

2. PRODUCT SEARCH WITH PRICE FILTER
   curl -X POST http://localhost:3000/api/v1/query \
     -H "Content-Type: application/json" \
     -d '{"query": "find me jeans under $200"}'
   Expected: same as above, every product effective_price <= 200

3. PRODUCT SEARCH WITH CLIENT SORT OVERRIDE
   curl -X POST http://localhost:3000/api/v1/query \
     -H "Content-Type: application/json" \
     -d '{"query": "find me jeans", "sort": "discount"}'
   Expected: ok=true, sort="discount" in response

4. STORE FINDER
   curl -X POST http://localhost:3000/api/v1/query \
     -H "Content-Type: application/json" \
     -d '{"query": "which stores in austin carry agolde"}'
   Expected: ok=true, intent="store_finder", results.type="store_map",
   every store has lat and lng

5. AVAILABILITY CHECK
   curl -X POST http://localhost:3000/api/v1/query \
     -H "Content-Type: application/json" \
     -d '{"query": "does any store in san francisco carry toteme"}'
   Expected: ok=true, intent="availability_check", results.type="availability",
   results.data.available is boolean

6. PRICE COMPARISON
   curl -X POST http://localhost:3000/api/v1/query \
     -H "Content-Type: application/json" \
     -d '{"query": "which is cheaper, toteme or agolde"}'
   Expected: ok=true, intent="price_comparison", results.type="comparison",
   results.data has brand_a and brand_b each with products array

7. AMBIGUOUS QUERY
   curl -X POST http://localhost:3000/api/v1/query \
     -H "Content-Type: application/json" \
     -d '{"query": "good denim in los angeles"}'
   Expected: ok=true, intent="ambiguous", results.type="dual",
   results.data has both product_grid and store_map

8. INVALID REQUEST
   curl -X POST http://localhost:3000/api/v1/query \
     -H "Content-Type: application/json" \
     -d '{}'
   Expected: HTTP 400, ok=false, error="query is required"

9. INVALID SORT
   curl -X POST http://localhost:3000/api/v1/query \
     -H "Content-Type: application/json" \
     -d '{"query": "jeans", "sort": "random"}'
   Expected: HTTP 400, ok=false, error="invalid sort option"

All 9 checks must pass before Phase 1 is considered complete.