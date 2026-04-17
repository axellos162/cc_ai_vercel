'use client'

import { useState } from 'react'
import ResultMeta from '../ResultMeta'
import MapContainer from '../map/MapContainer'
import StoreSidebar from '../map/StoreSidebar'

export default function StoreMapResult({ data, result, filters }) {
  const stores = data?.stores || []
  const [selectedStore, setSelectedStore] = useState(null)
  const [isSummaryCollapsed, setIsSummaryCollapsed] = useState(false)

  const handleMarkerClick = (store) => {
    setSelectedStore(store)
  }

  const handleMapClick = () => {
    setSelectedStore(null)
  }

  const closeSidebar = () => {
    setSelectedStore(null)
  }

  // Get city from filters for summary
  const city = filters?.city || (stores[0]?.city) || 'this area'

  // Determine marker color based on filter type
  function getMarkerColor(filters, data) {
    // Favorite brands query → always green (stores carry user's favorites)
    if (data?.favorite_brands_query) {
      return '#5ab85f';  // Green
    }

    // Brand-specific query → green (store has what user wants)
    if (filters?.brand) {
      return '#5ab85f';  // Green
    }

    // Category-specific query → green (store has what user wants)
    if (filters?.category) {
      return '#5ab85f';  // Green
    }

    // General location query → red
    return '#e85d75';  // Red
  }

  const markerColor = getMarkerColor(filters, data)
  const summary = data?.summary

  return (
    <div>
      {result && <ResultMeta result={result} />}

      {/* Collapsible Brand List Summary */}
      {summary && (
        <div className="mb-6">
          {/* Split summary into header and list */}
          {(() => {
            const lines = summary.split('\n');
            const header = lines[0]; // First line (e.g., "Here are 84 brands...")
            const listContent = lines.slice(1).join('\n'); // Rest of the content

            return (
              <>
                {/* Header with toggle button */}
                <button
                  onClick={() => setIsSummaryCollapsed(!isSummaryCollapsed)}
                  className="font-body text-text-secondary hover:text-text-primary transition-colors flex items-center gap-2 mb-3 w-full text-left"
                  style={{
                    fontSize: '14px',
                    lineHeight: '1.6',
                    cursor: 'pointer',
                    background: 'none',
                    border: 'none',
                    padding: 0
                  }}
                >
                  <span style={{ flexShrink: 0 }}>{isSummaryCollapsed ? '▸' : '▾'}</span>
                  <span>{header}</span>
                </button>

                {/* Scrollable brand list */}
                {listContent && (
                  <div
                    className="font-body text-text-secondary overflow-y-auto transition-all duration-300"
                    style={{
                      whiteSpace: 'pre-line',
                      fontSize: '14px',
                      lineHeight: '1.6',
                      maxHeight: isSummaryCollapsed ? '120px' : '400px',
                      paddingLeft: '20px'
                    }}
                  >
                    {listContent}
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* Map + Sidebar container */}
      <div className="flex" style={{ height: 'var(--map-height, 600px)' }}>
        {/* Map area */}
        <div className="flex-1">
          <MapContainer
            stores={stores}
            onMarkerClick={handleMarkerClick}
            onMapClick={handleMapClick}
            selectedStore={selectedStore}
            markerColor={markerColor}
            height="100%"
          />
        </div>

        {/* Sidebar */}
        <StoreSidebar
          selectedStore={selectedStore}
          onClose={closeSidebar}
          filters={filters}
          isOpen={!!selectedStore}
        />
      </div>

      {/* Store count summary */}
      <p
        className="font-body text-text-tertiary mt-3"
        style={{ fontSize: '11px' }}
      >
        {stores.length} stores found in {filters?.city || (stores[0]?.city) || 'this area'}
      </p>
    </div>
  )
}
