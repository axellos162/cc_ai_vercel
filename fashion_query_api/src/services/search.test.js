import '../load-env.js';
import { searchProducts, findStores, compareProducts } from './search.js';

async function runTests() {
  console.log('Running search service tests...\n');
  
  let allPassed = true;

  // Test 1: Product Search
  console.log('Test 1: Product Search (jeans)');
  try {
    const intent = {
      intent: 'product_search',
      filters: {
        brand: null,
        category: 'jeans',
        city: null,
        state: null,
        price_min: null,
        price_max: null,
        price_around: null
      },
      sort: 'relevance',
      raw_query: 'jeans'
    };
    
    const results = await searchProducts(intent);
    
    console.log(`  Found ${results.length} results`);
    
    if (!Array.isArray(results)) {
      console.log('  ✗ FAIL: Result is not an array');
      allPassed = false;
    } else if (results.length === 0) {
      console.log('  ✗ FAIL: No results found');
      allPassed = false;
    } else {
      const firstResult = results[0];
      const hasRequiredFields = 
        firstResult.product_id &&
        firstResult.title &&
        firstResult.effective_price !== undefined &&
        firstResult.images &&
        firstResult.store_name;
      
      if (!hasRequiredFields) {
        console.log('  ✗ FAIL: Missing required fields');
        console.log('  First result:', JSON.stringify(firstResult, null, 2));
        allPassed = false;
      } else {
        console.log('  ✓ PASS: Valid results with required fields');
        console.log(`  Sample: ${firstResult.title} - $${firstResult.effective_price}`);
      }
    }
  } catch (error) {
    console.log(`  ✗ ERROR: ${error.message}`);
    allPassed = false;
  }

  // Test 2: Price Filter
  console.log('\nTest 2: Price Filter (jeans under $200)');
  try {
    const intent = {
      intent: 'product_search',
      filters: {
        brand: null,
        category: 'jeans',
        city: null,
        state: null,
        price_min: null,
        price_max: 200,
        price_around: null
      },
      sort: 'relevance',
      raw_query: 'jeans under $200'
    };
    
    const results = await searchProducts(intent);
    
    console.log(`  Found ${results.length} results`);
    
    const allUnder200 = results.every(r => parseFloat(r.effective_price) <= 200);
    
    if (!allUnder200) {
      const overPriced = results.filter(r => parseFloat(r.effective_price) > 200);
      console.log(`  ✗ FAIL: ${overPriced.length} results over $200`);
      console.log(`  Example: ${overPriced[0]?.title} - $${overPriced[0]?.effective_price}`);
      allPassed = false;
    } else {
      console.log('  ✓ PASS: All results are under $200');
      if (results.length > 0) {
        console.log(`  Price range: $${Math.min(...results.map(r => parseFloat(r.effective_price)))} - $${Math.max(...results.map(r => parseFloat(r.effective_price)))}`);
      }
    }
  } catch (error) {
    console.log(`  ✗ ERROR: ${error.message}`);
    allPassed = false;
  }

  // Test 3: Store Finder
  console.log('\nTest 3: Store Finder');
  try {
    const intent = {
      intent: 'store_finder',
      filters: {
        brand: null,
        category: null,
        city: 'San Francisco',
        state: null,
        price_min: null,
        price_max: null,
        price_around: null
      },
      sort: null,
      raw_query: 'stores in san francisco'
    };
    
    const results = await findStores(intent);
    
    console.log(`  Found ${results.length} stores`);
    
    if (!Array.isArray(results)) {
      console.log('  ✗ FAIL: Result is not an array');
      allPassed = false;
    } else if (results.length === 0) {
      console.log('  ⚠ WARNING: No stores found (may be valid if no SF data)');
    } else {
      const hasLatLng = results.every(r => r.lat && r.lng && r.product_count > 0);
      
      if (!hasLatLng) {
        console.log('  ✗ FAIL: Missing lat/lng or product_count');
        allPassed = false;
      } else {
        console.log('  ✓ PASS: All stores have coordinates and products');
        console.log(`  Sample: ${results[0].store_name} - ${results[0].product_count} products`);
      }
    }
  } catch (error) {
    console.log(`  ✗ ERROR: ${error.message}`);
    allPassed = false;
  }

  // Test 4: Discount Sort
  console.log('\nTest 4: Discount Sort');
  try {
    const intent = {
      intent: 'product_search',
      filters: {
        brand: null,
        category: null,
        city: null,
        state: null,
        price_min: null,
        price_max: null,
        price_around: null
      },
      sort: 'discount',
      raw_query: 'discounted items'
    };
    
    const results = await searchProducts(intent);
    
    console.log(`  Found ${results.length} results`);
    
    if (results.length === 0) {
      console.log('  ⚠ WARNING: No results found');
    } else {
      const firstResult = results[0];
      const hasDiscount = 
        firstResult.discounted_price !== null &&
        firstResult.discounted_price > 0 &&
        parseFloat(firstResult.discounted_price) < parseFloat(firstResult.price);
      
      if (hasDiscount) {
        const discount = ((firstResult.price - firstResult.discounted_price) / firstResult.price * 100).toFixed(0);
        console.log('  ✓ PASS: First result has discount');
        console.log(`  ${firstResult.title}: $${firstResult.price} → $${firstResult.discounted_price} (${discount}% off)`);
      } else {
        console.log('  ⚠ WARNING: First result has no discount (may be valid if limited discount data)');
        console.log(`  ${firstResult.title}: $${firstResult.price}`);
      }
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
