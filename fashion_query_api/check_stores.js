import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkStores() {
  const { data, error } = await supabase
    .from('stores')
    .select('id, name, city, state, brand_name, lat, lng');
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Total stores:', data.length);
    console.log('\nStores:');
    data.forEach(store => {
      console.log(`  ${store.name} - ${store.city}, ${store.state} (${store.brand_name})`);
    });
  }
}

checkStores();
