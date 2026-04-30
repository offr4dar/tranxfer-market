// Haversine formula — returns distance in miles between two lat/lng points.
export function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 3958.8 // Earth radius in miles
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function toRad(deg: number) {
  return deg * (Math.PI / 180)
}

// Extract the letter-only area prefix from a UK outward code.
// e.g. "SW15" → "SW", "M1" → "M", "EC1A" → "EC"
export function outcodeArea(outcode: string): string {
  return outcode.replace(/[0-9].*/g, '').toUpperCase().trim()
}
