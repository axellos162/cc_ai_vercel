import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function updateSession(request) {
  let supabaseResponse = NextResponse.next({ request })

  const SUPABASE_URL = process.env.SUPABASE_URL
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Supabase environment variables are not set. Ensure SUPABASE_URL and SUPABASE_ANON_KEY are provided on the server (do not expose keys to the client).')
    return supabaseResponse
  }

  const supabase = createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired (handle errors explicitly)
  try {
    const { data: { user } = {}, error } = await supabase.auth.getUser();
    if (error) {
      console.error('Supabase auth.getUser error:', error);
      return supabaseResponse;
    }
    if (!user) {
      // No valid session; continue without exposing user data
      return supabaseResponse;
    }
  } catch (err) {
    console.error('Unexpected error retrieving Supabase user:', err);
    return supabaseResponse;
  }

  return supabaseResponse
}
