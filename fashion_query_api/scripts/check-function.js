import './src/load-env.js';
import { supabase } from './src/lib/db.js';

// Test if match_products function exists
try {
  const { data, error } = await supabase.rpc('match_products', {
    query_embedding: new Array(1536).fill(0),
    match_count: 1
  });
  
  if (error) {
    if (error.message.includes('Could not find')) {
      console.log('❌ match_products function does NOT exist in Supabase');
      console.log('\nPlease run the SQL from /tmp/match_products.sql in Supabase SQL Editor:');
      console.log('1. Go to https://supabase.com/dashboard/project');
      console.log('2. Select your project');
      console.log('3. Go to SQL Editor');
      console.log('4. Paste and run the SQL from /tmp/match_products.sql');
    } else {
      console.log('❌ Error testing function:', error.message);
    }
  } else {
    console.log('✓ match_products function exists and is working!');
    console.log(`  Returned ${data?.length || 0} results`);
  }
} catch (err) {
  console.log('❌ Error:', err.message);
}
