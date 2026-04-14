// Intents
export const INTENTS = {
  PRODUCT_SEARCH:   "product_search",
  STORE_FINDER:     "store_finder",
  AVAILABILITY:     "availability_check",
  COMPARISON:       "price_comparison",
  SIMILAR_PRODUCTS: "similar_products",
  BRAND_SIMILARITY: "brand_similarity",
  AMBIGUOUS:        "ambiguous",
};

// Sort options
export const SORT_OPTIONS = {
  RELEVANCE:   "relevance",
  DISCOUNT:    "discount",
  PRICE_ASC:   "price_asc",
  PRICE_DESC:  "price_desc",
};

// Defaults
export const DEFAULT_SORT    = SORT_OPTIONS.RELEVANCE;
export const EMBEDDING_DIM   = 1536;
export const PRICE_AROUND_BUFFER = 50; // ± buffer for "around $X" queries
