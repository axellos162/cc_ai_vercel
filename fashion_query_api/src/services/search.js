import { supabase } from '../lib/db.js';
import { openai, EMBEDDING_MODEL } from '../lib/openai.js';
import { INTENTS, SORT_OPTIONS, DEFAULT_SORT, PRICE_AROUND_BUFFER, CATEGORY_HIERARCHY, FOOTWEAR_SUBCATEGORIES, SPECIFIC_CATEGORY_MAPPING } from '../lib/constants.js';

async function generateQueryEmbedding(queryString) {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: queryString,
  });

  if (!response.data || !response.data[0] || !response.data[0].embedding) {
    throw new Error('Failed to generate embedding: Invalid response from OpenAI');
  }

  return response.data[0].embedding;
}

/**
 * Expands parent categories to their child categories.
 * E.g., "shoes" expands to ["boots", "sandals", "sneakers", ...]
 * Specific categories like "boots" return as single-item array ["boots"]
 */
function expandCategory(category) {
  if (!category) return null;

  const lowerCategory = category.toLowerCase();

  // Check if this is a parent category
  if (CATEGORY_HIERARCHY[lowerCategory]) {
    return CATEGORY_HIERARCHY[lowerCategory];
  }

  // Otherwise, return as single-item array
  return [category];
}

export async function searchProducts(classifiedIntent) {
  const { filters, sort, raw_query } = classifiedIntent;

  const embedding = await generateQueryEmbedding(raw_query);

  let priceMin = filters.price_min;
  let priceMax = filters.price_max;

  if (filters.price_around !== null && filters.price_around !== undefined) {
    priceMin = filters.price_around - PRICE_AROUND_BUFFER;
    priceMax = filters.price_around + PRICE_AROUND_BUFFER;
  }

  // Expand category if it's a parent category
  const categories = expandCategory(filters.category);

  // Check if this is a specific category (not a parent in CATEGORY_HIERARCHY)
  // If so, use semantic search without category filter
  const isSpecificCategory = filters.category &&
                              categories &&
                              categories.length === 1 &&
                              !CATEGORY_HIERARCHY[filters.category.toLowerCase()];

  if (isSpecificCategory) {
    const lowerCategory = filters.category.toLowerCase();

    // Determine the category filter to use
    let categoryFilter = null;

    // Check if this is a footwear subcategory
    if (FOOTWEAR_SUBCATEGORIES.includes(lowerCategory)) {
      categoryFilter = 'footwear';
      console.log(`Using semantic search for footwear subcategory: ${filters.category} (within footwear)`);
    }
    // Check if this is in the specific category mapping
    else if (SPECIFIC_CATEGORY_MAPPING[lowerCategory]) {
      categoryFilter = SPECIFIC_CATEGORY_MAPPING[lowerCategory];
      console.log(`Using semantic search for specific category: ${filters.category} (within ${categoryFilter})`);
    }
    // Otherwise, use no category filter (semantic search across all products)
    else {
      console.log(`Using semantic search for category: ${filters.category} (no category filter)`);
    }

    // Search with the determined category filter
    const { data, error } = await supabase.rpc('match_products', {
      query_embedding: embedding,
      filter_brand: filters.brand || null,
      filter_category: categoryFilter,
      filter_city: filters.city || null,
      filter_state: filters.state || null,
      price_min: priceMin,
      price_max: priceMax,
      sort_by: sort || DEFAULT_SORT,
      match_count: 40
    });

    if (error) {
      throw new Error(`Product search failed: ${error.message}`);
    }

    return data || [];
  }

  // If category expands to multiple categories, fetch in parallel and merge
  if (categories && categories.length > 1) {
    console.log(`Expanding category "${filters.category}" to: ${categories.join(', ')}`);

    const fetchPromises = categories.map(category =>
      supabase.rpc('match_products', {
        query_embedding: embedding,
        filter_brand: filters.brand || null,
        filter_category: category,
        filter_city: filters.city || null,
        filter_state: filters.state || null,
        price_min: priceMin,
        price_max: priceMax,
        sort_by: sort || DEFAULT_SORT,
        match_count: 40
      })
    );

    const results = await Promise.all(fetchPromises);

    // Merge and deduplicate by product_id
    const allProducts = new Map();
    for (const { data, error } of results) {
      if (error) {
        console.error('Category search error:', error);
        continue;
      }
      if (data) {
        data.forEach(product => {
          // Only add if not already present (first occurrence wins)
          if (!allProducts.has(product.product_id)) {
            allProducts.set(product.product_id, product);
          }
        });
      }
    }

    // Convert back to array and limit to 40 results
    return Array.from(allProducts.values()).slice(0, 40);
  } else {
    // Single category or no category - use existing logic
    const { data, error } = await supabase.rpc('match_products', {
      query_embedding: embedding,
      filter_brand: filters.brand || null,
      filter_category: categories ? categories[0] : null,
      filter_city: filters.city || null,
      filter_state: filters.state || null,
      price_min: priceMin,
      price_max: priceMax,
      sort_by: sort || DEFAULT_SORT,
      match_count: 40
    });

    if (error) {
      throw new Error(`Product search failed: ${error.message}`);
    }

    return data || [];
  }
}

