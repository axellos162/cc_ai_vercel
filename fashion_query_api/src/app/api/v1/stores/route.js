export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { getStoresByCity } from '../../../../services/search.js';

/**
 * GET /api/v1/stores?city=...&state=...
 * Returns all stores for a specific city
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    const state = searchParams.get('state');

    if (!city) {
      return new Response(
        JSON.stringify({ ok: false, error: 'city parameter is required' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    const stores = await getStoresByCity(city, state);

    return new Response(
      JSON.stringify({ ok: true, stores }),
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
    console.error('Stores endpoint error:', error);

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
