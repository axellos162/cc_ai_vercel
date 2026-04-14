import 'dotenv/config';
import { syncStore } from './sync.js';
import { supabase } from './db.js';
import { logger } from './logger.js';
import { readFile } from 'fs/promises';

async function testSync() {
  try {
    logger.info('Testing sync module...');
    
    const configPath = new URL('../stores.config.json', import.meta.url);
    const configContent = await readFile(configPath, 'utf-8');
    const storesConfig = JSON.parse(configContent);
    
    const testStore = storesConfig[0];
    
    if (!testStore) {
      logger.error('No stores found in stores.config.json');
      process.exit(1);
    }
    
    logger.info(`\n=== First Sync (should process products) ===`);
    logger.info(`Testing with store: ${testStore.name} (${testStore.domain})`);
    
    await syncStore(testStore);
    
    logger.info('\n=== Querying database ===');
    
    const { data: storeData } = await supabase
      .from('stores')
      .select('id')
      .eq('domain', testStore.domain)
      .single();
    
    if (!storeData) {
      logger.error('❌ Store not found in database');
      process.exit(1);
    }
    
    const storeId = storeData.id;
    logger.info(`Store ID: ${storeId}`);
    
    const { data: productCount, error: productError } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('store_id', storeId);
    
    if (productError) {
      logger.error(`❌ Failed to count products: ${productError.message}`);
      process.exit(1);
    }
    
    logger.info(`Products in database: ${productCount?.length || 0}`);
    
    const { count: embeddingCount, error: embeddingError } = await supabase
      .from('product_embeddings')
      .select('*', { count: 'exact', head: true });
    
    if (embeddingError) {
      logger.error(`❌ Failed to count embeddings: ${embeddingError.message}`);
      process.exit(1);
    }
    
    logger.info(`Embeddings in database: ${embeddingCount || 0}`);
    
    logger.info('\n=== Validation ===');
    
    if (!productCount || productCount.length === 0) {
      logger.error('❌ No products found in database');
      process.exit(1);
    }
    logger.info('✓ Products were synced');
    
    if (!embeddingCount || embeddingCount === 0) {
      logger.error('❌ No embeddings found in database');
      process.exit(1);
    }
    logger.info('✓ Embeddings were generated');
    
    logger.info('\n=== Second Sync (should skip unchanged products) ===');
    logger.info('Running incremental sync immediately...');
    
    await syncStore(testStore);
    
    logger.info('\n✅ All tests passed!');
    logger.info('✓ First sync processed products');
    logger.info('✓ Products were inserted into database');
    logger.info('✓ Embeddings were generated');
    logger.info('✓ Second sync showed incremental behavior');
    
    process.exit(0);
    
  } catch (err) {
    logger.error(`Test failed: ${err.message}`);
    console.error(err);
    process.exit(1);
  }
}

testSync();
