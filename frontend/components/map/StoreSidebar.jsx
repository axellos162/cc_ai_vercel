'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

/**
 * Store inventory sidebar component
 * Displays store information and fetches/shows available products
 *
 * @param {Object} selectedStore - Currently selected store object
 * @param {Function} onClose - Called when sidebar close button is clicked
 * @param {Object} filters - Optional filters to pass to product API (category, etc.)
 * @param {Boolean} isOpen - Whether sidebar is open
 */
export default function StoreSidebar({
  selectedStore,
  onClose,
  filters = {},
  isOpen = false
}) {
  const [sidebarProducts, setSidebarProducts] = useState([])
  const [sidebarLoading, setSidebarLoading] = useState(false)

  // Fetch products when store is selected
  useEffect(() => {
    if (!selectedStore) {
      setSidebarProducts([])
      setSidebarLoading(false)
      return
    }

    const fetchProducts = async () => {
      setSidebarLoading(true)
      setSidebarProducts([])

      try {
        // Check if this is a favorites query (store has multiple brands)
        if (selectedStore.favorite_brands_carried && selectedStore.favorite_brands_carried.length > 0) {
          // FAVORITES CASE: Fetch products from each favorite brand in parallel
          const fetchPromises = selectedStore.favorite_brands_carried.map(brandName => {
            const url = new URL('/api/v1/products', window.location.origin)
            url.searchParams.set('brand', brandName)
            url.searchParams.set('store', selectedStore.name)
            url.searchParams.set('limit', '50')

            // Pass category filter if it exists
            if (filters?.category) {
              url.searchParams.set('category', filters.category)
            }

            return fetch(url.toString()).then(res => res.json())
          })

          const results = await Promise.all(fetchPromises)

          // Merge all products from different brands
          const allProducts = results.flatMap(data =>
            data?.results?.data?.products ?? []
          )

          setSidebarProducts(allProducts)
        } else {
          const url = new URL('/api/v1/products', window.location.origin)
          url.searchParams.set('limit', '50')

          if (filters?.category) {
            url.searchParams.set('category', filters.category)
          }

          // Explore view stores have an id but no brand_name — use store_id path
          if (selectedStore.id && !selectedStore.brand_name) {
            url.searchParams.set('store_id', selectedStore.id)
          } else {
            // Chat result stores have brand_name — use brand + store vector search path
            url.searchParams.set('brand', selectedStore.brand_name)
            url.searchParams.set('store', selectedStore.name)
          }

          const res = await fetch(url.toString())

          if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`)
          }

          const data = await res.json()
          const products = data?.results?.data?.products ?? []

          setSidebarProducts(products)
        }
      } catch (err) {
        console.error('Failed to fetch sidebar products:', err)
        setSidebarProducts([])
      } finally {
        setSidebarLoading(false)
      }
    }

    fetchProducts()
  }, [selectedStore, filters])

  const pulseStyles = '@keyframes sidebarPulse { 0%, 80%, 100% { opacity: 0.3; } 40% { opacity: 1; } } .sidebar-pulse-dot-1 { animation: sidebarPulse 1.4s ease-in-out infinite 0s; } .sidebar-pulse-dot-2 { animation: sidebarPulse 1.4s ease-in-out infinite 0.2s; } .sidebar-pulse-dot-3 { animation: sidebarPulse 1.4s ease-in-out infinite 0.4s; }'

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: pulseStyles }} />
      <div
        className="border-l border-border-subtle transition-all duration-300 relative"
        style={{
          width: isOpen ? '600px' : '0',
          height: '100%',
          overflowY: isOpen ? 'auto' : 'hidden',
          background: 'var(--color-bg-base)'
        }}
      >
        {selectedStore && isOpen && (
          <div style={{ padding: '28px' }}>
            {/* Close button */}
            <button
              onClick={onClose}
              className="font-body text-text-tertiary hover:text-text-primary cursor-pointer transition-colors"
              style={{ position: 'absolute', top: '16px', right: '16px', fontSize: '16px' }}
            >
              ×
            </button>

            {/* Store name */}
            <h3
              className="font-display text-text-primary pr-6"
              style={{
                fontSize: '22px',
                fontWeight: 400
              }}
            >
              {selectedStore.name}
            </h3>

            {/* City + state */}
            <p
              className="font-body text-text-secondary mt-1"
              style={{ fontSize: '12px' }}
            >
              {selectedStore.city}, {selectedStore.state}
            </p>

            {/* Brand carried */}
            {selectedStore.brand_name && (
              <div
                className="font-body text-text-accent uppercase mt-3"
                style={{
                  fontSize: '11px',
                  letterSpacing: '0.08em'
                }}
              >
                {selectedStore.brand_name}
              </div>
            )}

            {/* Product count */}
            {selectedStore.product_count > 0 && (
              <p
                className="font-body text-text-tertiary mt-0.5"
                style={{ fontSize: '11px' }}
              >
                {selectedStore.product_count} items available
              </p>
            )}

            {/* Favorite brands carried (for favorite brands queries) */}
            {selectedStore.favorite_brands_carried &&
             Array.isArray(selectedStore.favorite_brands_carried) &&
             selectedStore.favorite_brands_carried.length > 0 && (
              <div className="mt-4">
                <div
                  className="font-mono text-text-tertiary uppercase mb-2"
                  style={{
                    fontSize: '9px',
                    letterSpacing: '0.15em'
                  }}
                >
                  Your Favorites Here
                </div>
                <div className="flex flex-wrap gap-1">
                  {selectedStore.favorite_brands_carried.map(brand => (
                    <span
                      key={brand}
                      className="px-2 py-1"
                      style={{
                        background: 'var(--color-bg-accent)',
                        border: '1px solid var(--color-border-accent)',
                        color: 'var(--color-text-accent)',
                        fontFamily: 'var(--font-body)',
                        fontSize: '11px'
                      }}
                    >
                      {brand}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Products */}
            <div className="mt-5">
              <div
                className="font-body text-text-tertiary uppercase mb-2"
                style={{
                  fontSize: '10px',
                  letterSpacing: '0.1em'
                }}
              >
                Available now
              </div>

              {sidebarLoading ? (
                <div style={{ display: 'flex', gap: '6px', padding: '20px 0' }}>
                  <div
                    style={{
                      width: '4px',
                      height: '4px',
                      borderRadius: '50%',
                      background: 'var(--color-text-accent)',
                      opacity: 0.3
                    }}
                    className="sidebar-pulse-dot-1"
                  />
                  <div
                    style={{
                      width: '4px',
                      height: '4px',
                      borderRadius: '50%',
                      background: 'var(--color-text-accent)',
                      opacity: 0.3
                    }}
                    className="sidebar-pulse-dot-2"
                  />
                  <div
                    style={{
                      width: '4px',
                      height: '4px',
                      borderRadius: '50%',
                      background: 'var(--color-text-accent)',
                      opacity: 0.3
                    }}
                    className="sidebar-pulse-dot-3"
                  />
                </div>
              ) : sidebarProducts.length > 0 ? (
                <div
                  className="grid grid-cols-2"
                  style={{ gap: '1px' }}
                >
                  {sidebarProducts.map((product) => (
                    <div key={product.id}>
                      <div
                        className="relative"
                        style={{
                          aspectRatio: '3/4',
                          background: 'var(--color-bg-elevated)'
                        }}
                      >
                        {product.images && product.images.length > 0 && (
                          <Image
                            src={product.images[0]}
                            alt={product.title}
                            fill
                            className="object-cover"
                            sizes="280px"
                          />
                        )}
                      </div>
                      <div style={{ padding: '8px 4px' }}>
                        <p
                          className="font-display text-text-primary"
                          style={{
                            fontSize: '13px',
                            lineHeight: '1.3',
                            marginBottom: '4px'
                          }}
                        >
                          {product.title}
                        </p>
                        <div className="font-body" style={{ fontSize: '11px' }}>
                          {product.discounted_price > 0 ? (
                            <>
                              <span
                                className="text-text-tertiary"
                                style={{ textDecoration: 'line-through', marginRight: '6px' }}
                              >
                                ${product.price}
                              </span>
                              <span className="text-text-accent">
                                ${product.discounted_price}
                              </span>
                            </>
                          ) : (
                            <span className="text-text-secondary">
                              ${product.price}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p
                  className="font-body text-text-tertiary"
                  style={{ fontSize: '11px' }}
                >
                  No products available
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
