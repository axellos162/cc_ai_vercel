import 'dotenv/config';
import { fetchAllProducts, extractProductData } from '../src/shopify.js';
import { logger } from '../src/logger.js';

async function testShopify() {
  try {
    logger.info('Testing Shopify API module...');
    
    const testDomain = 'allbirds.com';
    logger.info(`Fetching first page of products from ${testDomain}...`);
    
    const url = `https://${testDomain}/products.json?limit=10`;
    const response = await fetch(url);
    
    if (!response.ok) {
      logger.error(`Failed to fetch: ${response.status}`);
      process.exit(1);
    }
    
    const data = await response.json();
    const products = data.products || [];
    
    if (!products || products.length === 0) {
      logger.error('No products fetched');
      process.exit(1);
    }
    
    logger.info(`Total products fetched: ${products.length}`);
    logger.info('\n=== First 3 raw products ===');
    products.slice(0, 3).forEach((p, i) => {
      logger.info(`\nProduct ${i + 1}:`);
      logger.info(JSON.stringify({
        id: p.id,
        title: p.title,
        vendor: p.vendor,
        variants_count: p.variants?.length || 0
      }, null, 2));
    });
    
    logger.info('\n=== Testing extractProductData ===');
    const testStoreId = 'test-store-uuid';
    const extracted = extractProductData(products[0], testStoreId);
    
    logger.info('Extracted product data:');
    logger.info(JSON.stringify(extracted, null, 2));
    
    logger.info('\n=== Validation ===');
    
    if (typeof extracted.shopify_product_id !== 'number') {
      logger.error(`❌ shopify_product_id is not a number: ${typeof extracted.shopify_product_id}`);
      process.exit(1);
    }
    logger.info('✓ shopify_product_id is a number');
    
    if (extracted.price !== null && typeof extracted.price !== 'number') {
      logger.error(`❌ price is not a float or null: ${typeof extracted.price}`);
      process.exit(1);
    }
    logger.info('✓ price is a float or null');
    
    if (!Array.isArray(extracted.images)) {
      logger.error(`❌ images is not an array`);
      process.exit(1);
    }
    logger.info('✓ images is an array');
    
    if (!Array.isArray(extracted.variants) || extracted.variants.length === 0) {
      logger.error(`❌ variants is not a non-empty array`);
      process.exit(1);
    }
    logger.info('✓ variants is a non-empty array');
    
    logger.info('\n✅ All tests passed!');
    process.exit(0);
    
  } catch (err) {
    logger.error(`Test failed: ${err.message}`);
    console.error(err);
    process.exit(1);
  }
}

testShopify();
