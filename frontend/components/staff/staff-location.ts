export const STAFF_LOCATION = {
  name: 'The Serene Villa',
  address: 'HPC Landmark, 105 Tố Hữu, Văn Khê, Hà Đông, Hà Nội',
  lat: 20.9829,
  lng: 105.7874,
  radiusMeters: 100,
} as const

export function calculateDistanceMeters(fromLat: number, fromLng: number, toLat: number, toLng: number) {
  const earthRadiusMeters = 6371000
  const fromPhi = toRadians(fromLat)
  const toPhi = toRadians(toLat)
  const deltaPhi = toRadians(toLat - fromLat)
  const deltaLambda = toRadians(toLng - fromLng)
  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(fromPhi) * Math.cos(toPhi) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2)
  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function isWithinStaffLocation(distanceMeters: number) {
  return distanceMeters <= STAFF_LOCATION.radiusMeters
}

export function getCurrentPosition() {
  return new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    })
  })
}

export function formatDistance(distanceMeters: number) {
  if (distanceMeters < 1000) return `${Math.round(distanceMeters)}m`
  return `${(distanceMeters / 1000).toFixed(1)}km`
}

function toRadians(value: number) {
  return (value * Math.PI) / 180
}
