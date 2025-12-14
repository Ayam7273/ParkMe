/**
 * Fetch parking lots from Google Places API
 * @param {Object} location - { lat, lng }
 * @param {number} radiusMeters - Search radius in meters
 * @param {string} apiKey - Google Maps API key
 * @returns {Promise<Array>} Array of parking lot objects
 */
export async function fetchParkingLotsFromPlaces(location, radiusMeters = 5000, apiKey) {
  if (!window.google || !window.google.maps || !window.google.maps.places) {
    throw new Error('Google Maps Places API not loaded')
  }

  return new Promise((resolve, reject) => {
    const service = new window.google.maps.places.PlacesService(
      document.createElement('div')
    )

    const request = {
      location: new window.google.maps.LatLng(location.lat, location.lng),
      radius: radiusMeters,
      type: 'parking',
      keyword: 'parking lot parking garage car park'
    }

    service.nearbySearch(request, (results, status, pagination) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
        // Format results to match our parking lot structure
        const parkingLots = results.map((place, index) => {
          // Generate realistic capacity and EV spots based on place type
          const isLarge = place.types?.some(t => 
            t === 'airport' || 
            t === 'shopping_mall' || 
            place.name?.toLowerCase().includes('airport') ||
            place.name?.toLowerCase().includes('mall') ||
            place.name?.toLowerCase().includes('centre')
          )
          
          const capacity = isLarge 
            ? Math.floor(Math.random() * 800) + 400  // 400-1200 for large places
            : Math.floor(Math.random() * 300) + 100   // 100-400 for regular places
          
          const evSpots = Math.max(5, Math.floor(capacity * 0.1)) // 10% EV spots, min 5
          
          // Random availability
          const occupied = Math.floor(Math.random() * capacity)
          const evOccupied = Math.min(Math.floor(Math.random() * evSpots), occupied)
          
          return {
            id: place.place_id || `parking-${index}-${Date.now()}`,
            name: place.name || 'Parking Lot',
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            address: place.vicinity || place.formatted_address || 'Address not available',
            capacity: capacity,
            evSpots: evSpots,
            occupied: occupied,
            available: capacity - occupied,
            evAvailable: Math.max(0, evSpots - evOccupied),
            pricePerHour: Number((Math.random() * 12 + 2).toFixed(2)),
            placeId: place.place_id,
            rating: place.rating,
            userRatingsTotal: place.user_ratings_total,
            types: place.types
          }
        })

        // If there are more results, fetch them
        if (pagination && pagination.hasNextPage) {
          pagination.nextPage()
          // Note: For simplicity, we'll just return the first page
          // In production, you might want to fetch all pages
        }

        resolve(parkingLots)
      } else if (status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
        resolve([]) // No results, return empty array
      } else {
        reject(new Error(`Places API error: ${status}`))
      }
    })
  })
}

/**
 * Search for parking lots using text query
 * @param {string} query - Search query (e.g., "parking in London")
 * @param {string} apiKey - Google Maps API key
 * @returns {Promise<Array>} Array of parking lot objects
 */
export async function searchParkingLotsByText(query, apiKey) {
  if (!window.google || !window.google.maps || !window.google.maps.places) {
    throw new Error('Google Maps Places API not loaded')
  }

  return new Promise((resolve, reject) => {
    const service = new window.google.maps.places.PlacesService(
      document.createElement('div')
    )

    const request = {
      query: `${query} parking`,
      type: 'parking'
    }

    service.textSearch(request, (results, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
        const parkingLots = results.map((place, index) => {
          const isLarge = place.types?.some(t => 
            t === 'airport' || 
            t === 'shopping_mall' ||
            place.name?.toLowerCase().includes('airport') ||
            place.name?.toLowerCase().includes('mall')
          )
          
          const capacity = isLarge 
            ? Math.floor(Math.random() * 800) + 400
            : Math.floor(Math.random() * 300) + 100
          
          const evSpots = Math.max(5, Math.floor(capacity * 0.1))
          const occupied = Math.floor(Math.random() * capacity)
          const evOccupied = Math.min(Math.floor(Math.random() * evSpots), occupied)
          
          return {
            id: place.place_id || `parking-${index}-${Date.now()}`,
            name: place.name || 'Parking Lot',
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            address: place.formatted_address || place.vicinity || 'Address not available',
            capacity: capacity,
            evSpots: evSpots,
            occupied: occupied,
            available: capacity - occupied,
            evAvailable: Math.max(0, evSpots - evOccupied),
            pricePerHour: Number((Math.random() * 12 + 2).toFixed(2)),
            placeId: place.place_id,
            rating: place.rating,
            userRatingsTotal: place.user_ratings_total,
            types: place.types
          }
        })

        resolve(parkingLots)
      } else if (status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
        resolve([])
      } else {
        reject(new Error(`Places API error: ${status}`))
      }
    })
  })
}

