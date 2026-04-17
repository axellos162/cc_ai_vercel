'use client'

import Image from 'next/image'
import { useState } from 'react'
import FavoriteButton from './auth/FavoriteButton'

export default function ProductCard({ product, onAuthRequired }) {
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
  const [isHovered, setIsHovered] = useState(false)
  const hasDiscount = discounted_price && discounted_price < price
  const storeDomain = store.domain
  const imageUrl = images[0]

  // Format price - editorial style with tabular numbers
  const formatPrice = (p) => {
    if (!p) return ''
    return p % 1 === 0 ? `$${p}` : `$${p.toFixed(2)}`
  }

  const cardContent = (
    <>
      {/* Image area - 3/4 aspect ratio */}
      <div
        className="relative w-full overflow-hidden"
        style={{ aspectRatio: '3/4' }}
      >
        {/* Favorite Button */}
        <div className="absolute top-2 right-2 z-10">
          <FavoriteButton
            productId={product.id}
            onAuthRequired={onAuthRequired}
          />
        </div>

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
              style={{
                transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                transition: 'transform 600ms cubic-bezier(0.34, 1.56, 0.64, 1)'
              }}
              onLoad={() => setImageLoaded(true)}
            />
            {/* Subtle overlay on hover */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(180deg, transparent 70%, rgba(0,0,0,0.08))',
                opacity: isHovered ? 1 : 0,
                transition: 'opacity 400ms ease'
              }}
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--color-bg-elevated)' }}>
            <span className="text-3xl" style={{ color: 'var(--color-text-tertiary)' }}>—</span>
          </div>
        )}
      </div>

      {/* Info area */}
      <div className="p-4 relative">
        {/* Accent line */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background: 'linear-gradient(90deg, var(--color-border-accent), transparent)',
            opacity: isHovered ? 1 : 0,
            transition: 'opacity 300ms ease'
          }}
        />

        {/* Brand name */}
        {brand.name && (
          <div
            className="font-mono text-text-secondary uppercase mb-2"
            style={{
              fontSize: '9px',
              letterSpacing: '0.15em',
              fontWeight: 500
            }}
          >
            {brand.name}
          </div>
        )}

        {/* Product title */}
        <h3
          className="font-display text-text-primary mb-3"
          style={{
            fontSize: '16px',
            fontWeight: 400,
            lineHeight: 1.4,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: '44px'
          }}
        >
          {title}
        </h3>

        {/* Store and city */}
        {store.name && (
          <div
            className="font-mono text-text-tertiary mb-3"
            style={{
              fontSize: '9px',
              letterSpacing: '0.05em'
            }}
          >
            {store.name}{store.city ? ` • ${store.city}` : ''}
          </div>
        )}

        {/* Price area */}
        <div className="flex items-baseline gap-2">
          {hasDiscount ? (
            <>
              {/* Sale price - featured */}
              <span
                className="font-mono editorial-number"
                style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'var(--color-sale)'
                }}
              >
                {formatPrice(discounted_price)}
              </span>

              {/* Original price - struck through */}
              <span
                className="font-mono editorial-number text-text-tertiary line-through"
                style={{ fontSize: '11px' }}
              >
                {formatPrice(price)}
              </span>

              {/* SALE badge */}
              <span
                className="font-mono ml-auto"
                style={{
                  fontSize: '8px',
                  padding: '2px 6px',
                  letterSpacing: '0.1em',
                  backgroundColor: 'var(--color-sale-bg)',
                  color: 'var(--color-sale)',
                  border: '1px solid var(--color-sale)',
                  opacity: 0.8
                }}
              >
                SALE
              </span>
            </>
          ) : (
            <span
              className="font-mono editorial-number text-text-secondary"
              style={{ fontSize: '13px', fontWeight: 400 }}
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
          className="product-card group"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {cardContent}
        </a>
        <style jsx>{`
          .product-card {
            display: block;
            background: var(--color-bg-surface);
            cursor: pointer;
            position: relative;
            transition: all var(--transition-base);
          }
          .product-card::before {
            content: '';
            position: absolute;
            inset: 0;
            border: 1px solid transparent;
            transition: border-color var(--transition-base);
            pointer-events: none;
          }
          .product-card:hover::before {
            border-color: var(--color-border-default);
          }
          .product-card:hover {
            background: var(--color-bg-elevated);
            transform: translateY(-2px);
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
          }

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
      <div className="product-card">
        {cardContent}
      </div>
      <style jsx>{`
        .product-card {
          display: block;
          background: var(--color-bg-surface);
        }

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
