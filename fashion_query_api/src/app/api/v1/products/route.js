export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { supabase } from '../../../../lib/db.js';
import { searchProducts } from '../../../../services/search.js';
import { shapeProductGrid, buildResponse } from '../../../../services/response.js';
import { INTENTS } from '../../../../lib/constants.js';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const brand = searchParams.get('brand');
    const storeName = searchParams.get('store');
    const storeId = searchParams.get('store_id');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // store_id path: direct DB lookup, no brand or vector search required
    if (storeId) {
      let query = supabase
        .from('products')
        .select('id, title, price, discounted_price, images, category, brands(name)')
        .eq('store_id', storeId)
        .limit(limit);

      if (category) {
        query = query.ilike('category', `%${category}%`);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Product lookup failed: ${error.message}`);
      }

      const products = (data || []).map(p => ({
        id: p.id,
        title: p.title,
        price: p.price,
        discounted_price: p.discounted_price,
        images: p.images || [],
        category: p.category,
        brand_name: p.brands?.name || null
      }));

      const envelope = {
        ok: true,
        results: { type: 'product_grid', data: { products } },
        meta: { total: products.length, generated_at: new Date().toISOString() }
      };

      return new Response(JSON.stringify(envelope), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    }

    // brand + store path: vector search (original chat-result behavior)
    if (!brand) {
      return new Response(
        JSON.stringify({ ok: false, error: 'brand or store_id parameter is required' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    if (!storeName) {
      return new Response(
        JSON.stringify({ ok: false, error: 'store parameter is required when using brand' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    // Build classification intent (bypass GPT-4o)
    const classifiedIntent = {
      intent: INTENTS.PRODUCT_SEARCH,
      filters: {
        brand: brand,
        category: category || null,
        city: null,
        state: null,
        price_min: null,
        price_max: null,
        price_around: null
      },
      sort: 'relevance',
      raw_query: `${brand} at ${storeName}${category ? ` (${category})` : ''}`
    };

    // Use existing search function
    const productRows = await searchProducts(classifiedIntent);

    // Filter by store_name on the backend
    const storeProducts = productRows.filter(row => row.store_name === storeName);

    // Limit results
    const limitedProducts = storeProducts.slice(0, limit);

    // Shape the response
    const shapedData = shapeProductGrid(limitedProducts);
    const response = buildResponse(classifiedIntent, shapedData, 'product_grid');

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      }
    );

  } catch (error) {
    console.error('Direct products endpoint error:', error);
    
    return new Response(
      JSON.stringify({ ok: false, error: error.message || 'Internal server error' }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
}

// Handle CORS preflight
export async function OPTIONS(request) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
