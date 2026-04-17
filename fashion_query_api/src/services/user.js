import { supabase } from '../lib/db.js'

/**
 * Save a user's search query to their history
 * @param {string} userId - The user's UUID
 * @param {string} query - The search query
 * @param {string} intent - The classified intent
 * @param {object} filters - Optional filters applied
 * @returns {Promise<object>} Result of the insert operation
 */
export async function saveSearchHistory(userId, query, intent, filters = null) {
  // Basic input validation to avoid malformed values reaching the DB
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/
  if (!userId || typeof userId !== 'string' || !uuidRegex.test(userId)) {
    return { success: false, error: new Error('Invalid userId') }
  }
  if (typeof query !== 'string' || query.trim().length === 0 || query.length > 1000) {
    return { success: false, error: new Error('Invalid query') }
  }
  if (intent != null && typeof intent !== 'string') {
    return { success: false, error: new Error('Invalid intent') }
  }
  if (filters != null && typeof filters !== 'object') {
    return { success: false, error: new Error('Invalid filters') }
  }

  try {
    const safeFilters = filters ? JSON.stringify(filters) : null
    const { data, error } = await supabase
      .from('search_history')
      .insert({
        user_id: userId,
        query: query.trim(),
        intent: intent ? intent.trim() : null,
        filters: safeFilters
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving search history:', error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (err) {
    console.error('Exception saving search history:', err)
    return { success: false, error: err }
  }
}

/**
 * Get a user's favorite product IDs for personalization
 * @param {string} userId - The user's UUID
 * @returns {Promise<string[]>} Array of product IDs
 */
export async function getFavoriteProductIds(userId) {
  try {
    const { data, error } = await supabase
      .from('favorite_products')
      .select('product_id')
      .eq('user_id', userId)

    if (error) {
      console.error('Error fetching favorite products:', error)
      return []
    }

    return data.map(fav => fav.product_id)
  } catch (err) {
    console.error('Exception fetching favorite products:', err)
    return []
  }
}

/**
 * Get a user's favorite brand IDs for personalization
 * @param {string} userId - The user's UUID
 * @returns {Promise<string[]>} Array of brand IDs
 */
export async function getFavoriteBrandIds(userId) {
  try {
    const { data, error } = await supabase
      .from('favorite_brands')
      .select('brand_id')
      .eq('user_id', userId)

    if (error) {
      console.error('Error fetching favorite brands:', error)
      return []
    }

    return data.map(fav => fav.brand_id)
  } catch (err) {
    console.error('Exception fetching favorite brands:', err)
    return []
  }
}

/**
 * Get a user's favorite brand names for store searching
 * @param {string} userId - The user's UUID
 * @returns {Promise<string[]>} Array of brand names
 */
export async function getUserFavoriteBrands(userId) {
  if (!userId) {
    return []
  }

  try {
    const { data, error } = await supabase
      .from('favorite_brands')
      .select(`
        brand_id,
        brands!inner(name)
      `)
      .eq('user_id', userId)

    if (error) {
      console.error('Error fetching user favorite brands:', error)
      return []
    }

    // Extract brand names from the joined data
    return data.map(fav => fav.brands.name).filter(Boolean)
  } catch (err) {
    console.error('Exception in getUserFavoriteBrands:', err)
    return []
  }
}
