'use client'

import Image from 'next/image'

export default function ComparisonProductRow({ product }) {
  const {
    title,
    category,
    price,
    discounted_price,
    images = [],
    store = {}
  } = product

  const hasDiscount = discounted_price && discounted_price < price
  const storeDomain = store.domain
  const imageUrl = images[0]

  // Format price - no decimals if .00
  const formatPrice = (p) => {
    if (!p) return ''
    return p % 1 === 0 ? `$${p}` : `$${p.toFixed(2)}`
  }

  const rowContent = (
    <>
      {/* Left: Image */}
      <div className="relative flex-shrink-0" style={{ width: '48px', height: '64px' }}>
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title || 'Product'}
            fill
            className="object-cover"
            sizes="48px"
          />
        ) : (
          <div className="w-full h-full bg-bg-elevated" />
        )}
      </div>

      {/* Right: Info */}
      <div className="flex-1 pl-3 flex flex-col justify-center min-w-0">
        {/* Title */}
        <h4 
          className="font-display text-text-primary truncate"
          style={{
            fontSize: '14px',
            fontWeight: 400
          }}
        >
          {title}
        </h4>

        {/* Category */}
        {category && (
          <div 
            className="font-body text-text-tertiary mt-0.5"
            style={{ fontSize: '10px' }}
          >
            {category}
          </div>
        )}

        {/* Price */}
        <div className="flex items-center mt-1">
          {hasDiscount ? (
            <>
              <span 
                className="font-body text-text-tertiary line-through"
                style={{ fontSize: '10px' }}
              >
                {formatPrice(price)}
              </span>
              <span 
                className="font-body ml-1.5"
                style={{
                  fontSize: '11px',
                  fontWeight: 500,
                  color: 'var(--color-sale)'
                }}
              >
                {formatPrice(discounted_price)}
              </span>
            </>
          ) : (
            <span 
              className="font-body text-text-secondary"
              style={{ fontSize: '11px' }}
            >
              {formatPrice(price)}
            </span>
          )}
        </div>
      </div>
    </>
  )

  // Container with border and hover
  const containerClasses = "flex items-center h-18 border-b border-border-subtle hover:bg-bg-elevated transition-colors duration-200 cursor-pointer"

  // If store domain exists, render as link
  if (storeDomain) {
    return (
      <a
        href={`https://${storeDomain}`}
        target="_blank"
        rel="noopener noreferrer"
        className={containerClasses}
        style={{ height: '72px' }}
      >
        {rowContent}
      </a>
    )
  }

  // Otherwise render as div
  return (
    <div className={containerClasses} style={{ height: '72px' }}>
      {rowContent}
    </div>
  )
}
