import os
import psycopg2

# Parse the Supabase URL to get connection details
supabase_url = os.environ.get('SUPABASE_URL', '')
supabase_key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')

# Extract project ref from URL: https://<ref>.supabase.co
project_ref = supabase_url.replace('https://', '').replace('.supabase.co', '')

# Supabase connection string format
conn_string = f"postgresql://postgres.{project_ref}:{supabase_key.replace('sb_secret_', '')}@aws-0-us-west-1.pooler.supabase.com:6543/postgres"

sql = open('/tmp/match_products.sql').read()

try:
    conn = psycopg2.connect(conn_string)
    cur = conn.cursor()
    cur.execute(sql)
    conn.commit()
    print("✓ Function created successfully")
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
    print("\nPlease run the SQL manually in Supabase SQL Editor")
    print("SQL file location: /tmp/match_products.sql")
