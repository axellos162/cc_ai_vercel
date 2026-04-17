export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { supabase } from '../../../../lib/db.js';

/**
 * GET /api/v1/cities
 * Returns all cities that have stores, with store count for each
 */
export async function GET(request) {
  try {
    // Query to get distinct cities with store counts
    // Group by city and state, order by store count descending
    const { data, error } = await supabase
      .from('stores')
      .select('city, state')

    if (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return new Response(
        JSON.stringify({ ok: true, cities: [] }),
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
    }

    // Group by city/state and count stores
    const cityMap = new Map();
    data.forEach(store => {
      const key = `${store.city},${store.state}`;
      if (!cityMap.has(key)) {
        cityMap.set(key, {
          city: store.city,
          state: store.state,
          store_count: 0
        });
      }
      cityMap.get(key).store_count++;
    });

    // Convert to array and sort by store count (descending)
    const cities = Array.from(cityMap.values()).sort((a, b) => b.store_count - a.store_count);

    return new Response(
      JSON.stringify({ ok: true, cities }),
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
    console.error('Cities endpoint error:', error);

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
