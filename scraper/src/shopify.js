import { logger } from './logger.js';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function stripHtml(html) {
  if (!html) return '';
  
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function extractSize(o1, o2, o3) {
  const options = [o1, o2, o3].filter(o => o && o !== 'Default Title');
  const sizePattern = /^(XXS|XS|S|M|L|XL|XXL|XXXL|\d+\.?\d*|One Size)$/i;
  
  for (const opt of options) {
    if (sizePattern.test(opt.trim())) {
      return opt.trim();
    }
  }
  
  return null;
}

function extractColor(o1, o2, o3) {
  const options = [o1, o2, o3].filter(o => o && o !== 'Default Title');
  const sizePattern = /^(XXS|XS|S|M|L|XL|XXL|XXXL|\d+\.?\d*|One Size)$/i;
  
  for (const opt of options) {
    if (!sizePattern.test(opt.trim())) {
      return opt.trim();
    }
  }
  
  return null;
}

async function fetchWithRetry(url, domain, maxRetries = 5) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url);
      
      if (response.ok) {
        return response;
      }
      
      if (response.status === 503 || response.status === 429) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 30000);
        logger.warn(`[${domain}] ${response.status} error (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`);
        await sleep(delay);
        lastError = new Error(`${response.status} ${response.statusText}`);
        continue;
      }
      
      throw new Error(`Failed to fetch from ${domain}: ${response.status} ${response.statusText}`);
      
    } catch (err) {
      if (attempt === maxRetries) {
        throw err;
      }
      lastError = err;
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 30000);
      logger.warn(`[${domain}] Network error (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }
  
  throw lastError || new Error('Max retries exceeded');
}

export async function fetchAllProducts(domain, onPageFetched = null) {
  const allProducts = [];
  let page = 1;
  
  while (true) {
    const url = `https://${domain}/products.json?limit=250&page=${page}`;
    
    const response = await fetchWithRetry(url, domain);
    const data = await response.json();
    const products = data.products || [];
    
    logger.info(`[${domain}] Fetched page ${page}, ${products.length} products`);
    
    if (products.length === 0) {
      break;
    }
    
    if (onPageFetched) {
      await onPageFetched(products, page);
    } else {
      allProducts.push(...products);
    }
    
    page++;
    
    await sleep(1000);
  }
  
  return allProducts;
}

export async function fetchUpdatedProducts(domain, sinceDate, onPageFetched = null) {
  const allProducts = [];
  let page = 1;
  const updatedAtMin = sinceDate.toISOString();
  
  while (true) {
    const url = `https://${domain}/products.json?limit=250&updated_at_min=${updatedAtMin}&page=${page}`;
    
    const response = await fetchWithRetry(url, domain);
    const data = await response.json();
    const products = data.products || [];
    
    if (products.length === 0) {
      break;
    }
    
    if (onPageFetched) {
      await onPageFetched(products, page);
    } else {
      allProducts.push(...products);
    }
    
    page++;
    
    await sleep(1000);
  }
  
  logger.info(`[${domain}] ${allProducts.length} products updated since ${updatedAtMin}`);
  
  return allProducts;
}

export function extractProductData(rawProduct, storeId, storeDomain) {
  const productUrl = rawProduct.handle 
    ? `https://${storeDomain}/products/${rawProduct.handle}`
    : null;
    
  return {
    shopify_product_id: rawProduct.id,
    store_id: storeId,
    vendor: rawProduct.vendor?.trim() || null,
    title: rawProduct.title?.trim(),
    description: stripHtml(rawProduct.body_html),
    price: parseFloat(rawProduct.variants?.[0]?.compare_at_price) || 
           parseFloat(rawProduct.variants?.[0]?.price) || null,
    discounted_price: rawProduct.variants?.[0]?.compare_at_price 
                      ? parseFloat(rawProduct.variants?.[0]?.price) || null
                      : null,
    url: productUrl,
    images: rawProduct.images?.map(i => i.src) || [],
    shopify_updated_at: rawProduct.updated_at,
    variants: (rawProduct.variants || []).map(v => ({
      shopify_variant_id: v.id,
      size: extractSize(v.option1, v.option2, v.option3),
      color: extractColor(v.option1, v.option2, v.option3),
      inventory_count: v.inventory_quantity ?? 0
    }))
  };
}
