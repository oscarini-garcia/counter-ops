const NOMINATIM = 'https://nominatim.openstreetmap.org/reverse'

export async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `${NOMINATIM}?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=0`,
      { headers: { 'Accept-Language': 'en' } }
    )
    if (!res.ok) return null
    const data = await res.json()
    // Use town, village, suburb, or county — whatever is most specific
    const a = data.address || {}
    const label = a.amenity || a.tourism || a.shop || a.hamlet || a.suburb || a.town || a.village || a.city || a.county || data.display_name?.split(',')[0] || null
    return label
  } catch {
    return null
  }
}

// Extract the last 5 distinct locations from entries (most recent first)
export function getRecentLocations(entries) {
  const seen = new Set()
  const result = []
  for (let i = entries.length - 1; i >= 0; i--) {
    const loc = entries[i].location
    if (!loc?.label) continue
    if (seen.has(loc.label)) continue
    seen.add(loc.label)
    result.push(loc)
    if (result.length >= 5) break
  }
  return result
}
