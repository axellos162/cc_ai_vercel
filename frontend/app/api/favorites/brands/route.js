export const runtime = "nodejs";

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET - Fetch user's favorite brands or check if brand is favorited
export async function GET(request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const brandId = searchParams.get('brand_id')

    // Check if specific brand is favorited
    if (brandId) {
      const { data, error } = await supabase
        .from('favorite_brands')
        .select('id')
        .eq('user_id', user.id)
        .eq('brand_id', brandId)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      return NextResponse.json({ isFavorited: !!data })
    }

    // Fetch all favorite brands with brand details
    const { data, error } = await supabase
      .from('favorite_brands')
      .select(`
        id,
        created_at,
        brand:brands (
          id,
          name,
          style_tags,
          price_segment,
          style_description,
          top_categories
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Flatten the brand data
    const favorites = data.map(fav => fav.brand)

    return NextResponse.json({ favorites })
  } catch (error) {
    console.error('Error fetching favorite brands:', error)
    return NextResponse.json(
      { error: 'Failed to fetch favorites' },
      { status: 500 }
    )
  }
}

// POST - Add brand to favorites
export async function POST(request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { brand_id } = body

    if (!brand_id) {
      return NextResponse.json({ error: 'brand_id is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('favorite_brands')
      .insert({
        user_id: user.id,
        brand_id
      })
      .select()
      .single()

    if (error) {
      // Handle duplicate favorite
      if (error.code === '23505') {
        return NextResponse.json({ message: 'Already favorited' }, { status: 200 })
      }
      throw error
    }

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error) {
    console.error('Error adding favorite brand:', error)
    return NextResponse.json(
      { error: 'Failed to add favorite' },
      { status: 500 }
    )
  }
}

// DELETE - Remove brand from favorites
export async function DELETE(request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const brandId = searchParams.get('brand_id')

    if (!brandId) {
      return NextResponse.json({ error: 'brand_id is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('favorite_brands')
      .delete()
      .eq('user_id', user.id)
      .eq('brand_id', brandId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing favorite brand:', error)
    return NextResponse.json(
      { error: 'Failed to remove favorite' },
      { status: 500 }
    )
  }
}
