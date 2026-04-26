import { useState, useEffect } from 'react'
import { useStore } from './useStore.jsx'
import { reverseGeocode, getRecentLocations } from '../lib/geo.js'

export function useGPS() {
  const { entries } = useStore()
  const [location, setLocation] = useState(null)
  const [status, setStatus] = useState('resolving') // resolving | resolved | timeout | denied
  const recentLocations = getRecentLocations(entries)

  useEffect(() => {
    if (!navigator.geolocation) { setStatus('denied'); return }

    let done = false
    const timer = setTimeout(() => {
      if (!done) { done = true; setStatus('timeout') }
    }, 5000)

    navigator.geolocation.getCurrentPosition(
      async pos => {
        if (done) return
        done = true
        clearTimeout(timer)
        const { latitude: lat, longitude: lng, accuracy } = pos.coords
        const label = await reverseGeocode(lat, lng)
        setLocation({ lat, lng, accuracy, label: label || null })
        setStatus('resolved')
      },
      () => {
        if (done) return
        done = true
        clearTimeout(timer)
        setStatus('denied')
      },
      { timeout: 5000, maximumAge: 60000, enableHighAccuracy: false }
    )

    return () => clearTimeout(timer)
  }, [])

  function selectLocation(loc) {
    setLocation(loc)
    setStatus('resolved')
  }

  return { location, status, recentLocations, selectLocation }
}
