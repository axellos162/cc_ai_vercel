import 'dotenv/config';
import OpenAI from 'openai';
import { supabase } from './db.js';
import { logger } from './logger.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000,
  maxRetries: 3
});

async function generateBrandEmbeddings(mode = 'simple') {
  try {
    logger.info(`Starting brand embedding generation (mode: ${mode})...`);

    if (mode !== 'simple' && mode !== 'hybrid') {
      throw new Error('Mode must be either "simple" or "hybrid"');
    }

    const { data, error } = await supabase.rpc('exec', {
      sql: `
        INSERT INTO brand_embeddings (brand_id, embedding, product_count, updated_at)
        SELECT
          b.id,
          AVG(pe.embedding),
          COUNT(pe.embedding)::int,
          NOW()
        FROM brands b
        JOIN products p ON p.brand_id = b.id
        JOIN product_embeddings pe ON pe.product_id = p.id
        GROUP BY b.id
        ON CONFLICT (brand_id)
        DO UPDATE SET
          embedding = EXCLUDED.embedding,
          product_count = EXCLUDED.product_count,
          updated_at = EXCLUDED.updated_at
        RETURNING brand_id, product_count;
      `
    });

    if (error) {
      logger.error(`Failed to generate brand embeddings via RPC: ${error.message}`);
      logger.info('Using direct approach...');

      const { data: brands, error: brandsError } = await supabase
        .from('brands')
        .select('id, name, price_segment, style_description, top_categories');

      if (brandsError) throw brandsError;

      let successCount = 0;
      let skipCount = 0;

      for (const brand of brands) {
        try {
          let finalEmbedding;

          if (mode === 'simple') {
            finalEmbedding = await generateSimpleEmbedding(brand.id, brand.name);
          } else if (mode === 'hybrid') {
            finalEmbedding = await generateHybridEmbedding(brand);
          }

          if (!finalEmbedding) {
            logger.warn(`Skipping ${brand.name}: could not generate embedding`);
            skipCount++;
            continue;
          }

          const productCount = await getProductCount(brand.id);

          const { error: upsertError } = await supabase
            .from('brand_embeddings')
            .upsert({
              brand_id: brand.id,
              embedding: `[${finalEmbedding.join(',')}]`,
              product_count: productCount,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'brand_id'
            });

          if (upsertError) {
            logger.error(`Failed to upsert embedding for ${brand.name}: ${upsertError.message}`);
            skipCount++;
          } else {
            successCount++;
            logger.info(`✓ ${brand.name} (${productCount} products)`);
          }
        } catch (brandErr) {
          logger.error(`Failed to process ${brand.name}: ${brandErr.message}`);
          skipCount++;
        }
      }

      logger.info(`Brand embedding generation complete: ${successCount} successful, ${skipCount} skipped`);
      return;
    }

    const processedCount = data?.length || 0;
    logger.info(`✓ Brand embedding generation complete: ${processedCount} brands processed`);

    const { data: stats, error: statsError } = await supabase
      .from('brand_embeddings')
      .select('brand_id, product_count');

    if (!statsError && stats) {
      const totalBrands = stats.length;
      const avgProducts = stats.reduce((sum, s) => sum + s.product_count, 0) / totalBrands;
      logger.info(`Total brands with embeddings: ${totalBrands}`);
      logger.info(`Average products per brand: ${avgProducts.toFixed(1)}`);
    }

  } catch (err) {
    logger.error(`Brand embedding generation failed: ${err.message}`);
    throw err;
  }
}

async function generateSimpleEmbedding(brandId, brandName) {
  // First get product IDs for this brand
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id')
    .eq('brand_id', brandId);

  if (productsError || !products || products.length === 0) {
    return null;
  }

  const productIds = products.map(p => p.id);

  // Then get embeddings for those products
  const { data: productEmbeddings, error } = await supabase
    .from('product_embeddings')
    .select('embedding')
    .in('product_id', productIds);

  if (error || !productEmbeddings || productEmbeddings.length === 0) {
    return null;
  }

  return calculateAverageEmbedding(productEmbeddings.map(e => e.embedding));
}

async function generateHybridEmbedding(brand) {
  if (!brand.style_description || !brand.top_categories) {
    logger.warn(`${brand.name} missing metadata, falling back to simple mode`);
    return await generateSimpleEmbedding(brand.id, brand.name);
  }

  const productEmbedding = await generateSimpleEmbedding(brand.id, brand.name);
  if (!productEmbedding) {
    return null;
  }

  const metadataEmbedding = await generateMetadataEmbedding(brand);
  if (!metadataEmbedding) {
    logger.warn(`${brand.name} failed to generate metadata embedding, using simple mode`);
    return productEmbedding;
  }

  const hybridEmbedding = combineEmbeddings(productEmbedding, metadataEmbedding, 0.7, 0.3);
  return hybridEmbedding;
}

async function generateMetadataEmbedding(brand) {
  const categories = Array.isArray(brand.top_categories)
    ? brand.top_categories.join(', ')
    : '';

  const text = `Brand: ${brand.name}. Categories: ${categories}. Price range: ${brand.price_segment || 'Unknown'}. Style: ${brand.style_description || ''}`;

  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text
    });

    return response.data[0].embedding;
  } catch (err) {
    logger.error(`Failed to generate metadata embedding for ${brand.name}: ${err.message}`);
    return null;
  }
}

function combineEmbeddings(vec1, vec2, weight1, weight2) {
  const norm1 = normalize(vec1);
  const norm2 = normalize(vec2);

  const combined = norm1.map((val, idx) =>
    (weight1 * val) + (weight2 * norm2[idx])
  );

  return normalize(combined);
}

function normalize(vector) {
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (magnitude === 0) return vector;
  return vector.map(val => val / magnitude);
}

function calculateAverageEmbedding(embeddings) {
  if (embeddings.length === 0) {
    throw new Error('Cannot calculate average of zero embeddings');
  }

  const dimension = 1536;
  const sum = new Array(dimension).fill(0);

  for (const embedding of embeddings) {
    const vector = typeof embedding === 'string' ? JSON.parse(embedding) : embedding;
    for (let i = 0; i < dimension; i++) {
      sum[i] += vector[i];
    }
  }

  return sum.map(val => val / embeddings.length);
}

async function getProductCount(brandId) {
  const { count, error } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('brand_id', brandId);

  return count || 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const mode = process.argv[2] || 'simple';

  if (mode !== 'simple' && mode !== 'hybrid') {
    console.error('Usage: node generate-brand-embeddings.js [simple|hybrid]');
    process.exit(1);
  }

  generateBrandEmbeddings(mode)
    .then(() => {
      logger.info('Done');
      process.exit(0);
    })
    .catch((err) => {
      logger.error('Fatal error:', err);
      process.exit(1);
    });
}

export { generateBrandEmbeddings };
