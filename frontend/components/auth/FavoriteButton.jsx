'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export default function FavoriteButton({ productId, brandId, onAuthRequired }) {
  const { user } = useAuth()
  const [isFavorited, setIsFavorited] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      checkFavoriteStatus()
    } else {
      setIsFavorited(false)
    }
  }, [user, productId, brandId])

  const checkFavoriteStatus = async () => {
    try {
      const endpoint = productId
        ? `/api/favorites/products?product_id=${productId}`
        : `/api/favorites/brands?brand_id=${brandId}`
      const response = await fetch(endpoint)
      if (response.ok) {
        const data = await response.json()
        setIsFavorited(data.isFavorited)
      }
    } catch (err) {
      console.error('Failed to check favorite status:', err)
    }
  }

  const handleToggle = async (e) => {
    e.stopPropagation()
    e.preventDefault()

    if (!user) {
      onAuthRequired?.()
      return
    }

    setLoading(true)

    try {
      const endpoint = productId
        ? '/api/favorites/products'
        : '/api/favorites/brands'

      if (isFavorited) {
        // Remove from favorites
        const queryParam = productId
          ? `product_id=${productId}`
          : `brand_id=${brandId}`
        const response = await fetch(`${endpoint}?${queryParam}`, {
          method: 'DELETE',
        })
        if (!response.ok) throw new Error('Failed to remove favorite')
        setIsFavorited(false)
      } else {
        // Add to favorites
        const body = productId
          ? { product_id: productId }
          : { brand_id: brandId }
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!response.ok) throw new Error('Failed to add favorite')
        setIsFavorited(true)
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className="flex items-center justify-center transition-all heart-button"
      style={{
        width: '36px',
        height: '36px',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(8px)',
        border: 'none',
        color: isFavorited ? '#ef4444' : 'var(--color-text-secondary)',
        cursor: loading ? 'wait' : 'pointer',
      }}
      aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill={isFavorited ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.5"
        className={isFavorited ? 'heart-filled' : ''}
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>

      <style jsx>{`
        .heart-button:hover {
          transform: scale(1.1);
        }
        .heart-filled {
          animation: pulse 0.3s ease-out;
        }
        @keyframes pulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
          }
        }
      `}</style>
    </button>
  )
}
