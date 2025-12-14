import { useEffect, useState, useRef, useCallback } from 'react'
import { GoogleMap, Marker, InfoWindow, Autocomplete, useJsApiLoader } from '@react-google-maps/api'
import { useParking } from '../contexts/ParkingContext.jsx'
import { useLocation, useNavigate } from 'react-router-dom'
import { MapPin, Zap, Clock, ExternalLink, Search, Navigation } from 'lucide-react'
import { saveLastSearchedLocation, getLastSearchedLocation } from '../utils/locationUtils.js'

const mapContainerStyle = { width: '100%', height: '100%' }
const defaultCenter = { lat: 51.5074, lng: -0.1278 } // London, UK (central location with many parking lots)
const defaultZoom = 6 // Zoomed out to show multiple cities

const libraries = ['places']

// Custom marker icons with creative styling
const createMarkerIcon = (lot, google) => {
  if (!google || !google.maps) return null
  
  const { evAvailable, available, capacity, evSpots } = lot
  const hasEv = evAvailable > 0
  const isAvailable = available > 0
  const availabilityPercent = capacity > 0 ? (available / capacity) * 100 : 0
  
  // Determine marker size based on availability (more spots = bigger marker)
  const baseSize = 50
  const sizeMultiplier = Math.min(1.3, 0.8 + (availabilityPercent / 100) * 0.5)
  const markerSize = Math.round(baseSize * sizeMultiplier)
  const pinHeight = markerSize * 0.4
  
  // Color scheme based on availability
  let primaryColor, secondaryColor, textColor, badgeColor
  if (hasEv) {
    primaryColor = '#3b82f6' // Blue for EV spots
    secondaryColor = '#2563eb'
    textColor = '#ffffff'
    badgeColor = '#fbbf24' // Gold badge for EV
  } else if (isAvailable) {
    if (availabilityPercent > 50) {
      primaryColor = '#22c55e' // Green for good availability
      secondaryColor = '#16a34a'
      textColor = '#ffffff'
      badgeColor = '#22c55e'
    } else {
      primaryColor = '#f59e0b' // Orange for low availability
      secondaryColor = '#d97706'
      textColor = '#ffffff'
      badgeColor = '#f59e0b'
    }
  } else {
    primaryColor = '#ef4444' // Red for full
    secondaryColor = '#dc2626'
    textColor = '#ffffff'
    badgeColor = '#6b7280'
  }
  
  // Create pin-style marker with shadow and gradient
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${markerSize}" height="${markerSize + pinHeight}" viewBox="0 0 ${markerSize} ${markerSize + pinHeight}">
      <defs>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
          <feOffset dx="0" dy="2" result="offsetblur"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.3"/>
          </feComponentTransfer>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <linearGradient id="pinGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:${primaryColor};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${secondaryColor};stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <!-- Pin shadow -->
      <ellipse cx="${markerSize/2}" cy="${markerSize + pinHeight - 2}" rx="${markerSize * 0.15}" ry="${pinHeight * 0.3}" fill="#000000" opacity="0.2" filter="url(#shadow)"/>
      
      <!-- Pin point -->
      <path d="M ${markerSize/2} ${markerSize + pinHeight} L ${markerSize/2 - markerSize*0.15} ${markerSize} L ${markerSize/2 + markerSize*0.15} ${markerSize} Z" fill="${secondaryColor}" filter="url(#shadow)"/>
      
      <!-- Main circle with gradient -->
      <circle cx="${markerSize/2}" cy="${markerSize/2}" r="${markerSize/2 - 3}" fill="url(#pinGradient)" stroke="white" stroke-width="3" filter="url(#shadow)"/>
      
      <!-- Inner circle for depth -->
      <circle cx="${markerSize/2}" cy="${markerSize/2 - 2}" r="${markerSize/2 - 8}" fill="${primaryColor}" opacity="0.3"/>
      
      <!-- Availability count badge -->
      <circle cx="${markerSize/2}" cy="${markerSize/2}" r="${markerSize * 0.35}" fill="white" opacity="0.95"/>
      <text x="${markerSize/2}" y="${markerSize/2 + 6}" text-anchor="middle" fill="${primaryColor}" font-size="${markerSize * 0.32}" font-weight="bold" font-family="Arial, sans-serif">${available}</text>
      
      <!-- EV indicator badge (top right) -->
      ${hasEv ? `
        <circle cx="${markerSize * 0.75}" cy="${markerSize * 0.25}" r="${markerSize * 0.18}" fill="${badgeColor}" stroke="white" stroke-width="2"/>
        <text x="${markerSize * 0.75}" y="${markerSize * 0.25 + 4}" text-anchor="middle" fill="white" font-size="${markerSize * 0.22}" font-weight="bold">⚡</text>
      ` : ''}
      
      <!-- Availability indicator ring (pulsing effect for available spots) -->
      ${isAvailable ? `
        <circle cx="${markerSize/2}" cy="${markerSize/2}" r="${markerSize/2 - 1}" fill="none" stroke="${primaryColor}" stroke-width="2" opacity="0.6" stroke-dasharray="4 4">
          <animate attributeName="opacity" values="0.6;0.2;0.6" dur="2s" repeatCount="indefinite"/>
        </circle>
      ` : ''}
    </svg>
  `
  
  return {
    url: `data:image/svg+xml;charset=UTF-8;base64,${btoa(svg)}`,
    scaledSize: new google.maps.Size(markerSize, markerSize + pinHeight),
    anchor: new google.maps.Point(markerSize / 2, markerSize + pinHeight),
  }
}

export default function MapView() {
  const { filteredLots, lots, loading, error, setLocationFilter, locationFilter } = useParking()
  const location = useLocation()
  const navigate = useNavigate()
  const focusId = location.state?.focusId
  const userLocation = location.state?.userLocation
  
  const [selectedLot, setSelectedLot] = useState(null)
  const [mapCenter, setMapCenter] = useState(defaultCenter)
  const [zoom, setZoom] = useState(defaultZoom)
  const [map, setMap] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [userMarker, setUserMarker] = useState(null)
  const autocompleteRef = useRef(null)
  const geocoderRef = useRef(null)

  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: googleMapsApiKey,
    libraries: libraries,
  })

  // Initialize geocoder
  useEffect(() => {
    if (isLoaded && window.google && window.google.maps) {
      try {
        geocoderRef.current = new window.google.maps.Geocoder()
      } catch (error) {
        console.error('Failed to initialize Geocoder. Make sure Geocoding API is enabled:', error)
      }
    }
  }, [isLoaded])

  // Load last searched location on mount if no userLocation or focusId
  useEffect(() => {
    if (!userLocation && !focusId && isLoaded) {
      const lastSearched = getLastSearchedLocation()
      if (lastSearched && lastSearched.lat && lastSearched.lng) {
        const location = { lat: lastSearched.lat, lng: lastSearched.lng }
        setLocationFilter({
          lat: location.lat,
          lng: location.lng,
          radiusKm: 10
        })
        setMapCenter(location)
        setZoom(13)
        if (map) {
          map.setCenter(location)
          map.setZoom(13)
        }
        if (lastSearched.address && lastSearched.address !== 'My Location') {
          setSearchQuery(lastSearched.address)
        }
      }
    }
  }, [isLoaded, userLocation, focusId, map, setLocationFilter])

  // Handle focus on specific lot
  useEffect(() => {
    if (focusId && filteredLots.length > 0 && map) {
      const lot = filteredLots.find(l => l.id === focusId)
      if (lot) {
        const center = { lat: lot.lat, lng: lot.lng }
        setMapCenter(center)
        setZoom(15)
        setSelectedLot(lot)
        map.setCenter(center)
        map.setZoom(15)
      }
    }
  }, [focusId, filteredLots, map])

  // Handle user location from Dashboard
  useEffect(() => {
    if (userLocation && map) {
      const center = { lat: userLocation.lat, lng: userLocation.lng }
      
      // Set location filter
      setLocationFilter({
        lat: center.lat,
        lng: center.lng,
        radiusKm: 10
      })
      
      setMapCenter(center)
      setZoom(14)
      map.setCenter(center)
      map.setZoom(14)
      
      // Add user location marker
      setUserMarker(center)
    }
  }, [userLocation, map, setLocationFilter])

  // Get user's current location
  const handleUseMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        
        // Save user location
        saveLastSearchedLocation({
          lat: location.lat,
          lng: location.lng,
          address: 'My Location'
        })
        
        // Set location filter (10km radius)
        setLocationFilter({
          lat: location.lat,
          lng: location.lng,
          radiusKm: 10
        })
        
        if (map) {
          map.setCenter(location)
          map.setZoom(14)
          setMapCenter(location)
          setZoom(14)
        }
        
        setUserMarker(location)
      },
      (error) => {
        alert('Unable to retrieve your location. Please enable location permissions.')
        console.error('Geolocation error:', error)
      }
    )
  }, [map, setLocationFilter])

  // Handle place selection from autocomplete
  const onPlaceChanged = useCallback(() => {
    if (autocompleteRef.current) {
      try {
        const place = autocompleteRef.current.getPlace()
        
        if (place.geometry) {
          const location = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          }
          
          const address = place.formatted_address || place.name
          
          // Save searched location
          saveLastSearchedLocation({
            lat: location.lat,
            lng: location.lng,
            address: address
          })
          
          // Check if this is a city-level search (check place types)
          const isCitySearch = place.types?.some(type => 
            type === 'locality' || type === 'administrative_area_level_1' || type === 'country'
          )
          
          // Use larger radius for city searches, smaller for specific addresses
          const radiusKm = isCitySearch ? 50 : 10
          
          // Set location filter
          setLocationFilter({
            lat: location.lat,
            lng: location.lng,
            radiusKm: radiusKm
          })
          
          setMapCenter(location)
          setZoom(isCitySearch ? 11 : 13)
          
          if (map) {
            map.setCenter(location)
            map.setZoom(isCitySearch ? 11 : 13)
          }
          
          setSearchQuery(address)
        } else {
          console.warn('Place has no geometry. Make sure Places API is enabled.')
        }
      } catch (error) {
        console.error('Error handling place selection. Make sure Places API is enabled:', error)
        alert('Search failed. Please ensure Places API is enabled in Google Cloud Console.')
      }
    }
  }, [map, setLocationFilter])

  // Search for city/area using geocoding
  const handleSearch = useCallback(() => {
    if (!searchQuery.trim()) {
      alert('Please enter a search term.')
      return
    }

    if (!geocoderRef.current) {
      alert('Geocoding service is not available. Please ensure Geocoding API is enabled in Google Cloud Console.')
      return
    }

    geocoderRef.current.geocode({ address: searchQuery }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const location = {
          lat: results[0].geometry.location.lat(),
          lng: results[0].geometry.location.lng(),
        }
        
        const address = results[0].formatted_address || searchQuery
        
        // Check result types to determine if it's a city-level search
        const resultTypes = results[0].types || []
        const isCitySearch = resultTypes.some(type => 
          type === 'locality' || 
          type === 'administrative_area_level_1' || 
          type === 'administrative_area_level_2' ||
          type === 'country'
        )
        
        // Use larger radius for city searches, smaller for specific addresses
        const radiusKm = isCitySearch ? 50 : 10
        
        // Save searched location
        saveLastSearchedLocation({
          lat: location.lat,
          lng: location.lng,
          address: address
        })
        
        // Set location filter
        setLocationFilter({
          lat: location.lat,
          lng: location.lng,
          radiusKm: radiusKm
        })
        
        setMapCenter(location)
        setZoom(isCitySearch ? 11 : 13)
        
        if (map) {
          map.setCenter(location)
          map.setZoom(isCitySearch ? 11 : 13)
        }
      } else if (status === 'ZERO_RESULTS') {
        alert('Location not found. Please try a different search term.')
      } else if (status === 'REQUEST_DENIED') {
        alert('Geocoding request denied. Please ensure Geocoding API is enabled and your API key has the correct permissions.')
      } else {
        alert(`Search failed: ${status}. Please ensure Geocoding API is enabled.`)
      }
    })
  }, [searchQuery, map, setLocationFilter])

  const openInGoogleMaps = (lot) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${lot.lat},${lot.lng}`
    window.open(url, '_blank')
  }

  if (!googleMapsApiKey) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden h-[calc(100vh-12rem)] flex items-center justify-center">
        <div className="text-center p-6 max-w-md">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">API Key Missing</h3>
          <p className="text-gray-600 mb-4">
            Google Maps API key is not configured. Please add <code className="bg-gray-100 px-2 py-1 rounded">VITE_GOOGLE_MAPS_API_KEY</code> to your <code className="bg-gray-100 px-2 py-1 rounded">.env</code> file.
          </p>
          <p className="text-sm text-gray-500">
            See <code className="bg-gray-100 px-2 py-1 rounded">GOOGLE_MAPS_API_SETUP.md</code> for setup instructions.
          </p>
        </div>
      </div>
    )
  }

  if (loadError) {
    const errorMessage = loadError.message || 'Failed to load Google Maps'
    const isApiError = errorMessage.includes('API') || errorMessage.includes('key') || errorMessage.includes('referer')
    
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden h-[calc(100vh-12rem)] flex items-center justify-center">
        <div className="text-center p-6 max-w-md">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Map Loading Error</h3>
          <p className="text-gray-600 mb-4">{errorMessage}</p>
          {isApiError && (
            <div className="text-sm text-left bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="font-semibold text-yellow-800 mb-2">Common fixes:</p>
              <ul className="list-disc list-inside space-y-1 text-yellow-700">
                <li>Enable <strong>Maps JavaScript API</strong> in Google Cloud Console</li>
                <li>Enable <strong>Places API</strong> (required for search)</li>
                <li>Enable <strong>Geocoding API</strong> (required for search)</li>
                <li>Enable <strong>Billing</strong> to remove watermark</li>
                <li>Check API key restrictions allow your domain</li>
              </ul>
            </div>
          )}
          <p className="text-sm text-gray-500">
            See <code className="bg-gray-100 px-2 py-1 rounded">GOOGLE_MAPS_API_SETUP.md</code> for detailed setup instructions.
          </p>
        </div>
      </div>
    )
  }

  if (loading || !isLoaded) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden h-[calc(100vh-12rem)] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden h-[calc(100vh-12rem)] flex items-center justify-center">
        <div className="text-center text-red-600">
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow p-4">
        {/* Marker Count Indicator */}
        <div className="mb-3">
          {filteredLots.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>
                  Showing <strong className="text-blue-600 font-semibold">{filteredLots.length}</strong> parking {filteredLots.length === 1 ? 'spot' : 'spots'}
                  {locationFilter && lots.length > filteredLots.length && (
                    <span className="text-gray-500"> (within {locationFilter.radiusKm}km of search, {lots.length} total)</span>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-white shadow-sm"></div>
                  <span className="text-gray-600">Available</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow-sm"></div>
                  <span className="text-gray-600">EV Charging</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-white shadow-sm"></div>
                  <span className="text-gray-600">Full</span>
                </div>
              </div>
            </div>
          ) : locationFilter ? (
            <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="flex-1">
                No parking spots found within {locationFilter.radiusKm}km of your search. 
              </span>
              <button 
                onClick={() => {
                  setLocationFilter(null)
                  setMapCenter(defaultCenter)
                  setZoom(defaultZoom)
                  if (map) {
                    map.setCenter(defaultCenter)
                    map.setZoom(defaultZoom)
                  }
                }} 
                className="ml-2 text-blue-600 hover:text-blue-800 underline font-medium whitespace-nowrap"
              >
                Show all spots
              </button>
            </div>
          ) : null}
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          {isLoaded && (
            <Autocomplete
              onLoad={(autocomplete) => {
                autocompleteRef.current = autocomplete
                autocomplete.setFields(['formatted_address', 'geometry', 'name'])
              }}
              onPlaceChanged={onPlaceChanged}
            >
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search city or area..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch()
                    }
                  }}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </Autocomplete>
          )}
          <button
            onClick={handleUseMyLocation}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Navigation className="w-5 h-5" />
            <span>Use My Location</span>
          </button>
        </div>
      </div>

      {/* Map */}
      <div className="bg-white rounded-lg shadow overflow-hidden relative" style={{ height: 'calc(100vh - 16rem)', minHeight: '500px', width: '100%' }}>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={mapCenter}
          zoom={zoom}
          options={{
            disableDefaultUI: false,
            zoomControl: true,
            fullscreenControl: true,
            mapTypeControl: true,
            streetViewControl: false,
          }}
          onLoad={(mapInstance) => {
            setMap(mapInstance)
            if (focusId) {
              const lot = filteredLots.find(l => l.id === focusId)
              if (lot) {
                const center = { lat: lot.lat, lng: lot.lng }
                mapInstance.setCenter(center)
                mapInstance.setZoom(15)
                setSelectedLot(lot)
              }
            }
          }}
        >
          {/* User Location Marker */}
          {userMarker && window.google && (
            <Marker
              position={userMarker}
              icon={{
                url: 'data:image/svg+xml;charset=UTF-8;base64,' + btoa(`
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
                    <defs>
                      <filter id="userShadow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
                        <feOffset dx="0" dy="2" result="offsetblur"/>
                        <feComponentTransfer>
                          <feFuncA type="linear" slope="0.4"/>
                        </feComponentTransfer>
                        <feMerge>
                          <feMergeNode/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                      <linearGradient id="userGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:#2563eb;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#1e40af;stop-opacity:1" />
                      </linearGradient>
                    </defs>
                    <!-- Outer pulsing ring -->
                    <circle cx="24" cy="24" r="20" fill="#2563eb" opacity="0.2">
                      <animate attributeName="r" values="20;24;20" dur="2s" repeatCount="indefinite"/>
                      <animate attributeName="opacity" values="0.2;0.1;0.2" dur="2s" repeatCount="indefinite"/>
                    </circle>
                    <!-- Main circle -->
                    <circle cx="24" cy="24" r="16" fill="url(#userGradient)" stroke="white" stroke-width="3" filter="url(#userShadow)"/>
                    <!-- Inner dot -->
                    <circle cx="24" cy="24" r="6" fill="white"/>
                    <!-- Navigation icon -->
                    <path d="M24 12 L28 20 L24 18 L20 20 Z" fill="white" opacity="0.9"/>
                  </svg>
                `),
                scaledSize: new window.google.maps.Size(48, 48),
                anchor: new window.google.maps.Point(24, 24),
              }}
              title="Your Location"
              zIndex={1000}
            />
          )}

          {/* Parking Lot Markers */}
          {filteredLots.map((lot) => {
            const icon = window.google ? createMarkerIcon(lot, window.google.maps) : null
            const availabilityStatus = lot.available > 0 
              ? (lot.evAvailable > 0 ? 'EV Charging Available' : `${lot.available} spots available`)
              : 'Full'
            return (
              <Marker
                key={lot.id}
                position={{ lat: lot.lat, lng: lot.lng }}
                icon={icon}
                onClick={() => setSelectedLot(lot)}
                title={`${lot.name} - ${availabilityStatus}`}
                zIndex={lot.available > 0 ? 100 : 50}
              />
            )
          })}

          {/* Info Window */}
          {selectedLot && (
            <InfoWindow
              position={{ lat: selectedLot.lat, lng: selectedLot.lng }}
              onCloseClick={() => setSelectedLot(null)}
            >
              <div className="p-2 min-w-[280px]">
                <div className="mb-3">
                  <h3 className="font-semibold text-lg text-gray-900">{selectedLot.name}</h3>
                  <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                    <MapPin className="w-4 h-4" />
                    {selectedLot.address || `${selectedLot.lat.toFixed(4)}, ${selectedLot.lng.toFixed(4)}`}
                  </p>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Available:</span>
                    <span className="font-semibold">{selectedLot.available}/{selectedLot.capacity}</span>
                  </div>
                  {selectedLot.evSpots > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 flex items-center gap-1">
                        <Zap className="w-4 h-4 text-blue-600" /> EV Spots:
                      </span>
                      <span className="font-semibold">{selectedLot.evAvailable}/{selectedLot.evSpots}</span>
                    </div>
                  )}
                  <div className="flex justify-between bg-green-50 px-2 py-1 rounded">
                    <span className="text-gray-600">Rate:</span>
                    <span className="font-semibold text-green-700">${selectedLot.pricePerHour}/hr</span>
                  </div>
                  <div className="flex justify-between bg-yellow-50 px-2 py-1 rounded">
                    <span className="text-gray-600 flex items-center gap-1">
                      <Clock className="w-4 h-4" /> Prediction:
                    </span>
                    <span className="font-semibold text-yellow-700">Likely full by 6:00 PM</span>
                  </div>
                </div>
                <button
                  onClick={() => openInGoogleMaps(selectedLot)}
                  className="mt-3 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open in Google Maps
                </button>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>
    </div>
  )
}
