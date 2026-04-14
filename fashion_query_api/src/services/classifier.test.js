import '../load-env.js';
import { classifyQuery } from './classifier.js';

const testCases = [
  {
    name: 'Test 1: Product search with brand, category, and city',
    query: 'find me acne studios jeans in san francisco',
    assertions: [
      { field: 'intent', expected: 'product_search' },
      { field: 'filters.brand', expected: 'Acne Studios' },
      { field: 'filters.city', expected: 'San Francisco', contains: true }
    ]
  },
  {
    name: 'Test 2: Store finder with brand and city',
    query: 'which stores in austin carry agolde',
    assertions: [
      { field: 'intent', expected: 'store_finder' },
      { field: 'filters.brand', expected: 'Agolde' },
      { field: 'filters.city', expected: 'Austin' }
    ]
  },
  {
    name: 'Test 3: Availability check',
    query: 'does nordstrom san francisco carry toteme',
    assertions: [
      { field: 'intent', expected: 'availability_check' },
      { field: 'filters.brand', expected: 'Toteme' },
      { field: 'filters.city', expected: 'San Francisco', contains: true }
    ]
  },
  {
    name: 'Test 4: Price comparison',
    query: 'which is cheaper, toteme or agolde',
    assertions: [
      { field: 'intent', expected: 'price_comparison' },
      { field: 'filters.brands', expected: ['Toteme', 'Agolde'], arrayContains: true }
    ]
  },
  {
    name: 'Test 5: Ambiguous intent',
    query: 'good denim stores in LA',
    assertions: [
      { field: 'intent', expected: 'ambiguous' }
    ]
  },
  {
    name: 'Test 6: Product search with price_max',
    query: 'find me jeans under $200 in new york',
    assertions: [
      { field: 'intent', expected: 'product_search' },
      { field: 'filters.price_max', expected: 200 },
      { field: 'filters.city', expected: 'New York' }
    ]
  },
  {
    name: 'Test 7: Product search with price_around',
    query: 'find me jeans around $250',
    assertions: [
      { field: 'intent', expected: 'product_search' },
      { field: 'filters.price_around', expected: 250 },
      { field: 'filters.price_min', expected: null },
      { field: 'filters.price_max', expected: null }
    ]
  },
  {
    name: 'Test 8: Product search with discount sort',
    query: 'show me discounted dresses in chicago',
    assertions: [
      { field: 'intent', expected: 'product_search' },
      { field: 'sort', expected: 'discount' }
    ]
  }
];

function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

function arraysContainSameElements(arr1, arr2) {
  if (!Array.isArray(arr1) || !Array.isArray(arr2)) return false;
  if (arr1.length !== arr2.length) return false;
  const sorted1 = [...arr1].sort();
  const sorted2 = [...arr2].sort();
  return sorted1.every((val, idx) => val === sorted2[idx]);
}

async function runTests() {
  console.log('Running classifier tests...\n');
  
  let allPassed = true;

  for (const testCase of testCases) {
    console.log(`\n${testCase.name}`);
    console.log(`Query: "${testCase.query}"`);
    
    try {
      const result = await classifyQuery(testCase.query);
      console.log('Result:', JSON.stringify(result, null, 2));
      
      let testPassed = true;
      
      for (const assertion of testCase.assertions) {
        const actualValue = getNestedValue(result, assertion.field);
        const expectedValue = assertion.expected;
        
        let passed = false;
        
        if (assertion.contains && typeof actualValue === 'string') {
          passed = actualValue.toLowerCase().includes(expectedValue.toLowerCase());
        } else if (assertion.arrayContains && Array.isArray(expectedValue)) {
          passed = arraysContainSameElements(actualValue, expectedValue);
        } else {
          passed = actualValue === expectedValue;
        }
        
        if (!passed) {
          console.log(`  ✗ FAIL: ${assertion.field} - expected ${JSON.stringify(expectedValue)}, got ${JSON.stringify(actualValue)}`);
          testPassed = false;
          allPassed = false;
        } else {
          console.log(`  ✓ PASS: ${assertion.field} = ${JSON.stringify(actualValue)}`);
        }
      }
      
      if (testPassed) {
        console.log('  ✓ TEST PASSED');
      } else {
        console.log('  ✗ TEST FAILED');
      }
    } catch (error) {
      console.log(`  ✗ ERROR: ${error.message}`);
      allPassed = false;
    }
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
