export const runtime = "nodejs";

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET - Fetch all brands with optional search filtering
export async function GET(request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    let query = supabase
      .from('brands')
      .select('id, name, style_description, price_segment')
      .order('name', { ascending: true })

    // Apply search filter if provided
    if (search && search.trim()) {
      query = query.ilike('name', `%${search.trim()}%`)
    }

    // Limit results to prevent overwhelming the UI
    query = query.limit(100)

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ brands: data || [] })
  } catch (error) {
    console.error('Error fetching brands:', error)
    return NextResponse.json(
      { error: 'Failed to fetch brands' },
      { status: 500 }
    )
  }
}
