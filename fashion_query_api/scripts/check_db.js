import './src/load-env.js';
import { supabase } from './src/lib/db.js';

const { data, error } = await supabase
  .from('products')
  .select(`
    id,
    title,
    price,
    discounted_price,
    images,
    stores!inner(name, city, state),
    brands(name)
  `)
  .eq('stores.city', 'New York')
  .not('discounted_price', 'is', null)
  .neq('discounted_price', 0)
  .limit(5);

if (error) {
  console.error('Error:', error);
  process.exit(1);
}

console.log('🔍 CHECKING DATABASE: Discounted items in New York');
console.log('=' .repeat(70));
console.log();

for (const p of data) {
  console.log(`Product: ${p.title}`);
  console.log(`  Brand: ${p.brands?.name || 'N/A'}`);
  console.log(`  Store: ${p.stores.name} (${p.stores.city}, ${p.stores.state})`);
  console.log(`  Price: $${p.price}`);
  console.log(`  Discounted Price: $${p.discounted_price}`);
  console.log(`  Effective Price: $${Math.min(p.price || 999999, p.discounted_price || 999999)}`);
  console.log();
  console.log(`  Image URLs from database:`);
  if (p.images && p.images.length > 0) {
    p.images.slice(0, 2).forEach((img, i) => {
      console.log(`    ${i + 1}. ${img}`);
    });
  }
  console.log();
  console.log(`  ⚠️  ISSUE: Price ($${p.price}) vs Discounted ($${p.discounted_price})`);
  if (p.discounted_price > p.price) {
    console.log(`  ❌ ERROR: discounted_price is HIGHER than regular price!`);
    console.log(`  This data is incorrect or the fields are reversed.`);
  }
  console.log();
  console.log('-'.repeat(70));
  console.log();
}
