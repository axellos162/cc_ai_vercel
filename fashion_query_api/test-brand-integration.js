import './src/load-env.js';
import { classifyQuery } from './src/services/classifier.js';
import { searchSimilarBrands } from './src/services/search.js';
import { shapeBrandSimilarity } from './src/services/response.js';

console.log('=== Testing Brand Similarity Integration ===\n');

async function testDirectBrandSimilarityIntent() {
  console.log('TEST 1: Direct Brand Similarity Intent\n');

  const testQueries = [
    "what brands are similar to rick owens",
    "show me brands like acne studios",
    "find alternatives to comme des garçons",
    "brands comparable to a.p.c. in san francisco"
  ];

  for (const query of testQueries) {
    console.log(`Query: "${query}"`);

    try {
      const classified = await classifyQuery(query);
      console.log(`Intent: ${classified.intent}`);
      console.log(`Brand: ${classified.filters.brand}`);
      console.log(`City: ${classified.filters.city || 'null'}`);

      if (classified.intent === 'brand_similarity' && classified.filters.brand) {
        const brands = await searchSimilarBrands(classified.filters.brand, {
          city: classified.filters.city,
          state: classified.filters.state
        });

        const shaped = shapeBrandSimilarity(brands);
        console.log(`Results: ${shaped.brands.length} brands found`);
        console.log(`Summary: ${shaped.summary}`);
        console.log(`Top 3: ${shaped.brands.slice(0, 3).map(b => `${b.name} (${b.similarity}%)`).join(', ')}`);
      } else {
        console.log('⚠️ Wrong intent detected!');
      }
    } catch (error) {
      console.error(`Error: ${error.message}`);
    }

    console.log('');
  }
}

async function testSimilarProductsVsBrandSimilarity() {
  console.log('\nTEST 2: Similar Products vs Brand Similarity Distinction\n');

  const testCases = [
    { query: "show me similar products from other brands", expectedIntent: "similar_products" },
    { query: "find brands similar to rick owens", expectedIntent: "brand_similarity" },
    { query: "show me similar jeans", expectedIntent: "similar_products" },
    { query: "what brands are like acne studios", expectedIntent: "brand_similarity" }
  ];

  for (const testCase of testCases) {
    console.log(`Query: "${testCase.query}"`);

    try {
      const classified = await classifyQuery(testCase.query);
      const correct = classified.intent === testCase.expectedIntent;
      console.log(`Expected: ${testCase.expectedIntent}`);
      console.log(`Got: ${classified.intent}`);
      console.log(`${correct ? '✓' : '✗'} ${correct ? 'PASS' : 'FAIL'}`);
    } catch (error) {
      console.error(`Error: ${error.message}`);
    }

    console.log('');
  }
}

async function testBrandSimilarityWithFilters() {
  console.log('\nTEST 3: Brand Similarity with Location Filters\n');

  const query = "brands like acne studios in new york";
  console.log(`Query: "${query}"`);

  try {
    const classified = await classifyQuery(query);
    console.log(`Intent: ${classified.intent}`);
    console.log(`Brand: ${classified.filters.brand}`);
    console.log(`City: ${classified.filters.city}`);

    if (classified.intent === 'brand_similarity') {
      const brands = await searchSimilarBrands(classified.filters.brand, {
        city: classified.filters.city,
        state: classified.filters.state
      });

      const shaped = shapeBrandSimilarity(brands);
      console.log(`\nResults: ${shaped.brands.length} brands found in NYC`);
      console.log(`Summary: ${shaped.summary}`);

      if (shaped.brands.length > 0) {
        console.log('\nTop 5 similar brands:');
        shaped.brands.slice(0, 5).forEach((b, i) => {
          console.log(`  ${i + 1}. ${b.name} - ${b.similarity}% similarity (${b.product_count} products)`);
        });
      }
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}

async function runAllTests() {
  try {
    await testDirectBrandSimilarityIntent();
    await testSimilarProductsVsBrandSimilarity();
    await testBrandSimilarityWithFilters();

    console.log('\n\n✓ All integration tests complete!');
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Tests failed:', error);
    process.exit(1);
  }
}

runAllTests();
