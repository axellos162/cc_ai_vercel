'use client'

import { useState, useEffect } from 'react'
import MapContainer from './map/MapContainer'
import StoreSidebar from './map/StoreSidebar'
import UserMenu from './auth/UserMenu'
import ViewToggle from './ViewToggle'
import { useAuth } from '@/contexts/AuthContext'

export default function ExploreView({
  onOpenProfile,
  onOpenHistory,
  onOpenFavorites,
  onOpenAuth,
  onBackToSearch
}) {
  const { user } = useAuth()
  const [cities, setCities] = useState([])
  const [selectedCity, setSelectedCity] = useState(null)
  const [stores, setStores] = useState([])
  const [selectedStore, setSelectedStore] = useState(null)
  const [isLoadingCities, setIsLoadingCities] = useState(true)
  const [isLoadingStores, setIsLoadingStores] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  // Fetch cities on mount
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const res = await fetch('/api/v1/cities')
        const data = await res.json()

        if (data.ok && data.cities) {
          setCities(data.cities)
          // Auto-select first city (highest store count)
          if (data.cities.length > 0) {
            setSelectedCity(data.cities[0])
          }
        }
      } catch (err) {
        console.error('Failed to fetch cities:', err)
      } finally {
        setIsLoadingCities(false)
      }
    }

    fetchCities()
    // Trigger entrance animation
    setTimeout(() => setIsVisible(true), 50)
  }, [])

  // Fetch stores when city changes
  useEffect(() => {
    if (!selectedCity) {
      setStores([])
      return
    }

    const fetchStores = async () => {
      setIsLoadingStores(true)
      setSelectedStore(null)

      try {
        const res = await fetch(
          `/api/v1/stores?city=${encodeURIComponent(selectedCity.city)}&state=${encodeURIComponent(selectedCity.state)}`
        )
        const data = await res.json()

        if (data.ok && data.stores) {
          setStores(data.stores)
        }
      } catch (err) {
        console.error('Failed to fetch stores:', err)
        setStores([])
      } finally {
        setIsLoadingStores(false)
      }
    }

    fetchStores()
  }, [selectedCity])

  const handleMarkerClick = (store) => {
    setSelectedStore(store)
  }

  const handleMapClick = () => {
    setSelectedStore(null)
  }

  const closeSidebar = () => {
    setSelectedStore(null)
  }

  const handleCityChange = (e) => {
    const cityKey = e.target.value
    const city = cities.find(c => `${c.city},${c.state}` === cityKey)
    if (city) {
      setSelectedCity(city)
    }
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header with city selector and user menu */}
      <div
        className="border-b border-border-subtle"
        style={{
          background: 'var(--color-bg-base)',
          padding: '20px var(--space-page-x)',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(-20px)',
          transition: 'opacity 600ms cubic-bezier(0.4, 0.0, 0.2, 1), transform 600ms cubic-bezier(0.4, 0.0, 0.2, 1)'
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            {/* View Toggle */}
            <ViewToggle
              activeView="map"
              onViewChange={(view) => {
                if (view === 'search') {
                  onBackToSearch()
                }
              }}
            />
            {/* City Selector */}
            <div className="flex items-center gap-3">
              <label
                htmlFor="city-select"
                className="font-body text-text-tertiary uppercase"
                style={{
                  fontSize: '10px',
                  letterSpacing: '0.12em'
                }}
              >
                Explore
              </label>

              {isLoadingCities ? (
                <div className="font-display text-text-secondary" style={{ fontSize: '18px' }}>
                  Loading cities...
                </div>
              ) : (
                <select
                  id="city-select"
                  value={selectedCity ? `${selectedCity.city},${selectedCity.state}` : ''}
                  onChange={handleCityChange}
                  className="city-selector font-display text-text-primary"
                  style={{
                    fontSize: '18px',
                    fontWeight: 400,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    cursor: 'pointer',
                    appearance: 'none',
                    paddingRight: '24px'
                  }}
                >
                  {cities.map(city => (
                    <option key={`${city.city},${city.state}`} value={`${city.city},${city.state}`}>
                      {city.city}, {city.state} ({city.store_count} {city.store_count === 1 ? 'store' : 'stores'})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Store count */}
            {selectedCity && (
              <p
                className="font-body text-text-tertiary"
                style={{
                  fontSize: '11px',
                  opacity: isLoadingStores ? 0.5 : 1,
                  transition: 'opacity var(--transition-base)'
                }}
              >
                {isLoadingStores ? 'Loading stores...' : `${stores.length} locations`}
              </p>
            )}
          </div>

          {/* User menu */}
          <div>
            {user ? (
              <UserMenu
                onOpenProfile={onOpenProfile}
                onOpenHistory={onOpenHistory}
                onOpenFavorites={onOpenFavorites}
              />
            ) : (
              <button
                onClick={onOpenAuth}
                className="auth-button"
              >
                SIGN IN
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Map + Sidebar container */}
      <div
        className="flex flex-1"
        style={{
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 800ms cubic-bezier(0.4, 0.0, 0.2, 1) 200ms'
        }}
      >
        {/* Map */}
        <div className="flex-1">
          {selectedCity && stores.length > 0 ? (
            <MapContainer
              stores={stores}
              onMarkerClick={handleMarkerClick}
              onMapClick={handleMapClick}
              selectedStore={selectedStore}
              markerColor="#e85d75"
              height="100%"
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <p
                className="font-body text-text-tertiary"
                style={{ fontSize: '13px' }}
              >
                {isLoadingStores ? 'Loading map...' : 'No stores found in this city'}
              </p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <StoreSidebar
          selectedStore={selectedStore}
          onClose={closeSidebar}
          filters={{}}
          isOpen={!!selectedStore}
        />
      </div>

      <style jsx>{`
        .auth-button {
          background: transparent;
          border: 1px solid var(--color-border-default);
          padding: 10px 24px;
          font-family: var(--font-body);
          font-size: 11px;
          font-weight: 400;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--color-text-secondary);
          cursor: pointer;
          transition: all var(--transition-base);
        }
        .auth-button:hover {
          border-color: var(--color-text-accent);
          color: var(--color-text-accent);
          transform: translateY(-1px);
        }

        .city-selector {
          position: relative;
          background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 6L11 1' stroke='%23666666' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right center;
          transition: all var(--transition-base);
        }
        .city-selector:hover {
          color: var(--color-text-accent);
        }
        .city-selector:focus {
          color: var(--color-text-accent);
        }
      `}</style>
    </div>
  )
}
