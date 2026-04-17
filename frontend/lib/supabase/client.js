import { createBrowserClient } from '@supabase/ssr'

let client = null

export function createClient() {
  if (client) {
    return client
  }

  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
      }
    }
  )

  return client
}
