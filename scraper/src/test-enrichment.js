import 'dotenv/config';
import { inferProductMeta, upsertBrand } from './enrichment.js';
import { logger } from './logger.js';

async function testEnrichment() {
  try {
    logger.info('Testing enrichment module...');
    
    logger.info('\n=== Testing inferProductMeta ===');
    const title = 'Relaxed Fit Straight Leg Jean';
    const description = '100% organic cotton. Mid-rise. Available in multiple washes.';
    const vendor = 'Agolde';
    
    logger.info(`Input: ${title}, ${vendor}`);
    
    const result = await inferProductMeta(title, description, vendor);
    
    logger.info('GPT-4o-mini response:');
    logger.info(JSON.stringify(result, null, 2));
    
    logger.info('\n=== Validation ===');
    
    if (typeof result !== 'object' || result === null) {
      logger.error('❌ Response is not a valid object');
      process.exit(1);
    }
    logger.info('✓ Response is a valid object');
    
    if (typeof result.category !== 'string' || result.category.length === 0) {
      logger.error(`❌ category is not a non-empty string: ${result.category}`);
      process.exit(1);
    }
    logger.info('✓ category is a non-empty string');
    
    if (!Array.isArray(result.style_tags)) {
      logger.error('❌ style_tags is not an array');
      process.exit(1);
    }
    logger.info('✓ style_tags is an array');
    
    if (result.style_tags.length < 1) {
      logger.error('❌ style_tags array is empty');
      process.exit(1);
    }
    logger.info('✓ style_tags has at least 1 item');
    
    logger.info('\n=== Testing upsertBrand (cache test) ===');
    
    const brandName = 'Acne Studios';
    logger.info(`Upserting brand: ${brandName} (first call)`);
    const brandId1 = await upsertBrand(brandName);
    
    if (!brandId1) {
      logger.error('❌ First upsertBrand returned null');
      process.exit(1);
    }
    logger.info(`✓ First call returned brand ID: ${brandId1}`);
    
    logger.info(`Upserting brand: ${brandName} (second call - should hit cache)`);
    const brandId2 = await upsertBrand(brandName);
    
    if (!brandId2) {
      logger.error('❌ Second upsertBrand returned null');
      process.exit(1);
    }
    logger.info(`✓ Second call returned brand ID: ${brandId2}`);
    
    if (brandId1 !== brandId2) {
      logger.error(`❌ Brand IDs don't match: ${brandId1} !== ${brandId2}`);
      process.exit(1);
    }
    logger.info('✓ Both calls returned the same UUID (cache hit confirmed)');
    
    logger.info('\n✅ All tests passed!');
    process.exit(0);
    
  } catch (err) {
    logger.error(`Test failed: ${err.message}`);
    console.error(err);
    process.exit(1);
  }
}

testEnrichment();
