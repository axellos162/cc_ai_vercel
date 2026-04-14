'use client'

import { useState, useEffect } from 'react'
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps'
import Image from 'next/image'
import ResultMeta from '../ResultMeta'

export default function StoreMapResult({ data, result, filters }) {
  const stores = data?.stores || []
  const [selectedStore, setSelectedStore] = useState(null)
  const [map, setMap] = useState(null)
  const [sidebarProducts, setSidebarProducts] = useState([])
  const [sidebarLoading, setSidebarLoading] = useState(false)

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

  // Calculate center from stores or use default
  const mapCenter = stores.length > 0 && stores[0]?.lat && stores[0]?.lng
    ? { lat: stores[0].lat, lng: stores[0].lng }
    : { lat: 37.7749, lng: -122.4194 }


  // Fit bounds when map loads or stores change
  useEffect(() => {
    if (map && stores.length > 0) {
      const bounds = new google.maps.LatLngBounds()
      stores.forEach(store => {
        if (store.lat && store.lng) {
          bounds.extend({ lat: store.lat, lng: store.lng })
        }
      })
      map.fitBounds(bounds, 60)
    }
  }, [map, stores])

  const handleMarkerClick = async (store) => {
    setSelectedStore(store)
    setSidebarLoading(true)
    setSidebarProducts([])

    try {
      // Use new direct endpoint (bypasses GPT-4o classification!)
      const url = new URL('http://localhost:3001/api/v1/products')
      url.searchParams.set('brand', store.brand_name)
      url.searchParams.set('store', store.name)
      url.searchParams.set('limit', '50')
      
      const res = await fetch(url.toString())
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      }
      
      const data = await res.json()
      const products = data?.results?.data?.products ?? []
      
      // No filtering needed - backend already filtered by store!
      setSidebarProducts(products)
    } catch (err) {
      console.error('Failed to fetch sidebar products:', err)
      setSidebarProducts([])
    } finally {
      setSidebarLoading(false)
    }
  }

  const handleMapClick = () => {
    setSelectedStore(null)
    setSidebarProducts([])
    setSidebarLoading(false)
  }

  const closeSidebar = () => {
    setSelectedStore(null)
    setSidebarProducts([])
    setSidebarLoading(false)
  }

  // Get city from filters for summary
  const city = filters?.city || (stores[0]?.city) || 'this area'

  // Determine marker color based on filter type
  function getMarkerColor(store, filters) {
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

  const pulseStyles = '@keyframes sidebarPulse { 0%, 80%, 100% { opacity: 0.3; } 40% { opacity: 1; } } .sidebar-pulse-dot-1 { animation: sidebarPulse 1.4s ease-in-out infinite 0s; } .sidebar-pulse-dot-2 { animation: sidebarPulse 1.4s ease-in-out infinite 0.2s; } .sidebar-pulse-dot-3 { animation: sidebarPulse 1.4s ease-in-out infinite 0.4s; }'

  const summary = data?.summary

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: pulseStyles }} />
      {result && <ResultMeta result={result} />}

      {/* Text Summary */}
      {summary && (
        <div 
          className="mb-6 font-body text-text-secondary"
          style={{ 
            whiteSpace: 'pre-line', 
            fontSize: '14px', 
            lineHeight: '1.6' 
          }}
        >
          {summary}
        </div>
      )}

      {/* Map + Sidebar container */}
      <div className="flex" style={{ height: 'var(--map-height, 600px)' }}>
        {/* Map area */}
        <div className="flex-1 relative">
          <APIProvider apiKey={apiKey}>
            <Map
              defaultCenter={mapCenter}
              defaultZoom={12}
              mapId="dark-map"
              disableDefaultUI={true}
              gestureHandling="cooperative"
              colorScheme="DARK"
              onClick={handleMapClick}
              onLoad={setMap}
            >
              {stores.map((store) => {
                const pinColor = getMarkerColor(store, filters);
                const isSelected = selectedStore?.id === store.id;
                
                return (
                  <AdvancedMarker
                    key={store.id}
                    position={{ lat: store.lat, lng: store.lng }}
                    onClick={() => handleMarkerClick(store)}
                  >
                    <Pin
                      background={pinColor}
                      borderColor={isSelected ? '#f0ede8' : '#1a1a1a'}
                      glyphColor="#ffffff"
                      scale={isSelected ? 1.3 : 1.0}
                    />
                  </AdvancedMarker>
                );
              })}
            </Map>
          </APIProvider>
        </div>

        {/* Sidebar */}
        <div
          className="bg-bg-surface border-l border-border-subtle transition-all duration-300 relative"
          style={{
            width: selectedStore ? '600px' : '0',
            height: '100%',
            overflowY: selectedStore ? 'auto' : 'hidden'
          }}
        >
          {selectedStore && (
            <div style={{ padding: '28px' }}>
              {/* Close button */}
              <button
                onClick={closeSidebar}
                className="font-body text-text-tertiary hover:text-text-primary cursor-pointer transition-colors"
                style={{ position: 'absolute', top: '16px', right: '16px', fontSize: '16px' }}
              >
                ×
              </button>

              {/* Store name */}
              <h3 
                className="font-display text-text-primary pr-6"
                style={{
                  fontSize: '22px',
                  fontWeight: 400
                }}
              >
                {selectedStore.name}
              </h3>

              {/* City + state */}
              <p 
                className="font-body text-text-secondary mt-1"
                style={{ fontSize: '12px' }}
              >
                {selectedStore.city}, {selectedStore.state}
              </p>

              {/* Brand carried */}
              {selectedStore.brand_name && (
                <div 
                  className="font-body text-text-accent uppercase mt-3"
                  style={{
                    fontSize: '11px',
                    letterSpacing: '0.08em'
                  }}
                >
                  {selectedStore.brand_name}
                </div>
              )}

              {/* Product count */}
              {selectedStore.product_count > 0 && (
                <p 
                  className="font-body text-text-tertiary mt-0.5"
                  style={{ fontSize: '11px' }}
                >
                  {selectedStore.product_count} items available
                </p>
              )}

              {/* Products */}
              <div className="mt-5">
                <div
                  className="font-body text-text-tertiary uppercase mb-2"
                  style={{
                    fontSize: '10px',
                    letterSpacing: '0.1em'
                  }}
                >
                  Available now
                </div>

                {sidebarLoading ? (
                  <div style={{ display: 'flex', gap: '6px', padding: '20px 0' }}>
                    <div
                      style={{
                        width: '4px',
                        height: '4px',
                        borderRadius: '50%',
                        background: 'var(--color-text-accent)',
                        opacity: 0.3
                      }}
                      className="sidebar-pulse-dot-1"
                    />
                    <div
                      style={{
                        width: '4px',
                        height: '4px',
                        borderRadius: '50%',
                        background: 'var(--color-text-accent)',
                        opacity: 0.3
                      }}
                      className="sidebar-pulse-dot-2"
                    />
                    <div
                      style={{
                        width: '4px',
                        height: '4px',
                        borderRadius: '50%',
                        background: 'var(--color-text-accent)',
                        opacity: 0.3
                      }}
                      className="sidebar-pulse-dot-3"
                    />
                  </div>
                ) : sidebarProducts.length > 0 ? (
                  <div
                    className="grid grid-cols-2"
                    style={{ gap: '1px' }}
                  >
                    {sidebarProducts.map((product) => (
                      <div key={product.id}>
                        <div
                          className="relative"
                          style={{
                            aspectRatio: '3/4',
                            background: 'var(--color-bg-elevated)'
                          }}
                        >
                          {product.images && product.images.length > 0 && (
                            <Image
                              src={product.images[0]}
                              alt={product.title}
                              fill
                              className="object-cover"
                              sizes="280px"
                            />
                          )}
                        </div>
                        <div style={{ padding: '8px 4px' }}>
                          <p
                            className="font-display text-text-primary"
                            style={{
                              fontSize: '13px',
                              lineHeight: '1.3',
                              marginBottom: '4px'
                            }}
                          >
                            {product.title}
                          </p>
                          <div className="font-body" style={{ fontSize: '11px' }}>
                            {product.discounted_price > 0 ? (
                              <>
                                <span
                                  className="text-text-tertiary"
                                  style={{ textDecoration: 'line-through', marginRight: '6px' }}
                                >
                                  ${product.price}
                                </span>
                                <span className="text-text-accent">
                                  ${product.discounted_price}
                                </span>
                              </>
                            ) : (
                              <span className="text-text-secondary">
                                ${product.price}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p
                    className="font-body text-text-tertiary"
                    style={{ fontSize: '11px' }}
                  >
                    No products available
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Store count summary */}
      <p 
        className="font-body text-text-tertiary mt-3"
        style={{ fontSize: '11px' }}
      >
        {stores.length} stores found in {city}
      </p>
    </div>
  )
}
