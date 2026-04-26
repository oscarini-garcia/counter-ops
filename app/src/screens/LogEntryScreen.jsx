import React, { useState, useEffect } from 'react'
import { useStore, useDispatch, useNavigate } from '../hooks/useStore.jsx'
import { useMember } from '../hooks/useMember.js'
import { useGPS } from '../hooks/useGPS.js'
import UndoToast from '../components/UndoToast.jsx'

export default function LogEntryScreen() {
  const { counters, members } = useStore()
  const { memberId } = useMember()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const [selectedMember,  setSelectedMember]  = useState(memberId || '')
  const [selectedCounter, setSelectedCounter] = useState('')
  const [qty,             setQty]             = useState(1)
  const [rating,          setRating]          = useState(null)
  const [note,            setNote]            = useState('')

  const { location, status: gpsStatus, recentLocations, selectLocation } = useGPS()
  const [manualLocation, setManualLocation] = useState(null)

  const resolvedLocation = manualLocation ?? (gpsStatus === 'resolved' ? location : null)
  const showFallback     = gpsStatus === 'timeout' || gpsStatus === 'denied'

  useEffect(() => {
    const p   = new URLSearchParams(window.location.search)
    const cid = p.get('counter')
    if (cid && counters.find(c => c.id === cid)) setSelectedCounter(cid)
  }, [])

  function handleSubmit(e) {
    e.preventDefault()
    if (!selectedMember || !selectedCounter) return
    dispatch({
      type: 'ADD_ENTRY',
      memberId: selectedMember,
      counterId: selectedCounter,
      qty,
      rating,
      location: resolvedLocation,
      note,
    })
    window.dispatchEvent(new CustomEvent('counter-ops:sync'))
    setQty(1); setRating(null); setNote(''); setManualLocation(null)
  }

  const chipActive   = { background: 'var(--c-brand)',    color: '#fff',              border: '1.5px solid var(--c-brand)' }
  const chipInactive = { background: 'var(--c-surface)',   color: 'var(--c-text)',     border: '1.5px solid var(--c-border)' }
  const chip = (active) => ({
    padding: '7px 16px', borderRadius: 999, fontSize: 13, fontWeight: 700,
    cursor: 'pointer', transition: 'all 0.15s',
    ...(active ? chipActive : chipInactive),
  })

  return (
    <form
      onSubmit={handleSubmit}
      className="px-4 py-5 flex flex-col gap-5 max-w-lg mx-auto"
      style={{ background: 'var(--c-bg)' }}
    >
      <h1 className="text-xl font-black" style={{ color: 'var(--c-text)' }}>Log Entry</h1>

      {/* Who */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--c-text-muted)' }}>Who</label>
        <div className="flex flex-wrap gap-2">
          {members.map(m => (
            <button key={m.id} type="button" onClick={() => setSelectedMember(m.id)} style={chip(selectedMember === m.id)}>
              {m.name}
            </button>
          ))}
        </div>
      </div>

      {/* What */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--c-text-muted)' }}>What</label>
        <div className="flex flex-wrap gap-2">
          {counters.map(c => (
            <button key={c.id} type="button" onClick={() => setSelectedCounter(c.id)} style={chip(selectedCounter === c.id)}>
              {c.emoji} {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* How many */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--c-text-muted)' }}>How many</label>
        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={() => setQty(q => Math.max(1, q - 1))}
            className="w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold active:opacity-70 transition-opacity"
            style={{ background: 'var(--c-surface)', border: '1.5px solid var(--c-border)', color: 'var(--c-text)' }}
          >
            −
          </button>
          <span className="text-4xl font-black min-w-[3ch] text-center" style={{ color: 'var(--c-text)' }}>{qty}</span>
          <button
            type="button"
            onClick={() => setQty(q => q + 1)}
            className="w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold active:opacity-70 transition-opacity"
            style={{ background: 'var(--c-brand)', color: '#fff', border: 'none' }}
          >
            +
          </button>
        </div>
      </div>

      {/* Where */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--c-text-muted)' }}>Where</label>
        {gpsStatus === 'resolving' && (
          <div className="text-sm flex items-center gap-2" style={{ color: 'var(--c-text-muted)' }}>
            <span className="animate-spin inline-block">↻</span> Getting location…
          </div>
        )}
        {gpsStatus === 'resolved' && location && !manualLocation && (
          <div className="text-sm flex items-center gap-1.5 px-3 py-2 rounded-xl" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}>
            <span>📍</span>
            <span className="flex-1">{location.label || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`}</span>
            <button type="button" onClick={() => setManualLocation(null)} className="text-xs ml-1" style={{ color: 'var(--c-text-muted)' }}>✕</button>
          </div>
        )}
        {manualLocation && (
          <div className="text-sm flex items-center gap-1.5 px-3 py-2 rounded-xl" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}>
            <span>📍</span>
            <span className="flex-1">{manualLocation.label}</span>
            <button type="button" onClick={() => setManualLocation(null)} className="text-xs ml-1" style={{ color: 'var(--c-text-muted)' }}>✕</button>
          </div>
        )}
        {showFallback && recentLocations.length > 0 && !manualLocation && (
          <div>
            <p className="text-xs mb-1.5" style={{ color: 'var(--c-text-muted)' }}>GPS unavailable — tap a recent location:</p>
            <div className="flex flex-col gap-1">
              {recentLocations.map((loc, i) => (
                <button
                  key={i} type="button" onClick={() => setManualLocation(loc)}
                  className="text-left text-sm px-3 py-2 rounded-xl active:opacity-70"
                  style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}
                >
                  📍 {loc.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Note */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--c-text-muted)' }}>Note (optional)</label>
        <input
          type="text"
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="e.g. shared with Ana"
          className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
          style={{
            background: 'var(--c-surface)',
            border: '1.5px solid var(--c-border)',
            color: 'var(--c-text)',
          }}
        />
      </div>

      {/* Rating */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--c-text-muted)' }}>Rating (optional)</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star} type="button"
              onClick={() => setRating(rating === star ? null : star)}
              className="text-3xl leading-none active:scale-110 transition-transform"
              aria-label={`${star} star`}
            >
              {star <= (rating ?? 0) ? '⭐' : '☆'}
            </button>
          ))}
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={!selectedMember || !selectedCounter}
        className="w-full font-bold py-4 rounded-2xl text-base disabled:opacity-40 active:opacity-80 transition-opacity mt-1"
        style={{ background: 'var(--c-brand)', color: '#fff', fontSize: 16 }}
      >
        Log It ✓
      </button>

      <UndoToast />
    </form>
  )
}
