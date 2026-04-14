'use client'

import Image from 'next/image'
import ResultMeta from '../ResultMeta'

export default function AvailabilityResult({ data, result }) {
  const { available, store_name, city, brand_name, sample_images = [] } = data || {}

  return (
    <div>
      {result && <ResultMeta result={result} />}

      {/* Availability answer block */}
      <div className="flex items-start gap-3">
        {available ? (
          <>
            <span 
              className="text-text-accent"
              style={{ fontSize: '18px' }}
            >
              ✓
            </span>
            <p 
              className="font-display text-text-primary"
              style={{
                fontSize: '24px',
                fontWeight: 300,
                lineHeight: 1.3
              }}
            >
              {brand_name} is available at {store_name}, {city}
            </p>
          </>
        ) : (
          <>
            <span 
              className="text-text-tertiary"
              style={{ fontSize: '18px' }}
            >
              ·
            </span>
            <p 
              className="font-display text-text-secondary"
              style={{
                fontSize: '24px',
                fontWeight: 300,
                lineHeight: 1.3
              }}
            >
              We couldn't find {brand_name} in {city}
            </p>
          </>
        )}
      </div>

      {/* Sample images if available */}
      {available && sample_images.length > 0 && (
        <div className="mt-8">
          <div 
            className="font-body text-text-tertiary uppercase mb-3"
            style={{
              fontSize: '10px',
              letterSpacing: '0.1em'
            }}
          >
            From the collection
          </div>

          <div 
            className="flex overflow-x-auto"
            style={{ gap: '1px' }}
          >
            {sample_images.slice(0, 6).map((img, idx) => (
              <div 
                key={idx}
                className="relative bg-bg-elevated flex-shrink-0"
                style={{
                  width: '140px',
                  aspectRatio: '3/4'
                }}
              >
                <Image
                  src={img}
                  alt="Product from collection"
                  fill
                  className="object-cover"
                  sizes="140px"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
