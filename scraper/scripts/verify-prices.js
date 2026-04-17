import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function verifyPrices() {
  // Check for products with discounts
  const { data } = await supabase
    .from('products')
    .select('title, price, discounted_price, url, stores!inner(name)')
    .not('discounted_price', 'is', null)
    .gt('discounted_price', 0)
    .limit(10);

  console.log('📊 PRODUCTS WITH DISCOUNTED_PRICE > 0:\n');

  if (data && data.length > 0) {
    for (const p of data) {
      const isCorrect = p.discounted_price < p.price;
      console.log(`${isCorrect ? '✅' : '❌'} ${p.title}`);
      console.log(`   Price: $${p.price} | Discounted: $${p.discounted_price}`);
      console.log(`   URL: ${p.url}`);
      console.log(`   ${isCorrect ? 'CORRECT (discount < price)' : 'WRONG (discount > price)'}`);
      console.log();
    }
  } else {
    console.log('❌ No products with discounts found');
    console.log('\nChecking sample products:');

    const { data: sample } = await supabase
      .from('products')
      .select('title, price, discounted_price, url')
      .limit(3);

    sample.forEach(p => {
      console.log(`\n${p.title}`);
      console.log(`  Price: $${p.price} | Discounted: ${p.discounted_price || 'null'}`);
      console.log(`  URL: ${p.url}`);
    });
  }
}

verifyPrices().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
