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

// Category hierarchy - parent categories that should filter broadly
// Categories NOT in this hierarchy will use semantic search (no category filter)
export const CATEGORY_HIERARCHY = {
  'shoes': ['footwear'],    // Generic shoes query → search all footwear
  'footwear': ['footwear']  // Explicit footwear query → search all footwear
};

// Specific footwear categories that should search within footwear (not all products)
// This prevents queries like "boots in new york" from matching "New York" branded non-footwear
export const FOOTWEAR_SUBCATEGORIES = [
  'boots',
  'sneakers',
  'sandals',
  'loafers',
  'mules',
  'slides',
  'clogs',
  'heels',
  'flats'
];

// Map of specific categories to their database category names
// These will search WITH category filter to prevent brand name confusion
export const SPECIFIC_CATEGORY_MAPPING = {
  // Bottoms
  'jeans': 'Jeans',
  'pants': 'Pants',
  'trousers': 'Pants',
  'shorts': 'Shorts',
  'skirts': 'Skirts',

  // Tops
  'shirts': 'Shirts',
  'shirt': 'Shirts',
  't-shirts': 'T-Shirts',
  'tshirts': 'T-Shirts',
  'tees': 'T-Shirts',
  'sweaters': 'Sweaters',
  'sweatshirts': 'Sweatshirts',
  'hoodies': 'Sweatshirts',
  'blouses': 'Blouses',

  // Outerwear
  'jackets': 'Outerwear',
  'jacket': 'Outerwear',
  'coats': 'Outerwear',
  'blazers': 'Blazers',

  // Dresses
  'dresses': 'Dresses',
  'dress': 'Dresses',

  // Accessories
  'bags': 'Bags',
  'hats': 'Hats',
  'scarves': 'Scarves',
  'belts': 'Belts'
};
