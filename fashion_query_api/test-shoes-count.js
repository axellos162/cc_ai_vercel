import { supabase } from './src/lib/db.js';

async function testShoesInNY() {
  // Count all products with shoes-related categories in New York
  const { data, error, count } = await supabase
    .from('products')
    .select('id, title, category, store:stores!inner(city, state)', { count: 'exact', head: false })
    .ilike('category', '%shoe%')
    .eq('stores.city', 'New York')
    .eq('stores.state', 'NY')
    .limit(20);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Total shoes in New York:', count);
  console.log('\nSample products:');
  data?.forEach(p => {
    console.log(`- ${p.title} (${p.category})`);
  });
}

testShoesInNY().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
