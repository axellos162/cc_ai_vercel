export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const apiUrl = process.env.FASHION_QUERY_API_URL || 'http://localhost:3001';
    const response = await fetch(`${apiUrl}/api/v1/products?${searchParams.toString()}`);

    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('Products proxy error:', err);
    return new Response(
      JSON.stringify({ ok: false, results: { data: { products: [] } }, error: 'Failed to connect to API.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
