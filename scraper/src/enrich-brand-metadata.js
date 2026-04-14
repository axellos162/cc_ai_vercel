import 'dotenv/config';
import OpenAI from 'openai';
import { supabase } from './db.js';
import { logger } from './logger.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000,
  maxRetries: 3
});

async function enrichBrandMetadata() {
  try {
    logger.info('Starting brand metadata enrichment...');

    const { data: brands, error: brandsError } = await supabase
      .from('brands')
      .select('id, name');

    if (brandsError) throw brandsError;

    logger.info(`Found ${brands.length} brands to enrich`);

    let successCount = 0;
    let skipCount = 0;

    for (const brand of brands) {
      try {
        logger.info(`Processing ${brand.name}...`);

        const categoryDistribution = await getCategoryDistribution(brand.id);
        const priceSegment = await getPriceSegment(brand.id);
        const styleDescription = await getStyleDescription(brand.id, brand.name);

        const topCategories = Object.entries(categoryDistribution)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([category]) => category);

        const { error: updateError } = await supabase
          .from('brands')
          .update({
            top_categories: topCategories,
            price_segment: priceSegment,
            style_description: styleDescription,
            metadata_updated_at: new Date().toISOString()
          })
          .eq('id', brand.id);

        if (updateError) {
          logger.error(`Failed to update metadata for ${brand.name}: ${updateError.message}`);
          skipCount++;
        } else {
          logger.info(`✓ ${brand.name} - ${priceSegment} - ${topCategories.join(', ')}`);
          successCount++;
        }

      } catch (err) {
        logger.error(`Failed to enrich ${brand.name}: ${err.message}`);
        skipCount++;
      }
    }

    logger.info(`Brand metadata enrichment complete: ${successCount} successful, ${skipCount} skipped`);

  } catch (err) {
    logger.error(`Brand metadata enrichment failed: ${err.message}`);
    throw err;
  }
}

async function getCategoryDistribution(brandId) {
  const { data, error } = await supabase
    .from('products')
    .select('category')
    .eq('brand_id', brandId)
    .not('category', 'is', null);

  if (error) throw error;

  const distribution = {};
  for (const row of data) {
    distribution[row.category] = (distribution[row.category] || 0) + 1;
  }

  return distribution;
}

async function getPriceSegment(brandId) {
  const { data, error } = await supabase
    .from('products')
    .select('price, discounted_price')
    .eq('brand_id', brandId)
    .not('price', 'is', null);

  if (error || !data || data.length === 0) {
    return 'Unknown';
  }

  const prices = data.map(p => {
    const effectivePrice = (p.discounted_price && p.discounted_price > 0)
      ? p.discounted_price
      : p.price;
    return parseFloat(effectivePrice);
  });

  const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;

  if (avgPrice < 100) return 'Budget';
  if (avgPrice < 300) return 'Mid';
  if (avgPrice < 800) return 'Premium';
  return 'Luxury';
}

async function getStyleDescription(brandId, brandName) {
  const { data, error } = await supabase
    .from('products')
    .select('title, description')
    .eq('brand_id', brandId)
    .not('description', 'is', null)
    .limit(10);

  if (error || !data || data.length === 0) {
    return `${brandName} fashion products`;
  }

  const sampleDescriptions = data
    .filter(p => p.description && p.description.length > 50)
    .slice(0, 5)
    .map(p => `${p.title}: ${p.description.slice(0, 200)}`)
    .join('\n\n');

  if (!sampleDescriptions) {
    return `${brandName} fashion products`;
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0,
      messages: [
        {
          role: 'system',
          content: 'You are a fashion expert analyzing brand aesthetics. Generate a concise 1-2 sentence description of a brand\'s style based on product samples.'
        },
        {
          role: 'user',
          content: `Based on these product descriptions from ${brandName}:\n\n${sampleDescriptions}\n\nGenerate a 1-2 sentence style description capturing the brand's aesthetic.`
        }
      ]
    });

    const styleDesc = response.choices[0].message.content.trim();
    return styleDesc || `${brandName} fashion products`;

  } catch (llmError) {
    logger.warn(`Failed to generate style description for ${brandName}: ${llmError.message}`);
    return `${brandName} fashion products`;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  enrichBrandMetadata()
    .then(() => {
      logger.info('Done');
      process.exit(0);
    })
    .catch((err) => {
      logger.error('Fatal error:', err);
      process.exit(1);
    });
}

export { enrichBrandMetadata };
