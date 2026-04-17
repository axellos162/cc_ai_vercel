export const runtime = "nodejs";

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET - Fetch user's search history
export async function GET(request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const { data, error } = await supabase
      .from('search_history')
      .select('id, query, intent, filters, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return NextResponse.json({ history: data || [] })
  } catch (error) {
    console.error('Error fetching search history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    )
  }
}

// DELETE - Clear search history or delete specific item
export async function DELETE(request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (id) {
      // Delete specific item
      const { error } = await supabase
        .from('search_history')
        .delete()
        .eq('user_id', user.id)
        .eq('id', id)

      if (error) throw error
    } else {
      // Clear all history
      const { error } = await supabase
        .from('search_history')
        .delete()
        .eq('user_id', user.id)

      if (error) throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting search history:', error)
    return NextResponse.json(
      { error: 'Failed to delete history' },
      { status: 500 }
    )
  }
}
