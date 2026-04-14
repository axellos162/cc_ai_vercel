import OpenAI from 'openai';
import { supabase } from './db.js';
import { logger } from './logger.js';
import { fetchAllProducts, fetchUpdatedProducts, extractProductData } from './shopify.js';
import { upsertBrand, inferProductMeta } from './enrichment.js';
import { readFile } from 'fs/promises';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000,
  maxRetries: 3
});

export async function getStoreRecord(domain) {
  const { data: existingStore, error: selectError } = await supabase
    .from('stores')
    .select('id, name, domain, city, state, lat, lng')
    .eq('domain', domain)
    .single();
  
  if (existingStore) {
    return existingStore;
  }
  
  const configPath = new URL('../stores.config.json', import.meta.url);
  const configContent = await readFile(configPath, 'utf-8');
  const storesConfig = JSON.parse(configContent);
  
  const storeConfig = storesConfig.find(s => s.domain === domain);
  
  if (!storeConfig) {
    throw new Error(`Store ${domain} not found in stores.config.json`);
  }
  
  const { data: newStore, error: insertError } = await supabase
    .from('stores')
    .insert({
      name: storeConfig.name,
      domain: storeConfig.domain,
      city: storeConfig.city,
      state: storeConfig.state,
      lat: storeConfig.lat,
      lng: storeConfig.lng,
      website: `https://${storeConfig.domain}`
    })
    .select('id, name, domain, city, state, lat, lng')
    .single();
  
  if (insertError) {
    throw new Error(`Failed to insert store: ${insertError.message}`);
  }
  
  return newStore;
}

export async function getLastScrapedTimestamp(storeId) {
  const { data, error } = await supabase
    .from('products')
    .select('shopify_updated_at')
    .eq('store_id', storeId)
    .order('shopify_updated_at', { ascending: false })
    .limit(1)
    .single();
  
  if (error || !data || !data.shopify_updated_at) {
    return null;
  }
  
  return new Date(data.shopify_updated_at);
}

export async function upsertProduct(normalizedProduct, brandId, category, styleTags) {
  const { data: productData, error: productError } = await supabase
    .from('products')
    .upsert({
      shopify_product_id: normalizedProduct.shopify_product_id,
      store_id: normalizedProduct.store_id,
      brand_id: brandId,
      title: normalizedProduct.title,
      description: normalizedProduct.description,
      category: category,
      price: normalizedProduct.price,
      discounted_price: normalizedProduct.discounted_price,
      url: normalizedProduct.url,
      images: normalizedProduct.images,
      shopify_updated_at: normalizedProduct.shopify_updated_at,
      last_scraped_at: new Date().toISOString()
    }, {
      onConflict: 'shopify_product_id,store_id'
    })
    .select('id')
    .single();
  
  if (productError) {
    throw new Error(`Failed to upsert product: ${productError.message}`);
  }
  
  for (const variant of normalizedProduct.variants) {
    const { error: variantError } = await supabase
      .from('variants')
      .upsert({
        product_id: productData.id,
        shopify_variant_id: variant.shopify_variant_id,
        size: variant.size,
        color: variant.color,
        inventory_count: variant.inventory_count
      }, {
        onConflict: 'shopify_variant_id'
      });
    
    if (variantError) {
      logger.warn(`Failed to upsert variant ${variant.shopify_variant_id}: ${variantError.message}`);
    }
  }
  
  return { productId: productData.id };
}

export async function upsertEmbedding(productId, embeddingVector) {
  if (!Array.isArray(embeddingVector) || embeddingVector.length !== 1536) {
    throw new Error(`Invalid embedding vector length: ${embeddingVector?.length}`);
  }
  
  const { error } = await supabase
    .from('product_embeddings')
    .upsert({
      product_id: productId,
      embedding: `[${embeddingVector.join(',')}]`
    }, {
      onConflict: 'product_id'
    });
  
  if (error) {
    throw new Error(`Failed to upsert embedding: ${error.message}`);
  }
}

export async function syncStore(storeConfig) {
  try {
    logger.info(`[${storeConfig.name}] Starting sync...`);
    
    const storeRecord = await getStoreRecord(storeConfig.domain);
    const storeId = storeRecord.id;
    
    const lastTimestamp = await getLastScrapedTimestamp(storeId);
    
    let newCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    
    const processPage = async (products, pageNum) => {
      logger.info(`[${storeConfig.name}] Processing page ${pageNum} (${products.length} products)...`);
      
      for (const rawProduct of products) {
        try {
          const normalizedProduct = extractProductData(rawProduct, storeId, storeConfig.domain);
          
          const brandId = await upsertBrand(normalizedProduct.vendor);
          
          const { data: existingProduct } = await supabase
            .from('products')
            .select('title, description, category')
            .eq('shopify_product_id', normalizedProduct.shopify_product_id)
            .eq('store_id', storeId)
            .single();
          
          const isNew = !existingProduct;
          
          let shouldEnrich = isNew;
          if (!isNew) {
            const titleChanged = existingProduct.title !== normalizedProduct.title;
            const descriptionChanged = existingProduct.description !== normalizedProduct.description;
            shouldEnrich = titleChanged || descriptionChanged;
          }
          
          let category = existingProduct?.category || null;
          let styleTags = [];
          
          if (shouldEnrich) {
            const meta = await inferProductMeta(
              normalizedProduct.title,
              normalizedProduct.description,
              normalizedProduct.vendor
            );
            category = meta.category;
            styleTags = meta.style_tags;
          }
          
          const { productId } = await upsertProduct(
            normalizedProduct,
            brandId,
            category,
            styleTags
          );
          
          if (shouldEnrich) {
            try {
              const embeddingText = `${normalizedProduct.title}. Brand: ${normalizedProduct.vendor || 'Unknown'}. Category: ${category || 'Unknown'}. Tags: ${styleTags.join(', ')}. ${normalizedProduct.description?.slice(0, 300) || ''}`;
              
              const embeddingResponse = await openai.embeddings.create({
                model: 'text-embedding-3-small',
                input: embeddingText
              });
              
              const embeddingVector = embeddingResponse.data[0].embedding;
              
              await upsertEmbedding(productId, embeddingVector);
            } catch (embErr) {
              logger.warn(`[${storeConfig.name}] Failed to generate embedding for "${normalizedProduct.title}": ${embErr.message}`);
            }
          }
          
          if (isNew) {
            newCount++;
          } else if (shouldEnrich) {
            updatedCount++;
          } else {
            skippedCount++;
          }
          
          logger.info(`[${storeConfig.name}] ✓ ${normalizedProduct.title}`);
          
        } catch (err) {
          logger.error(`[${storeConfig.name}] Failed to process product ${rawProduct.id}: ${err.message}`);
        }
      }
    };
    
    if (lastTimestamp) {
      logger.info(`[${storeConfig.name}] Incremental sync from ${lastTimestamp.toISOString()}`);
      await fetchUpdatedProducts(storeConfig.domain, lastTimestamp, processPage);
    } else {
      logger.info(`[${storeConfig.name}] Full sync (no previous data)`);
      await fetchAllProducts(storeConfig.domain, processPage);
    }
    
    logger.info(`[${storeConfig.name}] Done. ${newCount} new, ${updatedCount} updated, ${skippedCount} skipped`);
    
  } catch (err) {
    logger.error(`[${storeConfig.name}] Store sync failed: ${err.message}`);
    throw err;
  }
}
