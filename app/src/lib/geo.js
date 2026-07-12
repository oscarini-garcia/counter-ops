const NOMINATIM = 'https://nominatim.openstreetmap.org/reverse'
const NOMINATIM_SEARCH = 'https://nominatim.openstreetmap.org/search'
const GEOCODE_CACHE_KEY = 'counter-ops-geocode'

function loadGeoCache() {
  try { return JSON.parse(localStorage.getItem(GEOCODE_CACHE_KEY)) ?? {} } catch { return {} }
}

function saveGeoCache(cache) {
  try { localStorage.setItem(GEOCODE_CACHE_KEY, JSON.stringify(cache)) } catch { /* full or blocked */ }
}

// Forward geocoding: a hand-typed place/city name → coordinates.
// Results (including misses) are cached per label; network errors are NOT
// cached so the label can be retried when back online.
export async function geocodePlace(query) {
  const q = (query ?? '').trim()
  if (!q) return null
  const cache = loadGeoCache()
  const key = q.toLowerCase()
  if (key in cache) return cache[key]
  try {
    const res = await fetch(
      `${NOMINATIM_SEARCH}?format=json&limit=1&q=${encodeURIComponent(q)}`,
      { headers: { 'Accept-Language': 'es' } }
    )
    if (!res.ok) return null
    const data = await res.json()
    const hit = Array.isArray(data) ? data[0] : null
    const result = hit ? { lat: Number(hit.lat), lng: Number(hit.lon) } : null
    cache[key] = result
    saveGeoCache(cache)
    return result
  } catch {
    return null
  }
}

// True if the label is already resolved in the cache (no network needed)
export function isGeocodeCached(query) {
  const key = (query ?? '').trim().toLowerCase()
  return key !== '' && key in loadGeoCache()
}

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
