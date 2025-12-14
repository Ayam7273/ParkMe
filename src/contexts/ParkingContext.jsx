import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { fetchParkingLotsFromPlaces } from '../utils/placesApi.js'

const ParkingContext = createContext(null)

// Cache for parking lots to avoid excessive API calls
const parkingCache = new Map()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

function getCacheKey(location, radiusKm) {
  return `${location.lat.toFixed(4)}_${location.lng.toFixed(4)}_${radiusKm}`
}

function isCacheValid(cacheEntry) {
  return cacheEntry && (Date.now() - cacheEntry.timestamp) < CACHE_DURATION
}

/**
 * Fetch parking lots from Google Places API based on location
 */
async function fetchParkingLots(locationFilter) {
  // If no location filter, return empty array (user needs to search)
  if (!locationFilter || !locationFilter.lat || !locationFilter.lng) {
    return []
  }

  // Check cache first
  const cacheKey = getCacheKey(
    { lat: locationFilter.lat, lng: locationFilter.lng },
    locationFilter.radiusKm || 10
  )
  
  const cached = parkingCache.get(cacheKey)
  if (isCacheValid(cached)) {
    return cached.data
  }

  // Check if Google Maps is loaded
  if (!window.google || !window.google.maps || !window.google.maps.places) {
    throw new Error('Google Maps Places API not loaded. Please wait for the map to load.')
  }

  try {
    // Convert radius from km to meters
    const radiusMeters = (locationFilter.radiusKm || 10) * 1000
    
    const parkingLots = await fetchParkingLotsFromPlaces(
      { lat: locationFilter.lat, lng: locationFilter.lng },
      radiusMeters
    )

    // Cache the results
    parkingCache.set(cacheKey, {
      data: parkingLots,
      timestamp: Date.now()
    })

    return parkingLots
  } catch (error) {
    console.error('Error fetching parking lots:', error)
    throw error
  }
}

export function ParkingProvider({ children }) {
  const [lots, setLots] = useState([])
  const [query, setQuery] = useState('')
  const [evOnly, setEvOnly] = useState(false)
  const [locationFilter, setLocationFilter] = useState(null) // { lat, lng, radiusKm }
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const timerRef = useRef(null)
  const inFlightRef = useRef(false)

  // Fetch parking lots when location filter changes
  useEffect(() => {
    const load = async () => {
      if (inFlightRef.current) return
      inFlightRef.current = true
      
      setLoading(true)
      setError(null)
      
      try {
        const data = await fetchParkingLots(locationFilter)
        setLots(data)
      } catch (e) {
        console.error('Failed to load parking data:', e)
        setError(e.message || 'Failed to load parking data. Please ensure Places API is enabled.')
        setLots([]) // Clear lots on error
      } finally {
        setLoading(false)
        inFlightRef.current = false
      }
    }

    // Wait a bit for Google Maps to load if locationFilter is set immediately
    if (locationFilter) {
      const timer = setTimeout(() => {
        load()
      }, 500) // Small delay to ensure Google Maps is loaded
      
      return () => clearTimeout(timer)
    } else {
      // If no location filter, clear the lots
      setLots([])
    }
  }, [locationFilter])

  // Update availability periodically for existing lots (simulate real-time updates)
  useEffect(() => {
    if (lots.length === 0) return

    const updateAvailability = () => {
      setLots(currentLots => 
        currentLots.map(lot => {
          // Small random changes to availability
          const change = Math.floor(Math.random() * 5) - 2 // -2 to +2
          const newOccupied = Math.max(0, Math.min(lot.capacity, lot.occupied + change))
          const newAvailable = lot.capacity - newOccupied
          
          // Update EV availability proportionally
          const evRatio = lot.evSpots / lot.capacity
          const newEvOccupied = Math.min(lot.evSpots, Math.floor(newOccupied * evRatio))
          const newEvAvailable = lot.evSpots - newEvOccupied
          
          return {
            ...lot,
            occupied: newOccupied,
            available: newAvailable,
            evOccupied: newEvOccupied,
            evAvailable: newEvAvailable
          }
        })
      )
    }

    const interval = setInterval(updateAvailability, 10000) // Update every 10 seconds
    return () => clearInterval(interval)
  }, [lots.length])

  const filteredLots = useMemo(() => {
    // Places API already filters by location, so we just apply text and EV filters
    const term = query.trim().toLowerCase()
    return lots.filter((l) => {
      const matchesQuery = !term || l.name.toLowerCase().includes(term) || l.address.toLowerCase().includes(term)
      const matchesEv = !evOnly || l.evAvailable > 0
      return matchesQuery && matchesEv
    })
  }, [lots, query, evOnly])

  const value = useMemo(
    () => ({
      lots,
      filteredLots,
      query,
      setQuery,
      evOnly,
      setEvOnly,
      locationFilter,
      setLocationFilter,
      loading,
      error,
    }),
    [lots, filteredLots, query, evOnly, locationFilter, loading, error]
  )

  return <ParkingContext.Provider value={value}>{children}</ParkingContext.Provider>
}

export function useParking() {
  const ctx = useContext(ParkingContext)
  if (!ctx) throw new Error('useParking must be used within ParkingProvider')
  return ctx
}
