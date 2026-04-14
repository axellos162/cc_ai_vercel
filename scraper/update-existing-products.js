// Simple: Just update the ~600 products already in our DB with URLs
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

console.log('📦 Updating existing products in database with URLs...\n');

// Get all products that need URLs
const { data: products, error } = await supabase
  .from('products')
  .select(`
    id,
    shopify_product_id,
    price,
    discounted_price,
    stores!inner(domain)
  `)
  .is('url', null);

if (error) {
  console.error('Error:', error);
  process.exit(1);
}

console.log(`Found ${products.length} products without URLs`);

// Fetch from Shopify and extract handle
const https = await import('https');

let updated = 0;
for (const product of products) {
  try {
    const url = `https://${product.stores.domain}/products.json?ids=${product.shopify_product_id}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.products && data.products.length > 0) {
      const shopifyProduct = data.products[0];
      const handle = shopifyProduct.handle;
      const productUrl = `https://${product.stores.domain}/products/${handle}`;
      
      // Also fix prices
      const variant = shopifyProduct.variants[0];
      const price = parseFloat(variant.compare_at_price) || parseFloat(variant.price) || null;
      const discounted_price = variant.compare_at_price 
        ? parseFloat(variant.price) || null
        : null;
      
      // Update
      await supabase
        .from('products')
        .update({ 
          url: productUrl,
          price: price,
          discounted_price: discounted_price
        })
        .eq('id', product.id);
      
      updated++;
      if (updated % 50 === 0) {
        console.log(`✓ Updated ${updated}/${products.length}`);
      }
    }
  } catch (err) {
    console.error(`Error updating product ${product.id}:`, err.message);
  }
}

console.log(`\n✅ Updated ${updated} products with URLs and correct prices!`);
