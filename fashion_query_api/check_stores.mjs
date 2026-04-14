import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read .env.local
const envContent = readFileSync(__dirname + '/.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    env[match[1]] = match[2];
  }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const { data, error } = await supabase.from('stores').select('*');

if (error) {
  console.error('Error:', error);
} else {
  console.log('Total stores:', data.length);
  console.log('\nStores:');
  data.forEach(store => {
    console.log(`  ${store.name} - ${store.city}, ${store.state} (brand: ${store.brand_name})`);
    console.log(`    lat: ${store.lat}, lng: ${store.lng}`);
  });
}
