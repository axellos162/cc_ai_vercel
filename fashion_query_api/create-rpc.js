import './src/load-env.js';
import { supabase } from './src/lib/db.js';
import fs from 'fs';

const sql = fs.readFileSync('/tmp/match_products.sql', 'utf8');

const { error } = await supabase.rpc('exec_sql', { sql_query: sql }).catch(async () => {
  // Try direct query if rpc doesn't exist
  const result = await supabase.from('_sql').insert({ query: sql });
  return result;
});

if (error) {
  console.error('Error creating function:', error);
  console.log('\nPlease run the following SQL manually in Supabase SQL Editor:');
  console.log(sql);
} else {
  console.log('✓ Function created successfully');
}
