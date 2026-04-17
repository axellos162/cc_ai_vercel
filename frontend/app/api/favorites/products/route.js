export const runtime = "nodejs";

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET - Fetch user's favorite products or check if product is favorited
export async function GET(request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('product_id')

    // Check if specific product is favorited
    if (productId) {
      const { data, error } = await supabase
        .from('favorite_products')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error
      }

      return NextResponse.json({ isFavorited: !!data })
    }

    // Fetch all favorite products with product details
    const { data, error } = await supabase
      .from('favorite_products')
      .select(`
        id,
        created_at,
        product:products (
          id,
          title,
          price,
          discounted_price,
          effective_price,
          images,
          brand:brands (
            id,
            name
          ),
          store:stores (
            id,
            name,
            domain,
            city
          )
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Flatten the product data
    const favorites = data.map(fav => fav.product)

    return NextResponse.json({ favorites })
  } catch (error) {
    console.error('Error fetching favorite products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch favorites' },
      { status: 500 }
    )
  }
}

// POST - Add product to favorites
export async function POST(request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { product_id } = body

    if (!product_id) {
      return NextResponse.json({ error: 'product_id is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('favorite_products')
      .insert({
        user_id: user.id,
        product_id
      })
      .select()
      .single()

    if (error) {
      // Handle duplicate favorite (unique constraint violation)
      if (error.code === '23505') {
        return NextResponse.json({ message: 'Already favorited' }, { status: 200 })
      }
      throw error
    }

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error) {
    console.error('Error adding favorite product:', error)
    return NextResponse.json(
      { error: 'Failed to add favorite' },
      { status: 500 }
    )
  }
}

// DELETE - Remove product from favorites
export async function DELETE(request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('product_id')

    if (!productId) {
      return NextResponse.json({ error: 'product_id is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('favorite_products')
      .delete()
      .eq('user_id', user.id)
      .eq('product_id', productId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing favorite product:', error)
    return NextResponse.json(
      { error: 'Failed to remove favorite' },
      { status: 500 }
    )
  }
}
