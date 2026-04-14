export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { classifyQuery } from '../../../../services/classifier.js';
import { searchProducts, findStores, compareProducts, searchSimilarProducts, searchSimilarBrands } from '../../../../services/search.js';
import {
  shapeProductGrid,
  shapeStoreMap,
  shapeAvailability,
  shapeComparison,
  shapeDual,
  shapeBrandSimilarity,
  buildResponse,
  buildErrorResponse
} from '../../../../services/response.js';
import { INTENTS, SORT_OPTIONS } from '../../../../lib/constants.js';

export async function POST(request) {
  let query = '';
  
  try {
    const body = await request.json();
    query = body.query;
    const context = body.context;

    if (!query || typeof query !== 'string' || query.trim() === '') {
      return new Response(
        JSON.stringify(buildErrorResponse(query || '', 'query is required')),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
          }
        }
      );
    }

    if (body.sort !== undefined && body.sort !== null) {
      const validSorts = Object.values(SORT_OPTIONS);
      if (!validSorts.includes(body.sort)) {
        return new Response(
          JSON.stringify(buildErrorResponse(query, 'invalid sort option')),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type'
            }
          }
        );
      }
    }

    // Validate context structure if provided
    if (context !== undefined && context !== null) {
      if (!context.previous_product_ids || !Array.isArray(context.previous_product_ids)) {
        return new Response(
          JSON.stringify(buildErrorResponse(query, 'invalid context: previous_product_ids must be an array')),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type'
            }
          }
        );
      }
      // Validate UUIDs format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      for (const id of context.previous_product_ids) {
        if (!uuidRegex.test(id)) {
          return new Response(
            JSON.stringify(buildErrorResponse(query, 'invalid context: product IDs must be valid UUIDs')),
            {
              status: 400,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
              }
            }
          );
        }
      }
    }

    const classifiedIntent = await classifyQuery(query, context);
    
    if (body.sort) {
      classifiedIntent.sort = body.sort;
    }
    
    let shapedData;
    let resultType;
    
    switch (classifiedIntent.intent) {
      case INTENTS.PRODUCT_SEARCH: {
        const productRows = await searchProducts(classifiedIntent);
        shapedData = shapeProductGrid(productRows);
        resultType = 'product_grid';
        break;
      }

      case INTENTS.SIMILAR_PRODUCTS: {
        try {
          const similarRows = await searchSimilarProducts(classifiedIntent, context);
          shapedData = shapeProductGrid(similarRows);
          resultType = 'product_grid';
        } catch (error) {
          // Fallback to regular product search if similarity fails
          console.error('Similar products search failed, falling back to product search:', error);
          const productRows = await searchProducts(classifiedIntent);
          shapedData = shapeProductGrid(productRows);
          resultType = 'product_grid';
        }
        break;
      }

      case INTENTS.BRAND_SIMILARITY: {
        // Validate that a brand is specified
        if (!classifiedIntent.filters.brand) {
          throw new Error('Brand similarity requires a brand name');
        }

        const similarBrands = await searchSimilarBrands(
          classifiedIntent.filters.brand,
          {
            city: classifiedIntent.filters.city,
            state: classifiedIntent.filters.state
          }
        );

        shapedData = shapeBrandSimilarity(similarBrands);
        resultType = 'brand_similarity';
        break;
      }

      case INTENTS.STORE_FINDER: {
        const storeRows = await findStores(classifiedIntent);
        shapedData = shapeStoreMap(storeRows, classifiedIntent.filters);
        resultType = 'store_map';
        break;
      }

      case INTENTS.AVAILABILITY: {
        const availabilityResult = await findStores(classifiedIntent);
        shapedData = shapeAvailability(availabilityResult);
        resultType = 'availability';
        break;
      }

      case INTENTS.COMPARISON: {
        const comparisonResult = await compareProducts(classifiedIntent);
        shapedData = shapeComparison(comparisonResult);
        resultType = 'comparison';
        break;
      }

      case INTENTS.AMBIGUOUS: {
        const [productRows, storeRows] = await Promise.all([
          searchProducts(classifiedIntent),
          findStores(classifiedIntent)
        ]);
        shapedData = shapeDual(productRows, storeRows, classifiedIntent.filters);
        resultType = 'dual';
        break;
      }

      default: {
        throw new Error(`Unknown intent: ${classifiedIntent.intent}`);
      }
    }
    
    const response = buildResponse(classifiedIntent, shapedData, resultType);
    
    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Query-Intent': classifiedIntent.intent,
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      }
    );
    
  } catch (error) {
    console.error('API Error:', error);
    
    return new Response(
      JSON.stringify(buildErrorResponse(query, 'internal server error')),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      }
    );
  }
}

export async function OPTIONS(request) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
