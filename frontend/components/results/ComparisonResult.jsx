'use client'

import { useState } from 'react'
import ResultMeta from '../ResultMeta'
import ComparisonProductRow from '../ComparisonProductRow'

export default function ComparisonResult({ data, result }) {
  const { brand_a, brand_b } = data || {}
  const [activeTab, setActiveTab] = useState('a')

  // Calculate average price for a brand
  const calculateAvg = (products) => {
    if (!products || products.length === 0) return 0
    const sum = products.reduce((acc, p) => acc + (p.effective_price || p.price || 0), 0)
    const avg = sum / products.length
    return avg % 1 === 0 ? avg : Math.round(avg)
  }

  const avgA = calculateAvg(brand_a?.products)
  const avgB = calculateAvg(brand_b?.products)

  const renderBrandColumn = (brand, avg) => {
    if (!brand || !brand.products) return null

    const products = brand.products.slice(0, 8)
    const hasMore = brand.products.length > 8

    return (
      <div>
        {/* Header */}
        <div className="border-b border-border-subtle pb-3 mb-4">
          <h3 
            className="font-display text-text-primary uppercase"
            style={{
              fontSize: '18px',
              letterSpacing: '0.15em'
            }}
          >
            {brand.name}
          </h3>
          <p 
            className="font-body text-text-tertiary mt-1"
            style={{ fontSize: '11px' }}
          >
            avg. ${avg}
          </p>
        </div>

        {/* Product list */}
        <div>
          {products.map((product) => (
            <ComparisonProductRow key={product.id} product={product} />
          ))}
        </div>

        {/* See all link */}
        {hasMore && (
          <div className="mt-3">
            <button 
              className="font-body text-text-accent"
              style={{ fontSize: '11px' }}
            >
              See all {brand.products.length}
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      {result && <ResultMeta result={result} />}

      {/* Desktop layout: side by side */}
      <div className="hidden md:flex" style={{ gap: '1px' }}>
        <div className="flex-1">
          {renderBrandColumn(brand_a, avgA)}
        </div>
        <div className="flex-1">
          {renderBrandColumn(brand_b, avgB)}
        </div>
      </div>

      {/* Mobile layout: tabs */}
      <div className="md:hidden">
        {/* Tab labels */}
        <div className="flex border-b border-border-subtle">
          <button
            onClick={() => setActiveTab('a')}
            className="flex-1 font-body py-3 transition-colors"
            style={{
              fontSize: '13px',
              borderBottom: activeTab === 'a' ? '1px solid var(--color-text-accent)' : 'none',
              color: activeTab === 'a' ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)'
            }}
          >
            {brand_a?.name || 'Brand A'}
          </button>
          <button
            onClick={() => setActiveTab('b')}
            className="flex-1 font-body py-3 transition-colors"
            style={{
              fontSize: '13px',
              borderBottom: activeTab === 'b' ? '1px solid var(--color-text-accent)' : 'none',
              color: activeTab === 'b' ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)'
            }}
          >
            {brand_b?.name || 'Brand B'}
          </button>
        </div>

        {/* Active tab content */}
        <div className="mt-4">
          {activeTab === 'a' && renderBrandColumn(brand_a, avgA)}
          {activeTab === 'b' && renderBrandColumn(brand_b, avgB)}
        </div>
      </div>
    </div>
  )
}
