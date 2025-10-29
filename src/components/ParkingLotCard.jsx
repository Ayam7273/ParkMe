import { memo } from 'react'

function ParkingLotCardComponent({ lot, onFocus }) {
  const availabilityPct = Math.round((lot.available / lot.capacity) * 100)
  const statusColor = lot.available > lot.capacity * 0.5
    ? 'bg-green-100 text-green-700'
    : lot.available > 0
    ? 'bg-yellow-100 text-yellow-700'
    : 'bg-red-100 text-red-700'

  return (
    <button onClick={()=>onFocus?.(lot)} className="w-full text-left bg-white rounded-lg shadow p-4 hover:shadow-md transition">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-medium">{lot.name}</div>
          <div className="text-xs text-gray-500">{lot.available}/{lot.capacity} available</div>
        </div>
        <span className={`text-xs px-2 py-1 rounded ${statusColor}`}>{availabilityPct}% free</span>
      </div>
      <div className="mt-2 flex items-center gap-4 text-sm">
        <div className="text-gray-600">£{lot.pricePerHour}/hr</div>
        <div className="flex items-center gap-1 text-blue-600">
          <span className="text-xs">EV</span>
          <span className="text-xs">{lot.evAvailable}</span>
        </div>
      </div>
    </button>
  )
}

const ParkingLotCard = memo(ParkingLotCardComponent, (prev, next) => {
  return (
    prev.lot.id === next.lot.id &&
    prev.lot.available === next.lot.available &&
    prev.lot.evAvailable === next.lot.evAvailable &&
    prev.lot.pricePerHour === next.lot.pricePerHour
  )
})

export default ParkingLotCard
