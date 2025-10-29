import { useMemo, useState } from 'react'
import { useParking } from '../contexts/ParkingContext.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import ParkingLotCard from '../components/ParkingLotCard.jsx'
import { useNavigate } from 'react-router-dom'
import { MapPin, Zap, ToggleLeft, ToggleRight, Navigation } from 'lucide-react'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function Dashboard() {
  const { filteredLots, loading, error, evOnly, setEvOnly } = useParking()
  const { session } = useAuth()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const filteredByName = useMemo(() => {
    if (!query.trim()) return filteredLots
    const term = query.toLowerCase()
    return filteredLots.filter((lot) => lot.name.toLowerCase().includes(term))
  }, [filteredLots, query])

  const stats = useMemo(() => {
    const totalAvailable = filteredByName.reduce((a, b) => a + b.available, 0)
    const evAvailable = filteredByName.reduce((a, b) => a + b.evAvailable, 0)
    return { totalAvailable, evAvailable }
  }, [filteredByName])

  const handleUseMyLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          // TODO: Filter lots by proximity to user location
          alert(`Location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`)
        },
        (error) => {
          alert('Unable to retrieve your location. Please enable location permissions.')
        }
      )
    } else {
      alert('Geolocation is not supported by your browser.')
    }
  }

  if (loading) return <div className="text-center py-10">Loading live parking data...</div>
  if (error) return <div className="text-center py-10 text-red-600">{error}</div>

  const userName = session?.user?.user_metadata?.full_name || 'there'

  return (
    <div className="space-y-6">
      {/* Header with greeting */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-6 text-white">
        <h1 className="text-3xl font-bold">{getGreeting()}, {userName}!</h1>
        <p className="mt-2 text-blue-100">Find the perfect parking spot in real-time</p>
      </div>

      {/* Search and filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or area..."
            className="flex-1 border rounded-lg px-4 py-2"
          />
          <button
            onClick={handleUseMyLocation}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 transition"
          >
            <Navigation className="w-5 h-5" />
            <span>Use My Location</span>
          </button>
          <button
            onClick={() => setEvOnly(!evOnly)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
              evOnly
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {evOnly ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
            <Zap className="w-5 h-5" />
            <span className="font-medium">EV Only</span>
          </button>
        </div>
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 space-y-4">
          <h2 className="text-2xl font-semibold">Available Parking</h2>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredByName.map((lot) => (
              <ParkingLotCard
                key={lot.id}
                lot={lot}
                onFocus={() => navigate('/map', { state: { focusId: lot.id } })}
              />
            ))}
          </div>
        </section>
        <aside className="space-y-4">
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
            <div className="text-sm text-gray-500">Available Spots</div>
            <div className="text-3xl font-semibold">{stats.totalAvailable}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
            <div className="text-sm text-gray-500 flex items-center gap-2">
              <Zap className="w-4 h-4" /> EV Charging
            </div>
            <div className="text-3xl font-semibold">{stats.evAvailable}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="font-medium mb-2">Tips</div>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
              <li>Use the EV toggle to filter EV charging spots</li>
              <li>Click "Use My Location" to find nearby parking</li>
              <li>Parking data updates every 5 seconds</li>
              <li>Click any card to view it on the map</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}
