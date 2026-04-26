import React, { useEffect, useRef } from 'react'
import 'leaflet/dist/leaflet.css'

// Leaflet accesses window at import time — must only be loaded client-side via lazy()
export default function LeafletMap({ entries, counters }) {
  const mapRef = useRef(null)
  const instanceRef = useRef(null)

  useEffect(() => {
    if (!mapRef.current) return

    import('leaflet').then(L => {
      if (instanceRef.current) { instanceRef.current.remove(); instanceRef.current = null }

      const withLocation = entries.filter(e => e.location?.lat)
      if (withLocation.length === 0) return

      const centre = [withLocation[0].location.lat, withLocation[0].location.lng]
      const map = L.map(mapRef.current, { zoomControl: true }).setView(centre, 13)
      instanceRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map)

      const counterMap = Object.fromEntries(counters.map(c => [c.id, c]))

      for (const e of withLocation) {
        const c = counterMap[e.counter]
        const icon = L.divIcon({
          html: `<div style="font-size:20px;line-height:1">${c?.emoji ?? '📍'}</div>`,
          className: '',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        })
        L.marker([e.location.lat, e.location.lng], { icon })
          .addTo(map)
          .bindPopup(`<b>${c?.label ?? e.counter}</b><br/>${e.member} × ${e.qty}<br/>${e.location.label ?? ''}`)
      }

      // Fit bounds if multiple entries
      if (withLocation.length > 1) {
        const bounds = L.latLngBounds(withLocation.map(e => [e.location.lat, e.location.lng]))
        map.fitBounds(bounds, { padding: [20, 20] })
      }
    })

    return () => { if (instanceRef.current) { instanceRef.current.remove(); instanceRef.current = null } }
  }, [entries, counters])

  return <div ref={mapRef} className="w-full rounded-xl overflow-hidden" style={{ height: 280 }} />
}
