import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'

const ParkingContext = createContext(null)

// Mock API to simulate backend/ML updates
async function fetchParkingLots() {
  // In real app, fetch from API route or Supabase function
  // Here we simulate 8 lots with random availability that changes
  const baseLots = [
    { id: 'airport', name: 'Airport Terminal Parking', lat: 24.9005, lng: 67.1683, capacity: 500, evSpots: 30, address: '321 Main Street, Airport Zone' },
    { id: 'university', name: 'University Campus Lot', lat: 24.8615, lng: 67.0099, capacity: 250, evSpots: 15, address: '123 Campus Drive, Education District' },
    { id: 'shopping', name: 'Shopping Center Lot', lat: 24.8810, lng: 67.0720, capacity: 300, evSpots: 20, address: '789 Commerce Street, Shopping District' },
    { id: 'business', name: 'Business Tower Garage', lat: 24.8607, lng: 67.0011, capacity: 120, evSpots: 10, address: '987 Corporate Drive, Business District' },
    { id: 'tech', name: 'Tech Hub Parking', lat: 24.8972, lng: 67.0302, capacity: 200, evSpots: 12, address: '456 Innovation Way, Tech Park' },
    { id: 'residential', name: 'Residential North Lot', lat: 24.9252, lng: 67.0324, capacity: 80, evSpots: 6, address: '321 Maple Avenue, North District' },
    { id: 'central', name: 'Central Plaza Garage', lat: 24.8723, lng: 67.0433, capacity: 150, evSpots: 8, address: '654 Center Street, Downtown' },
    { id: 'metro', name: 'Metro Station Garage', lat: 24.8543, lng: 67.0280, capacity: 180, evSpots: 14, address: '321 Transit Avenue, Downtown' },
  ]
  return baseLots.map((lot) => {
    const occupied = Math.floor(Math.random() * lot.capacity)
    const evOccupied = Math.min(Math.floor(Math.random() * lot.evSpots), occupied)
    return {
      ...lot,
      occupied,
      available: lot.capacity - occupied,
      evAvailable: Math.max(0, lot.evSpots - evOccupied),
      pricePerHour: Number((Math.random() * 12 + 2).toFixed(2)),
    }
  })
}

export function ParkingProvider({ children }) {
  const [lots, setLots] = useState([])
  const [query, setQuery] = useState('')
  const [evOnly, setEvOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const timerRef = useRef(null)
  const inFlightRef = useRef(false)
  const backoffRef = useRef(5000)

  const load = async () => {
    if (inFlightRef.current) return
    inFlightRef.current = true
    try {
      setError(null)
      const data = await fetchParkingLots()
      // Only update if changed to avoid unnecessary re-renders
      const changed = JSON.stringify(lots) !== JSON.stringify(data)
      if (changed) setLots(data)
      // success: reset backoff
      backoffRef.current = getBaseInterval()
    } catch (e) {
      setError('Failed to load parking data')
      // exponential backoff on failure (max 60s)
      backoffRef.current = Math.min(backoffRef.current * 2, 60000)
    } finally {
      setLoading(false)
      inFlightRef.current = false
      scheduleNext()
    }
  }

  const getBaseInterval = () => {
    const conn = navigator.connection?.effectiveType
    if (conn === '2g' || conn === 'slow-2g') return 15000
    if (document.hidden) return 20000
    return 5000
  }

  const scheduleNext = () => {
    clearTimeout(timerRef.current)
    const delay = backoffRef.current
    timerRef.current = setTimeout(load, delay)
  }

  useEffect(() => {
    backoffRef.current = getBaseInterval()
    load()
    const onVisibility = () => {
      backoffRef.current = getBaseInterval()
      if (!document.hidden) {
        clearTimeout(timerRef.current)
        load()
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      clearTimeout(timerRef.current)
    }
  }, [])

  const filteredLots = useMemo(() => {
    const term = query.trim().toLowerCase()
    return lots.filter((l) => {
      const matchesQuery = !term || l.name.toLowerCase().includes(term)
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
      loading,
      error,
      reload: load,
    }),
    [lots, filteredLots, query, evOnly, loading, error]
  )

  return <ParkingContext.Provider value={value}>{children}</ParkingContext.Provider>
}

export function useParking() {
  const ctx = useContext(ParkingContext)
  if (!ctx) throw new Error('useParking must be used within ParkingProvider')
  return ctx
}
