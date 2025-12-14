/**
 * Calculate the distance between two coordinates using the Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lng1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lng2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
export function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371 // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c
  
  return distance
}

function toRad(degrees) {
  return (degrees * Math.PI) / 180
}

/**
 * Filter parking lots within a certain radius from a center point
 * @param {Array} lots - Array of parking lots with lat/lng properties
 * @param {Object} center - Center point { lat, lng }
 * @param {number} radiusKm - Radius in kilometers (default: 10km)
 * @returns {Array} Filtered parking lots
 */
export function filterLotsByLocation(lots, center, radiusKm = 10) {
  if (!center || !center.lat || !center.lng) return lots
  
  return lots.filter((lot) => {
    const distance = calculateDistance(
      center.lat,
      center.lng,
      lot.lat,
      lot.lng
    )
    return distance <= radiusKm
  })
}

/**
 * Get bounds from a center point and radius
 * @param {Object} center - Center point { lat, lng }
 * @param {number} radiusKm - Radius in kilometers
 * @returns {Object} Bounds { north, south, east, west }
 */
export function getBoundsFromCenter(center, radiusKm = 10) {
  const R = 6371 // Earth's radius in kilometers
  const latDelta = radiusKm / R * (180 / Math.PI)
  const lngDelta = radiusKm / (R * Math.cos(center.lat * Math.PI / 180)) * (180 / Math.PI)
  
  return {
    north: center.lat + latDelta,
    south: center.lat - latDelta,
    east: center.lng + lngDelta,
    west: center.lng - lngDelta
  }
}

/**
 * Save last searched location to localStorage
 * @param {Object} location - Location object { lat, lng, address }
 */
export function saveLastSearchedLocation(location) {
  try {
    localStorage.setItem('parkme_last_searched_location', JSON.stringify({
      ...location,
      timestamp: Date.now()
    }))
  } catch (error) {
    console.error('Failed to save last searched location:', error)
  }
}

/**
 * Get last searched location from localStorage
 * @returns {Object|null} Location object or null
 */
export function getLastSearchedLocation() {
  try {
    const stored = localStorage.getItem('parkme_last_searched_location')
    if (!stored) return null
    
    const location = JSON.parse(stored)
    // Return location if it's less than 7 days old
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
    if (location.timestamp && location.timestamp > sevenDaysAgo) {
      return location
    }
    return null
  } catch (error) {
    console.error('Failed to get last searched location:', error)
    return null
  }
}

/**
 * Save user's current location to localStorage
 * @param {Object} location - Location object { lat, lng }
 */
export function saveUserLocation(location) {
  try {
    localStorage.setItem('parkme_user_location', JSON.stringify({
      ...location,
      timestamp: Date.now()
    }))
  } catch (error) {
    console.error('Failed to save user location:', error)
  }
}

/**
 * Get user's saved location from localStorage
 * @returns {Object|null} Location object or null
 */
export function getUserLocation() {
  try {
    const stored = localStorage.getItem('parkme_user_location')
    if (!stored) return null
    
    const location = JSON.parse(stored)
    // Return location if it's less than 1 day old
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000)
    if (location.timestamp && location.timestamp > oneDayAgo) {
      return location
    }
    return null
  } catch (error) {
    console.error('Failed to get user location:', error)
    return null
  }
}

