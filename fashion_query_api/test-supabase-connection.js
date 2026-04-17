#!/usr/bin/env node

// Test Supabase connection
console.log('🔍 Testing Supabase Connection');
console.log('================================');

// Check environment variables first, before importing db.js
function checkEnvironmentVariables() {
  console.log('\n📋 Checking Environment Variables:');
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl) {
    console.error('❌ SUPABASE_URL is not set');
    console.log('   Set it with: export SUPABASE_URL="https://your-project.supabase.co"');
    console.log('   Based on setup docs, your project ID appears to be: khxsqcuykkpsxvsoaboj');
    console.log('   So try: export SUPABASE_URL="https://khxsqcuykkpsxvsoaboj.supabase.co"');
    return false;
  }
  
  if (!supabaseKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY is not set');
    console.log('   Get this from your Supabase Dashboard > Settings > API');
    console.log('   Set it with: export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"');
    return false;
  }
  
  console.log('✅ SUPABASE_URL:', supabaseUrl);
  console.log('✅ SUPABASE_SERVICE_ROLE_KEY: [SET - length:', supabaseKey.length, 'chars]');
  return true;
}

async function testSupabaseConnection() {
  try {
    // Import after env check to avoid immediate failure
    const { supabase } = await import('./src/lib/db.js');
    
    console.log('\n🔗 Testing Database Connection:');
    
    // Test basic connection by querying system info
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .limit(1);
    
    if (error) {
      console.error('❌ Connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Successfully connected to Supabase!');
    console.log('✅ Database is accessible');
    
    // Try to list available tables
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (tablesError) {
      console.warn('⚠️  Could not list tables:', tablesError.message);
    } else {
      console.log('📋 Available tables:', tables.map(t => t.table_name).join(', ') || 'None found');
    }
    
    // Check for the specific match_products function mentioned in setup
    console.log('\n🔍 Checking for match_products function:');
    const { data: functions, error: funcError } = await supabase.rpc('match_products', {
      query_embedding: Array(1536).fill(0), // dummy embedding
      match_count: 1
    });
    
    if (funcError) {
      console.warn('⚠️  match_products function not found or not working:', funcError.message);
      console.log('   See SETUP_INSTRUCTIONS.md for how to create this function');
    } else {
      console.log('✅ match_products function is working!');
    }
    
    return true;
    
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    return false;
  }
}

async function runTest() {
  // First check environment variables
  if (!checkEnvironmentVariables()) {
    console.log('\n💡 To set up Supabase connection:');
    console.log('   1. Create a .env file with your Supabase credentials');
    console.log('   2. Or export the environment variables in your shell');
    console.log('   3. Get credentials from https://supabase.com/dashboard/project');
    process.exit(1);
  }
  
  // Then test the actual connection
  const success = await testSupabaseConnection();
  
  console.log('\n' + '='.repeat(40));
  if (success) {
    console.log('🎉 Supabase connection test PASSED!');
    process.exit(0);
  } else {
    console.log('💥 Supabase connection test FAILED!');
    process.exit(1);
  }
}

// Run the test
runTest().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
