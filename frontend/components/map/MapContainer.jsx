'use client'

import { useState, useEffect } from 'react'
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps'

/**
 * Pure Google Maps wrapper component
 * Renders a map with store markers and handles marker interactions
 *
 * @param {Array} stores - Array of store objects with lat, lng, id
 * @param {Function} onMarkerClick - Called when a marker is clicked
 * @param {Function} onMapClick - Called when the map background is clicked
 * @param {Object} selectedStore - Currently selected store object
 * @param {String} markerColor - Color for all markers (default: #e85d75 red)
 * @param {Number} height - Map height in pixels or CSS string (default: 600px)
 */
export default function MapContainer({
  stores = [],
  onMarkerClick,
  onMapClick,
  selectedStore = null,
  markerColor = '#e85d75',
  height = '600px'
}) {
  const [map, setMap] = useState(null)
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

  // Calculate center from stores or use default (San Francisco)
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

  return (
    <div style={{ height, width: '100%' }}>
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={mapCenter}
          defaultZoom={12}
          mapId="light-map"
          disableDefaultUI={true}
          gestureHandling="cooperative"
          colorScheme="LIGHT"
          onClick={onMapClick}
          onLoad={setMap}
          style={{ width: '100%', height: '100%' }}
        >
          {stores.map((store) => {
            const isSelected = selectedStore?.id === store.id

            return (
              <AdvancedMarker
                key={store.id}
                position={{ lat: store.lat, lng: store.lng }}
                onClick={() => onMarkerClick?.(store)}
              >
                <Pin
                  background={markerColor}
                  borderColor={isSelected ? '#000000' : '#FFFFFF'}
                  glyphColor="#ffffff"
                  scale={isSelected ? 1.3 : 1.0}
                />
              </AdvancedMarker>
            )
          })}
        </Map>
      </APIProvider>
    </div>
  )
}
