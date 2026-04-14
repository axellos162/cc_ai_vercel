Continue building the fashion-query-api Next.js project.

Create src/services/classifier.js

This module takes a raw natural language query string and returns a structured
intent object that drives all downstream search logic.

---

FUNCTION: classifyQuery(queryString)

- Calls the OpenAI chat completions API
- Uses the CHAT_MODEL constant imported from src/lib/openai.js
- temperature: 0
- max_tokens: 300

System prompt (use exactly this):
"""
You are a fashion retail search intent classifier. Given a user query, return
ONLY a valid JSON object. No markdown, no explanation, no code fences.

The JSON must follow this schema exactly:
{
  "intent": one of: "product_search" | "store_finder" | "availability_check" | "price_comparison" | "ambiguous",
  "filters": {
    "brand": string | null,
    "brands": string[] | null,         // for price_comparison with 2+ brands
    "category": string | null,
    "city": string | null,
    "state": string | null,
    "price_min": number | null,
    "price_max": number | null,
    "price_around": number | null      // for "around $X" — caller applies ± buffer
  },
  "sort": one of: "relevance" | "discount" | "price_asc" | "price_desc" | null,
  "raw_query": string                  // the original query, unchanged
}

Intent classification rules:
- "product_search": user wants to find/browse products. e.g. "find me acne studios jeans in SF"
- "store_finder": user wants to know which stores carry a brand. e.g. "which stores in Austin carry Agolde"
- "availability_check": user asks if a specific store carries a brand. e.g. "does Nordstrom SF carry Toteme"
- "price_comparison": user wants to compare prices between two brands. e.g. "which is cheaper, Toteme or Agolde"
- "ambiguous": query could reasonably be product_search OR store_finder. e.g. "good denim in LA"

Price extraction rules:
- "under $200" or "less than $200" → price_max: 200, price_min: null
- "over $100" or "more than $100" → price_min: 100, price_max: null
- "around $250" or "about $250" → price_around: 250 (NOT price_min/price_max)
- "$100 to $200" or "between $100 and $200" → price_min: 100, price_max: 200
- No price mentioned → all price fields null

Brand extraction rules:
- For price_comparison, extract both brands into the "brands" array
- For all other intents, put the single brand in "brand"
- Normalise brand names to title case
- If no brand is mentioned, set brand/brands to null
"""

User prompt: the raw queryString passed to the function.

- Parse the JSON response
- If parsing fails, return a safe fallback:
  {
    intent: INTENTS.AMBIGUOUS,
    filters: { brand: null, brands: null, category: null, city: null,
               state: null, price_min: null, price_max: null, price_around: null },
    sort: null,
    raw_query: queryString
  }
- Import INTENTS and SORT_OPTIONS from src/lib/constants.js
- Validate that the returned intent is one of the values in INTENTS.
  If not, fall back to INTENTS.AMBIGUOUS.
- Return the parsed + validated object

Export: { classifyQuery }

---

BACKTESTING

Create src/services/classifier.test.js

Test the following queries and assert the expected intent and key filters.
Log PASS or FAIL for each. Exit 0 if all pass, exit 1 if any fail.

Test cases:
  1. "find me acne studios jeans in san francisco"
     → intent: product_search, brand: "Acne Studios", category includes "jean",
       city: "San Francisco"

  2. "which stores in austin carry agolde"
     → intent: store_finder, brand: "Agolde", city: "Austin"

  3. "does nordstrom san francisco carry toteme"
     → intent: availability_check, brand: "Toteme", city: "San Francisco"

  4. "which is cheaper, toteme or agolde"
     → intent: price_comparison, brands includes "Toteme" and "Agolde"

  5. "good denim stores in LA"
     → intent: ambiguous

  6. "find me jeans under $200 in new york"
     → intent: product_search, price_max: 200, city: "New York"

  7. "find me jeans around $250"
     → intent: product_search, price_around: 250,
       price_min: null, price_max: null

  8. "show me discounted dresses in chicago"
     → intent: product_search, sort: "discount"

Add script to package.json:
  "test:classifier": "node src/services/classifier.test.js"