export async function findStores(classifiedIntent) {
  const { filters, intent } = classifiedIntent;

  // Expand category if it's a parent category
  const categories = expandCategory(filters.category);

  // Check if this is a specific category (not a parent in CATEGORY_HIERARCHY)
  // For specific categories, don't filter by category - SQL query without category filter
  const isSpecificCategory = filters.category &&
                              categories &&
                              categories.length === 1 &&
                              !CATEGORY_HIERARCHY[filters.category.toLowerCase()];

  let specificCategoryFilter = null;
  if (isSpecificCategory) {
    const lowerCategory = filters.category.toLowerCase();

    // Determine the category filter to use
    if (FOOTWEAR_SUBCATEGORIES.includes(lowerCategory)) {
      specificCategoryFilter = 'footwear';
      console.log(`Using footwear filter for store search: ${filters.category}`);
    } else if (SPECIFIC_CATEGORY_MAPPING[lowerCategory]) {
      specificCategoryFilter = SPECIFIC_CATEGORY_MAPPING[lowerCategory];
      console.log(`Using ${specificCategoryFilter} filter for store search: ${filters.category}`);
    } else {
      console.log(`No category filter for store search: ${filters.category}`);
    }
  }

  // If category expands to multiple categories, query each and merge
  if (categories && categories.length > 1) {
    console.log(`Expanding category "${filters.category}" in findStores to: ${categories.join(', ')}`);

    const fetchPromises = categories.map(category => {
      let query = supabase
        .from('products')
        .select(`
          store_id,
          stores!inner(id, name, city, state, lat, lng),
          brands!inner(name),
          images
        `);

      if (filters.brand) {
        query = query.ilike('brands.name', filters.brand);
      }

      query = query.ilike('category', `%${category}%`);

      if (filters.city) {
        query = query.ilike('stores.city', filters.city);
      }

      if (filters.state) {
        query = query.ilike('stores.state', filters.state);
      }

      return query;
    });

    const results = await Promise.all(fetchPromises);

    // Merge all results
    const allData = [];
    for (const { data, error } of results) {
      if (error) {
        console.error('Category search error in findStores:', error);
        continue;
      }
      if (data) {
        allData.push(...data);
      }
    }

    const data = allData;

    // Continue with existing logic for processing the data
    if (intent === INTENTS.AVAILABILITY) {
      const available = data && data.length > 0;
      const sampleImages = [];

      if (available && data.length > 0) {
        for (const row of data.slice(0, 6)) {
          if (row.images && row.images.length > 0) {
            sampleImages.push(row.images[0]);
            if (sampleImages.length >= 6) break;
          }
        }
      }

      return {
        available,
        store_name: available && data[0]?.stores?.name ? data[0].stores.name : null,
        city: available && data[0]?.stores?.city ? data[0].stores.city : null,
        brand_name: available && data[0]?.brands?.name ? data[0].brands.name : null,
        sample_images: sampleImages
      };
    }

    const storeMap = new Map();

    for (const row of data) {
      if (!row.stores) continue;

      const storeId = row.stores.id;
      const brandName = row.brands?.name || 'Unknown';
      const key = `${storeId}-${brandName}`;

      if (!storeMap.has(key)) {
        storeMap.set(key, {
          store_id: storeId,
          store_name: row.stores.name,
          city: row.stores.city,
          state: row.stores.state,
          lat: row.stores.lat,
          lng: row.stores.lng,
          brand_name: brandName,
          product_count: 0,
          sample_images: []
        });
      }

      const entry = storeMap.get(key);
      entry.product_count++;

      if (entry.sample_images.length < 3 && row.images && row.images.length > 0) {
        entry.sample_images.push(row.images[0]);
      }
    }

    return Array.from(storeMap.values());
  }

  // Single category or no category - use existing logic
  let query = supabase
    .from('products')
    .select(`
      store_id,
      stores!inner(id, name, city, state, lat, lng),
      brands!inner(name),
      images
    `);

  if (filters.brand) {
    query = query.ilike('brands.name', filters.brand);
  }

  // Apply category filter
  if (categories && categories.length === 1 && !isSpecificCategory) {
    // Parent category - use expansion result
    query = query.ilike('category', `%${categories[0]}%`);
  } else if (isSpecificCategory && specificCategoryFilter) {
    // Specific category with a mapped filter
    query = query.ilike('category', `%${specificCategoryFilter}%`);
  }
  // If isSpecificCategory but no specificCategoryFilter, no category filter applied

  if (filters.city) {
    query = query.ilike('stores.city', filters.city);
  }

  if (filters.state) {
    query = query.ilike('stores.state', filters.state);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Store search failed: ${error.message}`);
  }

  if (intent === INTENTS.AVAILABILITY) {
    const available = data && data.length > 0;
    const sampleImages = [];

    if (available && data.length > 0) {
      for (const row of data.slice(0, 6)) {
        if (row.images && row.images.length > 0) {
          sampleImages.push(row.images[0]);
          if (sampleImages.length >= 6) break;
        }
      }
    }

    return {
      available,
      store_name: available && data[0]?.stores?.name ? data[0].stores.name : null,
      city: available && data[0]?.stores?.city ? data[0].stores.city : null,
      brand_name: available && data[0]?.brands?.name ? data[0].brands.name : null,
      sample_images: sampleImages
    };
  }

  const storeMap = new Map();

  for (const row of data) {
    if (!row.stores) continue;

    const storeId = row.stores.id;
    const brandName = row.brands?.name || 'Unknown';
    const key = `${storeId}-${brandName}`;

    if (!storeMap.has(key)) {
      storeMap.set(key, {
        store_id: storeId,
        store_name: row.stores.name,
        city: row.stores.city,
        state: row.stores.state,
        lat: row.stores.lat,
        lng: row.stores.lng,
        brand_name: brandName,
        product_count: 0,
        sample_images: []
      });
    }

    const entry = storeMap.get(key);
    entry.product_count++;

    if (entry.sample_images.length < 3 && row.images && row.images.length > 0) {
      entry.sample_images.push(row.images[0]);
    }
  }

  return Array.from(storeMap.values());
}

export async function findStoresByMultipleBrands(classifiedIntent, brandNames) {
  const { filters } = classifiedIntent;

  if (!brandNames || brandNames.length === 0) {
    return [];
  }

  // Expand category if it's a parent category
  const categories = expandCategory(filters.category);

  // Check if this is a specific category (not a parent in CATEGORY_HIERARCHY)
  const isSpecificCategory = filters.category &&
                              categories &&
                              categories.length === 1 &&
                              !CATEGORY_HIERARCHY[filters.category.toLowerCase()];

  let specificCategoryFilter = null;
  if (isSpecificCategory) {
    const lowerCategory = filters.category.toLowerCase();

    // Determine the category filter to use
    if (FOOTWEAR_SUBCATEGORIES.includes(lowerCategory)) {
      specificCategoryFilter = 'footwear';
      console.log(`Using footwear filter for multi-brand store search: ${filters.category}`);
    } else if (SPECIFIC_CATEGORY_MAPPING[lowerCategory]) {
      specificCategoryFilter = SPECIFIC_CATEGORY_MAPPING[lowerCategory];
      console.log(`Using ${specificCategoryFilter} filter for multi-brand store search: ${filters.category}`);
    } else {
      console.log(`No category filter for multi-brand store search: ${filters.category}`);
    }
  }

  // If category expands to multiple categories, query each and merge
  if (categories && categories.length > 1) {
    console.log(`Expanding category "${filters.category}" in findStoresByMultipleBrands to: ${categories.join(', ')}`);

    const fetchPromises = categories.map(category => {
      let query = supabase
        .from('products')
        .select(`
          store_id,
          stores!inner(id, name, city, state, lat, lng, domain),
          brands!inner(name),
          images
        `);

      // Filter by brands (using OR logic via .in())
      query = query.in('brands.name', brandNames);

      query = query.ilike('category', `%${category}%`);

      // Apply location filters if specified
      if (filters.city) {
        query = query.ilike('stores.city', filters.city);
      }

      if (filters.state) {
        query = query.ilike('stores.state', filters.state);
      }

      return query;
    });

    const results = await Promise.all(fetchPromises);

    // Merge all results
    const allData = [];
    for (const { data, error } of results) {
      if (error) {
        console.error('Category search error in findStoresByMultipleBrands:', error);
        continue;
      }
      if (data) {
        allData.push(...data);
      }
    }

    const data = allData;

    // Continue with existing aggregation logic
    const storeMap = new Map();

    for (const row of data) {
      if (!row.stores) continue;

      const storeId = row.stores.id;
      const brandName = row.brands?.name;

      if (!storeMap.has(storeId)) {
        storeMap.set(storeId, {
          id: storeId,
          store_id: storeId,
          name: row.stores.name,
          store_name: row.stores.name,
          city: row.stores.city,
          state: row.stores.state,
          lat: row.stores.lat,
          lng: row.stores.lng,
          domain: row.stores.domain,
          favorite_brands_carried: [],
          product_count: 0,
          sample_images: []
        });
      }

      const entry = storeMap.get(storeId);

      // Track which favorite brands this store carries
      if (brandName && !entry.favorite_brands_carried.includes(brandName)) {
        entry.favorite_brands_carried.push(brandName);
      }

      entry.product_count++;

      if (entry.sample_images.length < 3 && row.images && row.images.length > 0) {
        entry.sample_images.push(row.images[0]);
      }
    }

    return Array.from(storeMap.values());
  }

  // Single category or no category - use existing logic
  // Query stores that carry ANY of the provided brands
  let query = supabase
    .from('products')
    .select(`
      store_id,
      stores!inner(id, name, city, state, lat, lng, domain),
      brands!inner(name),
      images
    `);

  // Filter by brands (using OR logic via .in())
  query = query.in('brands.name', brandNames);

  // Apply category filter
  if (categories && categories.length === 1 && !isSpecificCategory) {
    // Parent category - use expansion result
    query = query.ilike('category', `%${categories[0]}%`);
  } else if (isSpecificCategory && specificCategoryFilter) {
    // Specific category with a mapped filter
    query = query.ilike('category', `%${specificCategoryFilter}%`);
  }
  // If isSpecificCategory but no specificCategoryFilter, no category filter applied

  // Apply location filters if specified
  if (filters.city) {
    query = query.ilike('stores.city', filters.city);
  }

  if (filters.state) {
    query = query.ilike('stores.state', filters.state);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Multi-brand store search failed: ${error.message}`);
  }

  // Aggregate stores by store_id (not store_id + brand)
  // We want one entry per store, tracking which favorites they carry
  const storeMap = new Map();

  for (const row of data) {
    if (!row.stores) continue;

    const storeId = row.stores.id;
    const brandName = row.brands?.name;

    if (!storeMap.has(storeId)) {
      storeMap.set(storeId, {
        id: storeId,
        store_id: storeId,
        name: row.stores.name,
        store_name: row.stores.name,
        city: row.stores.city,
        state: row.stores.state,
        lat: row.stores.lat,
        lng: row.stores.lng,
        domain: row.stores.domain,
        favorite_brands_carried: [],
        product_count: 0,
        sample_images: []
      });
    }

    const entry = storeMap.get(storeId);

    // Track which favorite brands this store carries
    if (brandName && !entry.favorite_brands_carried.includes(brandName)) {
      entry.favorite_brands_carried.push(brandName);
    }

    entry.product_count++;

    if (entry.sample_images.length < 3 && row.images && row.images.length > 0) {
      entry.sample_images.push(row.images[0]);
    }
  }

  return Array.from(storeMap.values());
}

