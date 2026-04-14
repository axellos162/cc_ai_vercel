export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Proxy to the real fashion_query_api
// The API should be running on http://localhost:3001
export async function POST(request) {
  try {
    const body = await request.json();
    
    // Forward the request to the fashion_query_api
    const apiUrl = process.env.FASHION_QUERY_API_URL || 'http://localhost:3001';
    const response = await fetch(`${apiUrl}/api/v1/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    return new Response(
      JSON.stringify(data),
      {
        status: response.status,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (err) {
    console.error('Proxy error:', err);
    return new Response(
      JSON.stringify({
        ok: false,
        query: '',
        error: 'Failed to connect to API. Make sure fashion_query_api is running on port 3001.'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}
