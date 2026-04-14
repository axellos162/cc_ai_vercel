import OpenAI from 'openai';
import { supabase } from './db.js';
import { logger } from './logger.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000,
  maxRetries: 3
});

const brandCache = new Map();

function normalizeBrandName(vendorName) {
  if (!vendorName || vendorName.trim() === '') {
    return null;
  }
  
  const trimmed = vendorName.trim();
  
  if (trimmed.toLowerCase() === 'default title') {
    return null;
  }
  
  return trimmed
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export async function upsertBrand(vendorName) {
  const normalizedName = normalizeBrandName(vendorName);
  
  if (!normalizedName) {
    return null;
  }
  
  if (brandCache.has(normalizedName)) {
    return brandCache.get(normalizedName);
  }
  
  const { data, error } = await supabase
    .from('brands')
    .upsert({ name: normalizedName }, { onConflict: 'name' })
    .select('id')
    .single();
  
  if (error) {
    throw new Error(`Failed to upsert brand ${normalizedName}: ${error.message}`);
  }
  
  brandCache.set(normalizedName, data.id);
  logger.info(`Brand upserted: ${normalizedName}`);
  
  return data.id;
}

export async function inferProductMeta(title, description, vendor) {
  const systemPrompt = `You are a fashion retail data classifier. Given a product title, description, and brand, return ONLY a valid JSON object with two fields: category (string) and style_tags (array of strings, max 5 tags). No explanation. No markdown. Raw JSON only.`;
  
  const userPrompt = `Brand: ${vendor || 'Unknown'}
Title: ${title || ''}
Description: ${description?.slice(0, 400) || ''}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0,
      max_tokens: 150
    });
    
    const content = response.choices[0]?.message?.content?.trim();
    
    if (!content) {
      logger.warn('GPT-4o-mini returned empty response');
      return { category: null, style_tags: [] };
    }
    
    const parsed = JSON.parse(content);
    
    return {
      category: parsed.category || null,
      style_tags: Array.isArray(parsed.style_tags) ? parsed.style_tags : []
    };
    
  } catch (err) {
    logger.warn(`Failed to infer product meta: ${err.message}`);
    return { category: null, style_tags: [] };
  }
}