export async function compareProducts(classifiedIntent) {
  const { filters } = classifiedIntent;

  if (!filters.brands || filters.brands.length < 2) {
    throw new Error('Price comparison requires at least 2 brands');
  }

  const [brandA, brandB] = filters.brands;

  const searchCategory = filters.category || classifiedIntent.raw_query;

  const [resultsA, resultsB] = await Promise.all([
    (async () => {
      const embedding = await generateQueryEmbedding(`${brandA} ${searchCategory}`);
      const { data, error } = await supabase.rpc('match_products', {
        query_embedding: embedding,
        filter_brand: brandA,
        filter_category: filters.category || null,
        filter_city: null,
        filter_state: null,
        price_min: null,
        price_max: null,
        sort_by: 'relevance',
        match_count: 20
      });
      if (error) throw new Error(`Failed to fetch products for ${brandA}: ${error.message}`);
      return data || [];
    })(),
    (async () => {
      const embedding = await generateQueryEmbedding(`${brandB} ${searchCategory}`);
      const { data, error } = await supabase.rpc('match_products', {
        query_embedding: embedding,
        filter_brand: brandB,
        filter_category: filters.category || null,
        filter_city: null,
        filter_state: null,
        price_min: null,
        price_max: null,
        sort_by: 'relevance',
        match_count: 20
      });
      if (error) throw new Error(`Failed to fetch products for ${brandB}: ${error.message}`);
      return data || [];
    })()
  ]);

  return {
    brand_a: { name: brandA, products: resultsA },
    brand_b: { name: brandB, products: resultsB }
  };
}

