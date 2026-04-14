import { supabase } from '../lib/db.js';
import { openai, EMBEDDING_MODEL } from '../lib/openai.js';
import { INTENTS, SORT_OPTIONS, DEFAULT_SORT, PRICE_AROUND_BUFFER } from '../lib/constants.js';

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

export async function searchProducts(classifiedIntent) {
  const { filters, sort, raw_query } = classifiedIntent;
  
  const embedding = await generateQueryEmbedding(raw_query);
  
  let priceMin = filters.price_min;
  let priceMax = filters.price_max;
  
  if (filters.price_around !== null && filters.price_around !== undefined) {
    priceMin = filters.price_around - PRICE_AROUND_BUFFER;
    priceMax = filters.price_around + PRICE_AROUND_BUFFER;
  }
  
  const { data, error } = await supabase.rpc('match_products', {
    query_embedding: embedding,
    filter_brand: filters.brand || null,
    filter_category: filters.category || null,
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

export async function findStores(classifiedIntent) {
  const { filters, intent } = classifiedIntent;
  
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
  
  if (filters.category) {
    query = query.ilike('category', `%${filters.category}%`);
  }
  
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
