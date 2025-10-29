import { GoogleMap, Marker, InfoWindow } from '@react-google-maps/api'
import { useEffect, useState } from 'react'
import { useParking } from '../contexts/ParkingContext.jsx'
import { useLocation, useNavigate } from 'react-router-dom'
import { MapPin, Zap, Clock, ExternalLink } from 'lucide-react'

const mapContainerStyle = { width: '100%', height: '100%' }
const defaultCenter = { lat: 24.8607, lng: 67.0011 }

const markerIcon = (evAvailable, available) => {
  if (evAvailable > 0) return `data:image/svg+xml;charset=UTF-8;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#3b82f6" stroke="white" stroke-width="2"/><text x="12" y="16" text-anchor="middle" fill="white" font-size="14" font-weight="bold">⚡</text></svg>`)}`
  if (available > 0) return `data:image/svg+xml;charset=UTF-8;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#22c55e" stroke="white" stroke-width="2"/></svg>`)}`
  return `data:image/svg+xml;charset=UTF-8;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#ef4444" stroke="white" stroke-width="2"/></svg>`)}`
}

export default function MapView() {
  const { filteredLots, loading, error } = useParking()
  const location = useLocation()
  const navigate = useNavigate()
  const focusId = location.state?.focusId
  const [selectedLot, setSelectedLot] = useState(null)
  const [center, setCenter] = useState(defaultCenter)

  useEffect(() => {
    if (focusId) {
      const lot = filteredLots.find(l => l.id === focusId)
      if (lot) {
        setCenter({ lat: lot.lat, lng: lot.lng })
        setSelectedLot(lot)
      }
    }
  }, [focusId, filteredLots])

  if (loading) return <div className="text-center py-10">Loading map...</div>
  if (error) return <div className="text-center py-10 text-red-600">{error}</div>

  const openInGoogleMaps = (lot) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${lot.lat},${lot.lng}`
    window.open(url, '_blank')
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden h-[calc(100vh-12rem)]">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={13}
        options={{
          disableDefaultUI: false,
          zoomControl: true,
          fullscreenControl: true,
          mapTypeControl: true,
          streetViewControl: false,
        }}
        onLoad={(map) => {
          if (focusId) {
            const lot = filteredLots.find(l => l.id === focusId)
            if (lot) map.setCenter({ lat: lot.lat, lng: lot.lng })
          }
        }}
      >
        {filteredLots.map((lot) => (
          <Marker
            key={lot.id}
            position={{ lat: lot.lat, lng: lot.lng }}
            icon={{
              url: markerIcon(lot.evAvailable, lot.available),
              scaledSize: new window.google.maps.Size(40, 40),
            }}
            onClick={() => setSelectedLot(lot)}
          />
        ))}
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
  )
}