export async function searchSimilarProducts(classifiedIntent, context) {
  const { filters, sort } = classifiedIntent;

  // Validate context
  if (!context || !context.previous_product_ids || context.previous_product_ids.length === 0) {
    throw new Error('Similar products search requires previous product IDs in context');
  }

  // Build exclude_brands array
  const excludeBrands = [];
  if (classifiedIntent.exclude_brands && Array.isArray(classifiedIntent.exclude_brands)) {
    excludeBrands.push(...classifiedIntent.exclude_brands);
  }
  if (context.previous_brand) {
    excludeBrands.push(context.previous_brand);
  }

  // Resolve price_around to min/max if present
  let priceMin = filters.price_min;
  let priceMax = filters.price_max;

  if (filters.price_around !== null && filters.price_around !== undefined) {
    priceMin = filters.price_around - PRICE_AROUND_BUFFER;
    priceMax = filters.price_around + PRICE_AROUND_BUFFER;
  }

  // BRAND-FIRST APPROACH: If no category specified, use brand similarity
  if (!filters.category && context.previous_brand) {
    console.log(`Using brand similarity approach for ${context.previous_brand} (no category specified)`);

    // Find brands similar to the previous brand
    const similarBrands = await searchSimilarBrands(context.previous_brand, {
      city: filters.city,
      state: filters.state
    });

    if (similarBrands.length > 0) {
      // Get top 5 most similar brands
      const topBrands = similarBrands.slice(0, 5).map(b => b.brand_name);

      // Search products from ONLY these similar brands
      const { data: brandBasedResults, error: brandError } = await supabase.rpc('match_similar_products', {
        source_product_ids: context.previous_product_ids,
        exclude_brands: null, // Don't exclude - we want these similar brands
        filter_category: null,
        filter_city: filters.city || null,
        filter_state: filters.state || null,
        price_min: priceMin,
        price_max: priceMax,
        sort_by: sort || DEFAULT_SORT,
        match_count: 40
      });

      if (!brandError && brandBasedResults && brandBasedResults.length > 0) {
        // Filter to only include products from similar brands
        const filteredResults = brandBasedResults.filter(product =>
          topBrands.includes(product.brand_name)
        );

        if (filteredResults.length > 0) {
          return filteredResults.slice(0, 40);
        }
      }
    }

    // If brand approach failed, fall through to regular vector search
    console.log('Brand similarity approach yielded no results, falling back to vector search');
  }

  // FALLBACK: Regular vector search (category specified OR brand approach failed)
  const { data, error } = await supabase.rpc('match_similar_products', {
    source_product_ids: context.previous_product_ids,
    exclude_brands: excludeBrands.length > 0 ? excludeBrands : null,
    filter_category: filters.category || null,
    filter_city: filters.city || null,
    filter_state: filters.state || null,
    price_min: priceMin,
    price_max: priceMax,
    sort_by: sort || DEFAULT_SORT,
    match_count: 40
  });

  if (error) {
    console.error('Similar products search failed:', error);
    throw new Error(`Similar products search failed: ${error.message}`);
  }

  return data || [];
}

export async function searchSimilarBrands(brandName, filters = {}) {
  const { data, error } = await supabase.rpc('match_similar_brands', {
    source_brand_name: brandName,
    filter_city: filters.city || null,
    filter_state: filters.state || null,
    match_count: 10
  });

  if (error) {
    console.error('Similar brands search failed:', error);
    throw new Error(`Similar brands search failed: ${error.message}`);
  }

  return data || [];
}

/**
 * Fetch all stores for a specific city
 * Used by the Explore view to show store locations
 */
export async function getStoresByCity(city, state = null) {
  let query = supabase
    .from('stores')
    .select('id, name, city, state, lat, lng, domain')
    .ilike('city', city);

  if (state) {
    query = query.ilike('state', state);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch stores for ${city}: ${error.message}`);
  }

  // Transform to match expected format (add store_id for consistency)
  return (data || []).map(store => ({
    ...store,
    store_id: store.id,
    store_name: store.name
  }));
}
