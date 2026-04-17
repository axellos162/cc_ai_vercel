export const runtime = "nodejs";

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession({ code })
      if (error) {
        console.error('Failed to exchange code for session:', error)
        return NextResponse.redirect(`${origin}/?error=auth_exchange_failed`)
      }
    } catch (err) {
      console.error('Exception exchanging code for session:', err)
      return NextResponse.redirect(`${origin}/?error=auth_exchange_exception`)
    }
  }

  return NextResponse.redirect(`${origin}/`)
}
