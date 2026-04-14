import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function runSqlUpdates() {
  console.log('🔧 RUNNING SQL UPDATES IN SUPABASE');
console.log('=' .repeat(70));
console.log();

// Step 1: Add URL column
console.log('Step 1: Adding URL column to products table...');
const addColumnSQL = `
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS url TEXT;
`;

const { error: error1 } = await supabase.rpc('exec', { sql: addColumnSQL }).catch(() => ({ error: null }));

if (error1) {
  console.log('  ⚠️  Note: Cannot execute via RPC. Please run manually:');
  console.log('     ALTER TABLE products ADD COLUMN IF NOT EXISTS url TEXT;');
  console.log();
} else {
  console.log('  ✅ URL column added (or already exists)');
  console.log();
}

// Step 2: Add index
console.log('Step 2: Adding index on URL column...');
const addIndexSQL = `
CREATE INDEX IF NOT EXISTS idx_products_url ON products(url);
`;

const { error: error2 } = await supabase.rpc('exec', { sql: addIndexSQL }).catch(() => ({ error: null }));

if (error2) {
  console.log('  ⚠️  Note: Cannot execute via RPC. Please run manually:');
  console.log('     CREATE INDEX IF NOT EXISTS idx_products_url ON products(url);');
  console.log();
} else {
  console.log('  ✅ Index created (or already exists)');
  console.log();
}

// Step 3: Update match_products function
console.log('Step 3: Updating match_products function...');
const updateFunctionSQL = fs.readFileSync('/tmp/update_match_products.sql', 'utf8');

const { error: error3 } = await supabase.rpc('exec', { sql: updateFunctionSQL }).catch(() => ({ error: null }));

if (error3) {
  console.log('  ⚠️  Cannot execute via RPC.');
  console.log('  Please run the SQL from /tmp/update_match_products.sql manually.');
  console.log();
} else {
  console.log('  ✅ match_products function updated');
  console.log();
}

console.log('=' .repeat(70));
console.log('\n📝 MANUAL STEPS REQUIRED:');
console.log('\nIf any steps failed above, run these SQL commands in Supabase SQL Editor:');
console.log('\n1. Add URL column:');
console.log('   ALTER TABLE products ADD COLUMN IF NOT EXISTS url TEXT;');
console.log('\n2. Add index:');
console.log('   CREATE INDEX IF NOT EXISTS idx_products_url ON products(url);');
console.log('\n3. Update function:');
  console.log('   Copy and run SQL from: /tmp/update_match_products.sql');
  console.log('\nSupabase SQL Editor: https://supabase.com/dashboard/project');
  console.log();
}

runSqlUpdates().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
