import 'dotenv/config';
import { logger } from './logger.js';
import { syncStore } from './sync.js';
import { readFile } from 'fs/promises';

process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection: ${reason}`);
  console.error('Promise:', promise);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error(`Uncaught Exception: ${error.message}`);
  console.error(error.stack);
  process.exit(1);
});

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function parseArgs() {
  const args = process.argv.slice(2);
  const storeIndex = args.indexOf('--store');
  
  if (storeIndex !== -1 && args[storeIndex + 1]) {
    return { storeDomain: args[storeIndex + 1] };
  }
  
  return { storeDomain: null };
}

async function main() {
  const startTime = Date.now();
  
  logger.info("=== Shopify → Supabase Scraper ===");
  
  const configPath = new URL('../stores.config.json', import.meta.url);
  const configContent = await readFile(configPath, 'utf-8');
  const stores = JSON.parse(configContent);
  
  const { storeDomain } = parseArgs();
  
  let storesToSync = stores;
  
  if (storeDomain) {
    const targetStore = stores.find(s => s.domain === storeDomain);
    if (!targetStore) {
      logger.error(`Store not found: ${storeDomain}`);
      logger.error(`Available stores: ${stores.map(s => s.domain).join(', ')}`);
      process.exit(1);
    }
    storesToSync = [targetStore];
    logger.info(`Single store mode: ${targetStore.name}`);
  } else {
    logger.info(`Stores to sync: ${stores.length}`);
  }
  
  logger.info(`Started at: ${new Date().toISOString()}`);
  
  for (let i = 0; i < storesToSync.length; i++) {
    const store = storesToSync[i];
    
    try {
      logger.info(`\n--- Starting: ${store.name} ---`);
      await syncStore(store);
      
      if (i < storesToSync.length - 1) {
        logger.info('Waiting 2 seconds before next store...');
        await sleep(2000);
      }
    } catch (err) {
      logger.error(`[${store.name}] Failed: ${err.message}`);
    }
  }
  
  const endTime = Date.now();
  const elapsed = ((endTime - startTime) / 1000).toFixed(2);
  
  logger.info(`\n=== Scraper complete ===`);
  logger.info(`Total time: ${elapsed}s`);
  process.exit(0);
}

main().catch(err => {
  logger.error(`Fatal error: ${err.message}`);
  console.error(err);
  process.exit(1);
});

