import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function verifySql() {
  console.log('🔍 VERIFYING SQL CHANGES');
  console.log('=' .repeat(70));
  console.log();

  // Check 1: URL column exists
  console.log('Check 1: Verifying URL column exists...');
  const { data: urlCheck, error: error1 } = await supabase
    .from('products')
    .select('url')
    .limit(1);

  if (error1) {
    console.log('  ❌ FAILED: URL column does not exist');
    console.log('     Error:', error1.message);
    console.log('     Please run: ALTER TABLE products ADD COLUMN IF NOT EXISTS url TEXT;');
  } else {
    console.log('  ✅ SUCCESS: URL column exists');
  }
  console.log();

  // Check 2: Test match_products function with URL
  console.log('Check 2: Verifying match_products returns URL field...');
  const testEmbedding = new Array(1536).fill(0);

  const { data: funcCheck, error: error2 } = await supabase
    .rpc('match_products', {
      query_embedding: testEmbedding,
      match_count: 1
    });

  if (error2) {
    console.log('  ❌ FAILED: match_products function error');
    console.log('     Error:', error2.message);
    console.log('     Please update the function with SQL from /tmp/update_match_products.sql');
  } else if (funcCheck && funcCheck.length > 0 && 'url' in funcCheck[0]) {
    console.log('  ✅ SUCCESS: match_products returns URL field');
    console.log(`     Sample URL: ${funcCheck[0].url || '(null - will be populated by scraper)'}`);
  } else {
    console.log('  ❌ FAILED: match_products does not return URL field');
    console.log('     Please update the function with SQL from /tmp/update_match_products.sql');
  }
  console.log();

  console.log('=' .repeat(70));
  console.log();

  if (!error1 && !error2 && funcCheck && funcCheck.length > 0 && 'url' in funcCheck[0]) {
    console.log('🎉 ALL CHECKS PASSED!');
    console.log();
    console.log('✅ Database schema updated');
    console.log('✅ match_products function updated');
    console.log();
    console.log('🚀 Ready to run scraper:');
    console.log('   cd /Users/axellonnfors/Desktop/cc_ai/scraper');
    console.log('   node src/index.js');
  } else {
    console.log('⚠️  SOME CHECKS FAILED');
    console.log('   Please review the errors above and run the missing SQL commands.');
  }
  console.log();
}

verifySql().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
