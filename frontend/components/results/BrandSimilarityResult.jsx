'use client';

import { useState } from 'react';

export default function BrandSimilarityResult({ result, onSearchBrands }) {
  const { brands, summary } = result.results.data;
  const [selectedBrands, setSelectedBrands] = useState([]);

  const toggleBrand = (brandId) => {
    setSelectedBrands(prev =>
      prev.includes(brandId)
        ? prev.filter(id => id !== brandId)
        : [...prev, brandId]
    );
  };

  const handleSearchSelected = () => {
    if (selectedBrands.length === 0) return;

    const selectedBrandNames = selectedBrands
      .map(id => brands.find(b => b.id === id)?.name)
      .filter(Boolean);

    const query = `Show products from ${selectedBrandNames.join(', ')}`;
    onSearchBrands?.(query);
  };

  // Extract source brand from filters if available
  const sourceBrand = result.filters?.brand || 'the selected brand';

  return (
    <div className="space-y-8">
      {/* Introductory text with editorial styling */}
      <div className="space-y-3">
        <p
          className="font-body text-text-secondary"
          style={{
            fontSize: '14px',
            lineHeight: 1.7,
            letterSpacing: '0.01em'
          }}
        >
          {summary}
        </p>
        <p
          className="font-body text-text-tertiary"
          style={{
            fontSize: '13px',
            lineHeight: 1.6,
            letterSpacing: '0.01em'
          }}
        >
          Select brands below and click "Show products" or ask in the chat.
        </p>
      </div>

      {/* Brand grid with staggered animation */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {brands.map((brand, index) => {
          const isSelected = selectedBrands.includes(brand.id);
          return (
            <div
              key={brand.id}
              onClick={() => toggleBrand(brand.id)}
              className="brand-card"
              style={{
                animationDelay: `${index * 50}ms`,
                borderColor: isSelected ? 'var(--color-border-accent)' : 'var(--color-border-default)',
                background: isSelected ? 'var(--color-bg-elevated)' : 'var(--color-bg-surface)'
              }}
            >
              {/* Accent indicator */}
              <div
                className="accent-bar"
                style={{
                  width: isSelected ? '100%' : '0%'
                }}
              />

              {/* Checkbox and Brand name */}
              <div className="flex items-start gap-3 mb-3">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleBrand(brand.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="custom-checkbox"
                />
                <h3
                  className="flex-1 font-display text-text-primary"
                  style={{
                    fontSize: '18px',
                    fontWeight: 400,
                    lineHeight: 1.3,
                    letterSpacing: '0.01em'
                  }}
                >
                  {brand.name}
                </h3>
              </div>

              {/* Similarity percentage with editorial styling */}
              <div className="flex items-center gap-3 mb-3 ml-7">
                <div className="flex-1 relative h-1 bg-bg-base overflow-hidden">
                  <div
                    className="absolute left-0 top-0 h-full"
                    style={{
                      width: `${brand.similarity}%`,
                      background: 'linear-gradient(90deg, var(--color-text-accent), var(--color-text-accent-bright))',
                      transition: 'width 600ms cubic-bezier(0.34, 1.56, 0.64, 1)'
                    }}
                  />
                </div>
                <span
                  className="font-mono editorial-number text-text-accent"
                  style={{
                    fontSize: '12px',
                    fontWeight: 500,
                    minWidth: '40px',
                    textAlign: 'right'
                  }}
                >
                  {brand.similarity}%
                </span>
              </div>

              {/* Product count */}
              <p
                className="font-mono text-text-tertiary ml-7"
                style={{
                  fontSize: '9px',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase'
                }}
              >
                {brand.product_count} item{brand.product_count !== 1 ? 's' : ''}
              </p>
            </div>
          );
        })}
      </div>

      {/* Action button with enhanced styling */}
      {brands.length > 0 && (
        <div className="flex justify-center pt-4">
          <button
            onClick={handleSearchSelected}
            disabled={selectedBrands.length === 0}
            className="action-button"
            style={{
              opacity: selectedBrands.length === 0 ? 0.4 : 1,
              transform: selectedBrands.length === 0 ? 'scale(0.98)' : 'scale(1)'
            }}
          >
            <span className="button-bg" />
            <span className="button-text">
              {selectedBrands.length === 0
                ? 'Select brands to view products'
                : `Show products from ${selectedBrands.length} brand${selectedBrands.length !== 1 ? 's' : ''}`
              }
            </span>
          </button>
        </div>
      )}

      {/* Empty state */}
      {brands.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <div
            className="font-display text-text-tertiary mb-2"
            style={{ fontSize: '36px' }}
          >
            —
          </div>
          <p
            className="font-body text-text-secondary"
            style={{ fontSize: '14px' }}
          >
            No similar brands found
          </p>
        </div>
      )}

      <style jsx>{`
        .brand-card {
          padding: 20px;
          border: 1px solid;
          cursor: pointer;
          transition: all var(--transition-base);
          position: relative;
          overflow: hidden;
          animation: fadeIn 400ms forwards;
          opacity: 0;
        }

        .brand-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(201, 185, 154, 0.05), transparent);
          transition: left 500ms cubic-bezier(0.4, 0.0, 0.2, 1);
        }

        .brand-card:hover::before {
          left: 100%;
        }

        .brand-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
        }

        .accent-bar {
          position: absolute;
          top: 0;
          left: 0;
          height: 2px;
          background: linear-gradient(90deg, var(--color-text-accent), transparent);
          transition: width 400ms cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .custom-checkbox {
          margin-top: 4px;
          width: 16px;
          height: 16px;
          border: 1px solid var(--color-border-default);
          background: transparent;
          cursor: pointer;
          position: relative;
          flex-shrink: 0;
          transition: all var(--transition-base);
        }

        .custom-checkbox:checked {
          background: var(--color-text-accent);
          border-color: var(--color-text-accent);
        }

        .custom-checkbox:checked::after {
          content: '';
          position: absolute;
          left: 5px;
          top: 2px;
          width: 4px;
          height: 8px;
          border: solid var(--color-bg-base);
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
        }

        .action-button {
          position: relative;
          padding: 14px 32px;
          font-family: var(--font-body);
          font-size: 13px;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          border: 1px solid var(--color-border-accent);
          cursor: pointer;
          transition: all var(--transition-base);
          overflow: hidden;
        }

        .action-button:disabled {
          cursor: not-allowed;
          border-color: var(--color-border-default);
        }

        .action-button:not(:disabled):hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 8px 24px rgba(201, 185, 154, 0.15);
        }

        .button-bg {
          position: absolute;
          inset: 0;
          background: var(--color-text-accent);
          opacity: 1;
          transition: opacity var(--transition-base);
        }

        .action-button:disabled .button-bg {
          opacity: 0.1;
        }

        .button-text {
          position: relative;
          color: var(--color-bg-base);
          transition: color var(--transition-base);
        }

        .action-button:disabled .button-text {
          color: var(--color-text-tertiary);
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
