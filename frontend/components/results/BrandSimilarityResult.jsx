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
    <div className="space-y-6">
      {/* Introductory text */}
      <div className="space-y-2">
        <p className="text-sm text-neutral-300">
          {summary}
        </p>
        <p className="text-sm text-neutral-400">
          Would you like to see products from any of them? Select brands below and click "Show products" or ask in the chat.
        </p>
      </div>

      {/* Brand grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {brands.map((brand) => {
          const isSelected = selectedBrands.includes(brand.id);
          return (
            <div
              key={brand.id}
              onClick={() => toggleBrand(brand.id)}
              className={`bg-neutral-900 border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                isSelected
                  ? 'border-[#c9b99a] bg-neutral-800/50'
                  : 'border-neutral-800 hover:border-neutral-700'
              }`}
            >
              {/* Checkbox and Brand name */}
              <div className="flex items-start gap-3 mb-2">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleBrand(brand.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-1 h-4 w-4 rounded border-neutral-700 bg-neutral-800 text-[#c9b99a] focus:ring-[#c9b99a] focus:ring-offset-0 cursor-pointer"
                />
                <h3 className="flex-1 text-lg font-medium text-white">
                  {brand.name}
                </h3>
              </div>

              {/* Similarity percentage */}
              <div className="flex items-center gap-2 mb-2 ml-7">
                <div className="flex-1 bg-neutral-800 rounded-full h-2">
                  <div
                    className="bg-white rounded-full h-2 transition-all duration-300"
                    style={{ width: `${brand.similarity}%` }}
                  />
                </div>
                <span className="text-sm text-neutral-400">
                  {brand.similarity}%
                </span>
              </div>

              {/* Product count */}
              <p className="text-xs text-neutral-500 ml-7">
                {brand.product_count} product{brand.product_count !== 1 ? 's' : ''} available
              </p>
            </div>
          );
        })}
      </div>

      {/* Action button */}
      {brands.length > 0 && (
        <div className="flex justify-center pt-2">
          <button
            onClick={handleSearchSelected}
            disabled={selectedBrands.length === 0}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              selectedBrands.length === 0
                ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                : 'bg-[#c9b99a] text-neutral-900 hover:bg-[#d4c5a8] active:bg-[#bfab8c]'
            }`}
          >
            {selectedBrands.length === 0
              ? 'Select brands to view products'
              : `Show products from ${selectedBrands.length} brand${selectedBrands.length !== 1 ? 's' : ''}`
            }
          </button>
        </div>
      )}

      {/* Empty state */}
      {brands.length === 0 && (
        <p className="text-sm text-neutral-500 text-center py-8">
          No similar brands found
        </p>
      )}
    </div>
  );
}
