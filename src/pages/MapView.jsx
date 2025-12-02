import { useEffect, useState, useRef } from 'react'
import { useParking } from '../contexts/ParkingContext.jsx'
import { useLocation } from 'react-router-dom'
import { MapPin, Zap, Clock, ExternalLink } from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const defaultCenter = [24.8607, 67.0011] // [lat, lng] for Leaflet

// Custom marker icon creator
const createCustomIcon = (color, emoji = '') => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill="${color}" stroke="white" stroke-width="2"/>
      ${emoji ? `<text x="12" y="16" text-anchor="middle" fill="white" font-size="12" font-weight="bold">${emoji}</text>` : ''}
    </svg>
  `
  
  return L.divIcon({
    className: 'custom-marker',
    html: svg,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  })
}

export default function MapView() {
  const { filteredLots, loading, error } = useParking()
  const location = useLocation()
  const focusId = location.state?.focusId
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])
  const [selectedLot, setSelectedLot] = useState(null)
  const [center, setCenter] = useState(defaultCenter)
  const [zoom, setZoom] = useState(13)

  useEffect(() => {
    if (focusId && filteredLots.length > 0) {
      const lot = filteredLots.find(l => l.id === focusId)
      if (lot) {
        setCenter([lot.lat, lot.lng])
        setZoom(15)
        setSelectedLot(lot)
      }
    }
  }, [focusId, filteredLots])

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    // Create map instance
    const map = L.map(mapRef.current).setView(center, zoom)

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map)

    mapInstanceRef.current = map

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // Update map center when center changes
  useEffect(() => {
    if (mapInstanceRef.current && center) {
      mapInstanceRef.current.setView(center, zoom)
    }
  }, [center, zoom])

  // Update markers when lots change
  useEffect(() => {
    if (!mapInstanceRef.current || loading) return

    // Clear existing markers
    markersRef.current.forEach(marker => {
      mapInstanceRef.current.removeLayer(marker)
    })
    markersRef.current = []

    // Add new markers
    filteredLots.forEach((lot) => {
      let icon
      if (lot.evAvailable > 0) {
        icon = createCustomIcon('#3b82f6', '⚡')
      } else if (lot.available > 0) {
        icon = createCustomIcon('#22c55e')
      } else {
        icon = createCustomIcon('#ef4444')
      }

      const marker = L.marker([lot.lat, lot.lng], { icon })
        .addTo(mapInstanceRef.current)
        .bindPopup(createPopupContent(lot))

      marker.on('click', () => {
        setSelectedLot(lot)
      })

      markersRef.current.push(marker)
    })
  }, [filteredLots, loading])

  const createPopupContent = (lot) => {
    return `
      <div style="min-width: 280px; padding: 8px;">
        <div style="margin-bottom: 12px;">
          <h3 style="font-weight: 600; font-size: 18px; color: #111827; margin: 0;">${lot.name}</h3>
          <p style="font-size: 14px; color: #4b5563; margin-top: 4px; display: flex; align-items: center; gap: 4px;">
            📍 ${lot.address || `${lot.lat.toFixed(4)}, ${lot.lng.toFixed(4)}`}
          </p>
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px; font-size: 14px;">
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #4b5563;">Available:</span>
            <span style="font-weight: 600;">${lot.available}/${lot.capacity}</span>
          </div>
          ${lot.evSpots > 0 ? `
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="color: #4b5563;">⚡ EV Spots:</span>
              <span style="font-weight: 600;">${lot.evAvailable}/${lot.evSpots}</span>
            </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; background: #f0fdf4; padding: 4px 8px; border-radius: 4px;">
            <span style="color: #4b5563;">Rate:</span>
            <span style="font-weight: 600; color: #15803d;">$${lot.pricePerHour}/hr</span>
          </div>
          <div style="display: flex; justify-content: space-between; background: #fefce8; padding: 4px 8px; border-radius: 4px;">
            <span style="color: #4b5563;">⏰ Prediction:</span>
            <span style="font-weight: 600; color: #a16207;">Likely full by 6:00 PM</span>
          </div>
        </div>
        <button 
          onclick="window.open('https://www.google.com/maps/search/?api=1&query=${lot.lat},${lot.lng}', '_blank')"
          style="margin-top: 12px; width: 100%; background: #2563eb; color: white; padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer; font-weight: 500; display: flex; align-items: center; justify-content: center; gap: 8px;"
          onmouseover="this.style.background='#1d4ed8'"
          onmouseout="this.style.background='#2563eb'"
        >
          🔗 Open in Google Maps
        </button>
      </div>
    `
  }

  if (loading) {
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
    <div className="bg-white rounded-lg shadow overflow-hidden relative" style={{ height: 'calc(100vh - 12rem)', minHeight: '500px', width: '100%' }}>
      <div ref={mapRef} style={{ height: '100%', width: '100%', zIndex: 1 }} />
      {selectedLot && (
        <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-white rounded-lg shadow-lg p-4 z-[1000]">
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
            onClick={() => {
              const url = `https://www.google.com/maps/search/?api=1&query=${selectedLot.lat},${selectedLot.lng}`
              window.open(url, '_blank')
            }}
            className="mt-3 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Open in Google Maps
          </button>
          <button
            onClick={() => setSelectedLot(null)}
            className="mt-2 w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition"
          >
            Close
          </button>
        </div>
      )}
    </div>
  )
}
