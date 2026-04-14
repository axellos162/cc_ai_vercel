'use client'

import Image from 'next/image'
import { useState } from 'react'

export default function ProductCard({ product }) {
  const {
    title,
    price,
    discounted_price,
    effective_price,
    images = [],
    brand = {},
    store = {}
  } = product

  const [imageLoaded, setImageLoaded] = useState(false)
  const hasDiscount = discounted_price && discounted_price < price
  const storeDomain = store.domain
  const imageUrl = images[0]

  // Format price - no decimals if .00
  const formatPrice = (p) => {
    if (!p) return ''
    return p % 1 === 0 ? `$${p}` : `$${p.toFixed(2)}`
  }

  const cardContent = (
    <>
      {/* Image area - 3/4 aspect ratio */}
      <div className="relative w-full" style={{ aspectRatio: '3/4' }}>
        {imageUrl ? (
          <>
            <div 
              className={`absolute inset-0 ${imageLoaded ? 'hidden' : 'shimmer-bg'}`}
            />
            <Image
              src={imageUrl}
              alt={title || 'Product image'}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              onLoad={() => setImageLoaded(true)}
            />
          </>
        ) : (
          <div className="w-full h-full bg-bg-elevated flex items-center justify-center">
            <span className="text-text-tertiary text-2xl">·</span>
          </div>
        )}
      </div>

      {/* Info area */}
      <div className="p-3">
        {/* Brand name */}
        {brand.name && (
          <div 
            className="font-body text-text-secondary uppercase mb-1"
            style={{
              fontSize: '10px',
              letterSpacing: '0.1em'
            }}
          >
            {brand.name}
          </div>
        )}

        {/* Product title */}
        <h3 
          className="font-display text-text-primary"
          style={{
            fontSize: '15px',
            fontWeight: 400,
            lineHeight: 1.3,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {title}
        </h3>

        {/* Store and city */}
        {store.name && (
          <div 
            className="font-body text-text-tertiary mt-1.5"
            style={{ fontSize: '10px' }}
          >
            {store.name}{store.city ? ` · ${store.city}` : ''}
          </div>
        )}

        {/* Price area */}
        <div className="flex items-center mt-2">
          {hasDiscount ? (
            <>
              {/* Original price - struck through */}
              <span 
                className="font-body text-text-tertiary line-through"
                style={{ fontSize: '11px' }}
              >
                {formatPrice(price)}
              </span>
              
              {/* Sale price */}
              <span 
                className="font-body ml-1.5"
                style={{
                  fontSize: '12px',
                  fontWeight: 500,
                  color: 'var(--color-sale)'
                }}
              >
                {formatPrice(discounted_price)}
              </span>

              {/* SALE badge */}
              <span 
                className="font-body ml-1.5"
                style={{
                  fontSize: '9px',
                  padding: '1px 4px',
                  letterSpacing: '0.08em',
                  backgroundColor: 'var(--color-sale-bg)',
                  color: 'var(--color-sale)'
                }}
              >
                SALE
              </span>
            </>
          ) : (
            <span 
              className="font-body text-text-secondary"
              style={{ fontSize: '12px' }}
            >
              {formatPrice(effective_price || price)}
            </span>
          )}
        </div>
      </div>
    </>
  )

  // If store domain exists, render as link
  if (storeDomain) {
    return (
      <>
        <a
          href={`https://${storeDomain}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-bg-surface hover:bg-bg-elevated cursor-pointer transition-colors duration-200"
        >
          {cardContent}
        </a>
        <style jsx>{`
          .shimmer-bg {
            background: linear-gradient(90deg,
              var(--color-bg-elevated) 25%,
              var(--color-bg-overlay) 50%,
              var(--color-bg-elevated) 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
          }
        `}</style>
      </>
    )
  }

  // Otherwise render as div
  return (
    <>
      <div className="block bg-bg-surface">
        {cardContent}
      </div>
      <style jsx>{`
        .shimmer-bg {
          background: linear-gradient(90deg,
            var(--color-bg-elevated) 25%,
            var(--color-bg-overlay) 50%,
            var(--color-bg-elevated) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
      `}</style>
    </>
  )
}
