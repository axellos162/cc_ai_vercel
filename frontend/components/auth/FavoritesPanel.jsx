'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import ProductCard from '@/components/ProductCard'

export default function FavoritesPanel({ isOpen, onClose }) {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('products')
  const [products, setProducts] = useState([])
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Brand search state
  const [searchQuery, setSearchQuery] = useState('')
  const [allBrands, setAllBrands] = useState([])
  const [filteredBrands, setFilteredBrands] = useState([])
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [loadingBrands, setLoadingBrands] = useState(false)
  const dropdownRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (isOpen && user) {
      fetchFavorites()
    }
  }, [isOpen, user, activeTab])

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Fetch all brands when brands tab is active
  useEffect(() => {
    if (isOpen && activeTab === 'brands' && allBrands.length === 0) {
      fetchAllBrands()
    }
  }, [isOpen, activeTab])

  // Filter brands based on search query
  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = allBrands.filter((brand) =>
        brand.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredBrands(filtered)
    } else {
      setFilteredBrands(allBrands)
    }
  }, [searchQuery, allBrands])

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setDropdownOpen(false)
      }
    }

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [dropdownOpen])

  const fetchAllBrands = async () => {
    setLoadingBrands(true)
    try {
      const response = await fetch('/api/brands')
      if (!response.ok) throw new Error('Failed to fetch brands')
      const data = await response.json()
      setAllBrands(data.brands || [])
      setFilteredBrands(data.brands || [])
    } catch (err) {
      console.error('Error fetching all brands:', err)
    } finally {
      setLoadingBrands(false)
    }
  }

  const fetchFavorites = async () => {
    setLoading(true)
    setError(null)

    try {
      const endpoint = activeTab === 'products' ? '/api/favorites/products' : '/api/favorites/brands'
      const response = await fetch(endpoint)
      if (!response.ok) throw new Error('Failed to fetch favorites')
      const data = await response.json()

      if (activeTab === 'products') {
        setProducts(data.favorites || [])
      } else {
        setBrands(data.favorites || [])
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddBrand = async (brandId) => {
    // Check if already favorited
    if (brands.find((b) => b.id === brandId)) {
      setDropdownOpen(false)
      setSearchQuery('')
      return
    }

    try {
      const response = await fetch('/api/favorites/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand_id: brandId }),
      })
      if (!response.ok) throw new Error('Failed to add favorite')

      // Optimistically add to UI
      const brandToAdd = allBrands.find((b) => b.id === brandId)
      if (brandToAdd) {
        setBrands([...brands, brandToAdd])
      }

      setDropdownOpen(false)
      setSearchQuery('')
    } catch (err) {
      setError(err.message)
    }
  }

  const handleRemoveProduct = async (productId) => {
    try {
      const response = await fetch(`/api/favorites/products?product_id=${productId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to remove favorite')
      setProducts(products.filter((p) => p.id !== productId))
    } catch (err) {
      setError(err.message)
    }
  }

  const handleRemoveBrand = async (brandId) => {
    try {
      const response = await fetch(`/api/favorites/brands?brand_id=${brandId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to remove favorite')
      setBrands(brands.filter((b) => b.id !== brandId))
    } catch (err) {
      setError(err.message)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[1000]"
        onClick={onClose}
        style={{
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
        }}
      />

      {/* Panel */}
      <div
        className="fixed right-0 top-0 bottom-0 w-full max-w-2xl z-[1001] overflow-y-auto animate-slide-in-right"
        style={{
          background: 'var(--color-bg-base)',
          borderLeft: '1px solid var(--color-border-default)',
          boxShadow: '-8px 0 24px rgba(0, 0, 0, 0.4)',
        }}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 px-6 py-5 border-b"
          style={{
            background: 'var(--color-bg-base)',
            borderColor: 'var(--color-border-default)',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2
              className="text-2xl"
              style={{
                fontFamily: 'var(--font-display)',
                color: 'var(--color-text-primary)',
                fontWeight: 300,
              }}
            >
              Favorites
            </h2>
            <button
              onClick={onClose}
              className="text-xl transition-all"
              style={{
                color: 'var(--color-text-secondary)',
              }}
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setActiveTab('products')}
              className="pb-2 px-1 text-sm transition-all"
              style={{
                fontFamily: 'var(--font-body)',
                color: activeTab === 'products' ? 'var(--color-text-accent)' : 'var(--color-text-secondary)',
                borderBottom: activeTab === 'products' ? '2px solid var(--color-text-accent)' : '2px solid transparent',
                fontWeight: activeTab === 'products' ? 500 : 400,
              }}
            >
              Products
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('brands')}
              className="pb-2 px-1 text-sm transition-all"
              style={{
                fontFamily: 'var(--font-body)',
                color: activeTab === 'brands' ? 'var(--color-text-accent)' : 'var(--color-text-secondary)',
                borderBottom: activeTab === 'brands' ? '2px solid var(--color-text-accent)' : '2px solid transparent',
                fontWeight: activeTab === 'brands' ? 500 : 400,
              }}
            >
              Brands
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="spinner w-6 h-6" />
            </div>
          )}

          {error && (
            <div
              className="p-4 text-sm mb-4"
              style={{
                background: 'rgba(220, 38, 38, 0.1)',
                border: '1px solid rgba(220, 38, 38, 0.3)',
                color: '#fca5a5',
                fontFamily: 'var(--font-body)',
              }}
            >
              {error}
            </div>
          )}

          {/* Products Tab */}
          {!loading && activeTab === 'products' && (
            <>
              {products.length === 0 ? (
                <div className="text-center py-12">
                  <div
                    className="text-6xl mb-4"
                    style={{ color: 'var(--color-text-tertiary)' }}
                  >
                    ♡
                  </div>
                  <p
                    className="text-lg mb-2"
                    style={{
                      fontFamily: 'var(--font-display)',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    No favorite products yet
                  </p>
                  <p
                    className="text-sm"
                    style={{
                      fontFamily: 'var(--font-body)',
                      color: 'var(--color-text-tertiary)',
                    }}
                  >
                    Click the heart icon on products to save them here
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {products.map((product) => (
                    <div key={product.id} className="relative">
                      <ProductCard product={product} />
                      <button
                        onClick={() => handleRemoveProduct(product.id)}
                        className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center transition-all z-10"
                        style={{
                          background: 'rgba(0, 0, 0, 0.8)',
                          color: 'var(--color-text-secondary)',
                          border: '1px solid var(--color-border-default)',
                        }}
                        aria-label="Remove from favorites"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Brands Tab */}
          {!loading && activeTab === 'brands' && (
            <>
              {/* Search Input */}
              <div className="mb-6 relative">
                <label
                  className="block mb-2"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '9px',
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    color: 'var(--color-text-tertiary)',
                  }}
                >
                  Add Brands
                </label>
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setDropdownOpen(true)
                    }}
                    onFocus={() => setDropdownOpen(true)}
                    placeholder="Search brands..."
                    className="w-full h-12 px-4 pr-10 outline-none transition-all brand-search-input"
                    style={{
                      background: 'var(--color-bg-elevated)',
                      border: '1px solid var(--color-border-default)',
                      color: 'var(--color-text-primary)',
                      fontFamily: 'var(--font-body)',
                      fontSize: '14px',
                    }}
                  />
                  <div
                    className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: 'var(--color-text-tertiary)' }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.35-4.35" />
                    </svg>
                  </div>
                  {/* Accent line on focus */}
                  <div
                    className="absolute bottom-0 left-0 h-0.5 bg-accent-line transition-all"
                    style={{
                      background: 'var(--color-border-accent)',
                      width: dropdownOpen ? '100%' : '0%',
                      transition: 'width var(--transition-base)',
                    }}
                  />
                </div>

                {/* Dropdown */}
                {dropdownOpen && filteredBrands.length > 0 && (
                  <div
                    ref={dropdownRef}
                    className="absolute z-10 w-full mt-2 max-h-64 overflow-y-auto animate-scale-in"
                    style={{
                      background: 'var(--color-bg-overlay)',
                      border: '1px solid var(--color-border-default)',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                      transformOrigin: 'top',
                    }}
                  >
                    {filteredBrands.map((brand) => {
                      const isFavorited = brands.find((b) => b.id === brand.id)
                      return (
                        <button
                          key={brand.id}
                          onClick={() => handleAddBrand(brand.id)}
                          disabled={isFavorited}
                          className="w-full px-4 py-3 text-left transition-all brand-dropdown-item"
                          style={{
                            background: 'transparent',
                            borderBottom: '1px solid var(--color-border-subtle)',
                            opacity: isFavorited ? 0.4 : 1,
                            cursor: isFavorited ? 'default' : 'pointer',
                          }}
                        >
                          <div
                            className="font-display mb-1"
                            style={{
                              fontSize: '15px',
                              color: 'var(--color-text-primary)',
                            }}
                          >
                            {brand.name}
                          </div>
                          {brand.style_description && (
                            <div
                              className="text-sm"
                              style={{
                                fontFamily: 'var(--font-body)',
                                color: 'var(--color-text-secondary)',
                                fontSize: '12px',
                              }}
                            >
                              {brand.style_description}
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Pills Display */}
              {brands.length === 0 ? (
                <div className="text-center py-12">
                  <div
                    className="text-6xl mb-4"
                    style={{ color: 'var(--color-text-tertiary)' }}
                  >
                    ♡
                  </div>
                  <p
                    className="text-lg mb-2"
                    style={{
                      fontFamily: 'var(--font-display)',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    No favorite brands yet
                  </p>
                  <p
                    className="text-sm"
                    style={{
                      fontFamily: 'var(--font-body)',
                      color: 'var(--color-text-tertiary)',
                    }}
                  >
                    Search and select brands above
                  </p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {brands.map((brand) => (
                    <div
                      key={brand.id}
                      className="brand-pill"
                      style={{
                        background: 'var(--color-bg-surface)',
                        border: '1px solid var(--color-border-default)',
                        padding: '8px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all var(--transition-base)',
                      }}
                    >
                      <span
                        style={{
                          fontFamily: 'var(--font-body)',
                          fontSize: '12px',
                          color: 'var(--color-text-primary)',
                        }}
                      >
                        {brand.name}
                      </span>
                      <button
                        onClick={() => handleRemoveBrand(brand.id)}
                        className="remove-pill-button"
                        style={{
                          width: '16px',
                          height: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--color-text-secondary)',
                          transition: 'all var(--transition-base)',
                          cursor: 'pointer',
                          background: 'none',
                          border: 'none',
                          padding: 0,
                        }}
                        aria-label={`Remove ${brand.name}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        .spinner {
          border: 2px solid var(--color-border-subtle);
          border-top: 2px solid var(--color-text-accent);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 300ms cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Brand search input */
        :global(.brand-search-input:focus) {
          border-color: var(--color-border-accent);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
        }
        :global(.brand-search-input:hover:not(:focus)) {
          border-color: var(--color-border-strong);
        }

        /* Dropdown items with sweep effect */
        :global(.brand-dropdown-item) {
          position: relative;
          overflow: hidden;
        }
        :global(.brand-dropdown-item::before) {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(201, 185, 154, 0.05), transparent);
          transition: left 500ms cubic-bezier(0.4, 0.0, 0.2, 1);
        }
        :global(.brand-dropdown-item:not(:disabled):hover::before) {
          left: 100%;
        }
        :global(.brand-dropdown-item:not(:disabled):hover) {
          background: var(--color-bg-elevated) !important;
        }

        /* Brand pills */
        :global(.brand-pill:hover) {
          border-color: var(--color-border-accent);
          transform: translateY(-1px);
        }
        :global(.remove-pill-button:hover) {
          color: var(--color-text-accent);
          transform: scale(1.1);
        }

        /* Scale in animation for dropdown */
        :global(.animate-scale-in) {
          animation: scaleIn 200ms cubic-bezier(0.4, 0, 0.2, 1);
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scaleY(0.95);
          }
          to {
            opacity: 1;
            transform: scaleY(1);
          }
        }
      `}</style>
    </>
  )
}
