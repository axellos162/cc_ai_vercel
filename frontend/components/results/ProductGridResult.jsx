'use client'

import { useState } from 'react'
import ResultMeta from '../ResultMeta'
import ProductCard from '../ProductCard'

export default function ProductGridResult({ data, result, onAuthRequired }) {
  const products = data?.products || []
  const [visibleCount, setVisibleCount] = useState(12)

  // Get unique brand names from products
  const brands = [...new Set(products.map(p => p.brand?.name).filter(Boolean))]
  const brandText = brands.join(', ')

  const visibleProducts = products.slice(0, visibleCount)
  const remaining = products.length - visibleCount

  const loadMore = () => {
    setVisibleCount(prev => Math.min(prev + 12, products.length))
  }

  return (
    <div>
      {result && <ResultMeta result={result} />}

      <div
        style={{
          maxHeight: 'calc(100vh - 280px)',
          overflowY: 'auto'
        }}
      >
      {products.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-20">
          <div 
            className="font-display text-text-tertiary"
            style={{ fontSize: '48px' }}
          >
            ·
          </div>
          <p 
            className="font-display text-text-secondary mt-2"
            style={{
              fontSize: '20px',
              fontWeight: 300
            }}
          >
            No results found.
          </p>
          <p 
            className="font-body text-text-tertiary mt-1"
            style={{ fontSize: '12px' }}
          >
            Try a different city, brand, or price range.
          </p>
        </div>
      ) : (
        <>
          {/* Section header */}
          <div className="flex items-center justify-between mb-6">
            <div 
              className="font-display text-text-secondary uppercase"
              style={{
                fontSize: '13px',
                letterSpacing: '0.08em'
              }}
            >
              {brandText || 'Products'}
            </div>
            <div 
              className="font-body text-text-tertiary"
              style={{ fontSize: '11px' }}
            >
              {products.length} items
            </div>
          </div>

          {/* Product grid with 1px gap */}
          <div 
            className="grid"
            style={{
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '1px'
            }}
          >
            {visibleProducts.map((product) => (
              <ProductCard key={product.id} product={product} onAuthRequired={onAuthRequired} />
            ))}
          </div>

          {/* Load more button */}
          {remaining > 0 && (
            <button
              onClick={loadMore}
              className="load-more-btn"
            >
              Load {remaining} more
            </button>
          )}
        </>
      )}
      </div>

      <style jsx>{`
        .load-more-btn {
          width: 100%;
          height: 40px;
          margin-top: 1px;
          background: transparent;
          border: 1px solid var(--color-border-default);
          border-radius: 2px;
          font-family: var(--font-body);
          font-size: 12px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--color-text-secondary);
          cursor: pointer;
          transition: border-color var(--transition-base), color var(--transition-base);
        }
        .load-more-btn:hover {
          border-color: var(--color-border-strong);
          color: var(--color-text-primary);
        }
      `}</style>
    </div>
  )
}
