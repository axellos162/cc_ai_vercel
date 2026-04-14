import {
  shapeProductGrid,
  shapeStoreMap,
  shapeAvailability,
  shapeComparison,
  shapeDual,
  buildResponse,
  buildErrorResponse
} from './response.js';

function runTests() {
  console.log('Running response service tests...\n');
  
  let allPassed = true;

  // Test 1: shapeProductGrid
  console.log('Test 1: shapeProductGrid');
  try {
    const mockRawRows = [
      {
        product_id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Blue Denim Jeans',
        description: 'Classic blue jeans',
        category: 'jeans',
        price: 150,
        discounted_price: 120,
        effective_price: 120,
        images: ['https://example.com/image1.jpg'],
        brand_name: 'Acme Denim',
        store_name: 'Fashion Store SF',
        store_city: 'San Francisco',
        store_state: 'CA',
        store_lat: 37.7749,
        store_lng: -122.4194
      },
      {
        product_id: '223e4567-e89b-12d3-a456-426614174001',
        title: 'Black Leather Jacket',
        description: 'Genuine leather',
        category: 'jackets',
        price: 350,
        discounted_price: null,
        effective_price: 350,
        images: ['https://example.com/image2.jpg'],
        brand_name: 'Leather Co',
        store_name: 'Fashion Store LA',
        store_city: 'Los Angeles',
        store_state: 'CA',
        store_lat: 34.0522,
        store_lng: -118.2437
      },
      {
        product_id: '323e4567-e89b-12d3-a456-426614174002',
        title: 'White Cotton T-Shirt',
        description: 'Soft cotton tee',
        category: 'tops',
        price: 45,
        discounted_price: 30,
        effective_price: 30,
        images: ['https://example.com/image3.jpg'],
        brand_name: 'Basic Wear',
        store_name: 'Fashion Store NY',
        store_city: 'New York',
        store_state: 'NY',
        store_lat: 40.7128,
        store_lng: -74.0060
      }
    ];
    
    const result = shapeProductGrid(mockRawRows);
    
    if (!result.products || !Array.isArray(result.products)) {
      console.log('  ✗ FAIL: result.products is not an array');
      allPassed = false;
    } else if (result.products.length !== 3) {
      console.log(`  ✗ FAIL: Expected 3 products, got ${result.products.length}`);
      allPassed = false;
    } else {
      const firstProduct = result.products[0];
      const hasRequiredFields = 
        firstProduct.id &&
        firstProduct.title &&
        firstProduct.effective_price !== undefined &&
        firstProduct.brand?.name &&
        firstProduct.store?.name;
      
      if (!hasRequiredFields) {
        console.log('  ✗ FAIL: Missing required fields in product');
        console.log('  First product:', JSON.stringify(firstProduct, null, 2));
        allPassed = false;
      } else {
        console.log('  ✓ PASS: Products array has 3 items with all required fields');
        console.log(`  Sample: "${firstProduct.title}" by ${firstProduct.brand.name} - $${firstProduct.effective_price}`);
      }
    }
  } catch (error) {
    console.log(`  ✗ ERROR: ${error.message}`);
    allPassed = false;
  }

  // Test 2: buildResponse
  console.log('\nTest 2: buildResponse');
  try {
    const mockClassifiedIntent = {
      intent: 'product_search',
      raw_query: 'blue jeans',
      sort: 'relevance',
      filters: {
        brand: null,
        category: 'jeans',
        city: null,
        state: null,
        price_min: null,
        price_max: 200,
        price_around: null
      }
    };
    
    const mockShapedData = {
      products: [
        {
          id: '123',
          title: 'Test Jeans',
          effective_price: 150,
          brand: { name: 'Test Brand' },
          store: { name: 'Test Store' }
        }
      ]
    };
    
    const response = buildResponse(mockClassifiedIntent, mockShapedData, 'product_grid');
    
    const hasRequiredFields =
      response.ok === true &&
      response.intent === 'product_search' &&
      response.query === 'blue jeans' &&
      response.results?.type === 'product_grid' &&
      response.results?.data &&
      response.meta?.generated_at;
    
    if (!hasRequiredFields) {
      console.log('  ✗ FAIL: Missing required fields in response');
      console.log('  Response:', JSON.stringify(response, null, 2));
      allPassed = false;
    } else {
      // Verify generated_at is valid ISO timestamp
      const timestamp = new Date(response.meta.generated_at);
      if (isNaN(timestamp.getTime())) {
        console.log('  ✗ FAIL: generated_at is not a valid ISO timestamp');
        allPassed = false;
      } else {
        console.log('  ✓ PASS: Response has all required fields');
        console.log(`  ok: ${response.ok}, intent: ${response.intent}, type: ${response.results.type}`);
        console.log(`  meta.total: ${response.meta.total}, meta.generated_at: ${response.meta.generated_at}`);
      }
    }
  } catch (error) {
    console.log(`  ✗ ERROR: ${error.message}`);
    allPassed = false;
  }

  // Test 3: buildErrorResponse
  console.log('\nTest 3: buildErrorResponse');
  try {
    const errorResponse = buildErrorResponse('test query', 'something went wrong');
    
    const hasRequiredFields =
      errorResponse.ok === false &&
      errorResponse.error === 'something went wrong' &&
      errorResponse.query === 'test query';
    
    if (!hasRequiredFields) {
      console.log('  ✗ FAIL: Missing required fields in error response');
      console.log('  Response:', JSON.stringify(errorResponse, null, 2));
      allPassed = false;
    } else {
      console.log('  ✓ PASS: Error response has all required fields');
      console.log(`  ok: ${errorResponse.ok}, error: "${errorResponse.error}", query: "${errorResponse.query}"`);
    }
  } catch (error) {
    console.log(`  ✗ ERROR: ${error.message}`);
    allPassed = false;
  }

  // Additional Test: shapeDual
  console.log('\nBonus Test: shapeDual');
  try {
    const mockProductRows = [
      {
        product_id: '456',
        title: 'Dual Test Product',
        description: 'Test',
        category: 'test',
        price: 100,
        discounted_price: null,
        effective_price: 100,
        images: ['test.jpg'],
        brand_name: 'Test',
        store_name: 'Store',
        store_city: 'City',
        store_state: 'ST',
        store_lat: 0,
        store_lng: 0
      }
    ];
    
    const mockStoreRows = [
      {
        store_id: '789',
        store_name: 'Test Store',
        city: 'Test City',
        state: 'TS',
        lat: 0,
        lng: 0,
        brand_name: 'Test Brand',
        product_count: 5,
        sample_images: ['img1.jpg', 'img2.jpg']
      }
    ];
    
    const dualResult = shapeDual(mockProductRows, mockStoreRows);
    
    const hasRequiredStructure =
      dualResult.product_grid?.products?.length === 1 &&
      dualResult.store_map?.stores?.length === 1;
    
    if (!hasRequiredStructure) {
      console.log('  ✗ FAIL: Dual result missing required structure');
      allPassed = false;
    } else {
      console.log('  ✓ PASS: Dual result has both product_grid and store_map');
      console.log(`  Products: ${dualResult.product_grid.products.length}, Stores: ${dualResult.store_map.stores.length}`);
    }
  } catch (error) {
    console.log(`  ✗ ERROR: ${error.message}`);
    allPassed = false;
  }

  console.log('\n' + '='.repeat(50));
  if (allPassed) {
    console.log('✓ All tests passed');
    process.exit(0);
  } else {
    console.log('✗ Some tests failed');
    process.exit(1);
  }
}

runTests();
