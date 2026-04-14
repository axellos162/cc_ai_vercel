import './src/load-env.js';
import { searchSimilarBrands } from './src/services/search.js';

async function testBrandSimilarity() {
  console.log('Testing brand similarity search...\n');

  const testBrands = ['Acne Studios', 'Rick Owens', 'Comme Des Garçons'];

  for (const brandName of testBrands) {
    try {
      console.log(`\n=== Finding brands similar to: ${brandName} ===`);

      const similarBrands = await searchSimilarBrands(brandName, {
        city: null,
        state: null
      });

      if (similarBrands.length === 0) {
        console.log(`No similar brands found for ${brandName}`);
        continue;
      }

      console.log(`Found ${similarBrands.length} similar brands:\n`);

      similarBrands.forEach((brand, index) => {
        console.log(`${index + 1}. ${brand.brand_name}`);
        console.log(`   Similarity: ${(brand.similarity * 100).toFixed(1)}%`);
        console.log(`   Products: ${brand.product_count}`);
        console.log('');
      });

    } catch (error) {
      console.error(`Error finding similar brands for ${brandName}:`, error.message);
    }
  }

  console.log('\n✓ Brand similarity test complete');
}

testBrandSimilarity()
  .then(() => {
    console.log('\nDone');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
