export function shapeProductGrid(rawRows) {
  return {
    products: rawRows.map(row => ({
      id: row.product_id,
      title: row.title,
      description: row.description,
      category: row.category,
      price: row.price,
      discounted_price: row.discounted_price,
      effective_price: row.effective_price,
      url: row.url,
      images: row.images,
      brand: {
        name: row.brand_name
      },
      store: {
        name: row.store_name,
        city: row.store_city,
        state: row.store_state,
        lat: row.store_lat,
        lng: row.store_lng
      }
    }))
  };
}

function generateStoreFinderSummary(stores, filters = {}) {
  if (stores.length === 0) {
    return "No stores found matching your criteria.";
  }
  
  // Group stores by brand
  const brandMap = new Map();
  stores.forEach(store => {
    if (!brandMap.has(store.brand_name)) {
      brandMap.set(store.brand_name, []);
    }
    brandMap.get(store.brand_name).push(store.name);
  });
  
  const brands = Array.from(brandMap.keys()).sort();
  const categoryText = filters.category ? ` with ${filters.category}` : '';
  const locationText = filters.city ? ` in ${filters.city}` : (filters.state ? ` in ${filters.state}` : '');
  
  let summary = `Here are ${brands.length} brand${brands.length > 1 ? 's' : ''}${categoryText}${locationText}:\n\n`;
  
  brands.forEach(brand => {
    const storeNames = [...new Set(brandMap.get(brand))];
    summary += `• ${brand} — available at ${storeNames.join(', ')}\n`;
  });
  
  return summary;
}

export function shapeStoreMap(rawRows, filters = {}) {
  // Check if this is a favorites query (stores have favorite_brands_carried)
  const isFavoritesQuery = rawRows.length > 0 &&
    rawRows[0].favorite_brands_carried !== undefined;

  let stores;
  let summary;

  if (isFavoritesQuery) {
    // FAVORITES CASE: Pass through store data as-is (already has correct structure)
    stores = rawRows.map(row => ({
      id: row.id,
      store_id: row.store_id,
      name: row.name,
      city: row.city,
      state: row.state,
      lat: row.lat,
      lng: row.lng,
      domain: row.domain,
      favorite_brands_carried: row.favorite_brands_carried,
      product_count: row.product_count,
      sample_images: row.sample_images
    }));

    // Generate favorites-specific summary
    const city = filters?.city || 'this area';
    const totalBrands = new Set(
      rawRows.flatMap(s => s.favorite_brands_carried || [])
    ).size;
    summary = `Found ${rawRows.length} store${rawRows.length !== 1 ? 's' : ''} carrying ${totalBrands} of your favorite brands in ${city}.`;
  } else {
    // SINGLE-BRAND CASE: Existing logic (reshape data)
    stores = rawRows.map(row => ({
      id: `${row.store_id}-${row.brand_name}`,
      name: row.store_name,
      city: row.city,
      state: row.state,
      lat: row.lat,
      lng: row.lng,
      brand_name: row.brand_name,
      product_count: row.product_count,
      sample_images: row.sample_images
    }));
    summary = generateStoreFinderSummary(stores, filters);
  }

  return {
    stores,
    summary
  };
}

export function shapeAvailability(rawResult) {
  return {
    available: rawResult.available,
    store_name: rawResult.store_name,
    city: rawResult.city,
    brand_name: rawResult.brand_name,
    sample_images: rawResult.sample_images
  };
}

export function shapeComparison(rawResult) {
  return {
    brand_a: {
      name: rawResult.brand_a.name,
      products: rawResult.brand_a.products.map(p => ({
        id: p.product_id,
        title: p.title,
        price: p.price,
        discounted_price: p.discounted_price,
        effective_price: p.effective_price,
        url: p.url,
        images: p.images,
        category: p.category
      }))
    },
    brand_b: {
      name: rawResult.brand_b.name,
      products: rawResult.brand_b.products.map(p => ({
        id: p.product_id,
        title: p.title,
        price: p.price,
        discounted_price: p.discounted_price,
        effective_price: p.effective_price,
        url: p.url,
        images: p.images,
        category: p.category
      }))
    }
  };
}

export function shapeDual(productRows, storeRows, filters = {}) {
  return {
    product_grid: shapeProductGrid(productRows),
    store_map: shapeStoreMap(storeRows, filters)
  };
}

export function buildResponse(classifiedIntent, shapedData, resultType) {
  let total = 1;
  
  if (resultType === 'product_grid') {
    total = shapedData.products?.length || 0;
  } else if (resultType === 'store_map') {
    total = shapedData.stores?.length || 0;
  } else if (resultType === 'dual') {
    total = (shapedData.product_grid?.products?.length || 0) + 
            (shapedData.store_map?.stores?.length || 0);
  }
  
  return {
    ok: true,
    intent: classifiedIntent.intent,
    query: classifiedIntent.raw_query,
    sort: classifiedIntent.sort,
    filters: classifiedIntent.filters,
    results: {
      type: resultType,
      data: shapedData
    },
    meta: {
      total,
      generated_at: new Date().toISOString()
    }
  };
}

export function shapeBrandSimilarity(rawBrands) {
  if (!rawBrands || rawBrands.length === 0) {
    return {
      brands: [],
      summary: "No similar brands found"
    };
  }

  const brands = rawBrands.map(row => ({
    id: row.brand_id,
    name: row.brand_name,
    similarity: Math.round(row.similarity * 100),
    product_count: row.product_count
  }));

  const brandNames = brands.slice(0, 3).map(b => b.name).join(', ');
  const summary = `Found ${brands.length} similar brands including ${brandNames}`;

  return {
    brands,
    summary
  };
}

export function buildErrorResponse(queryString, errorMessage) {
  return {
    ok: false,
    error: errorMessage,
    query: queryString
  };
}
