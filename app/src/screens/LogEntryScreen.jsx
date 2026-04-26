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

  const [selectedMember, setSelectedMember] = useState(memberId || '')
  const [selectedCounter, setSelectedCounter] = useState('')
  const [qty, setQty] = useState(1)
  const [note, setNote] = useState('')

  const { location, status: gpsStatus, recentLocations, selectLocation } = useGPS()
  const [manualLocation, setManualLocation] = useState(null)

  const resolvedLocation = manualLocation ?? (gpsStatus === 'resolved' ? location : null)
  const showFallback = gpsStatus === 'timeout' || gpsStatus === 'denied'

  const activeCounters = counters.filter(c => !c.archived)

  // Pre-select counter from URL param (e.g. quick-log from another screen)
  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    const cid = p.get('counter')
    if (cid && activeCounters.find(c => c.id === cid)) setSelectedCounter(cid)
  }, [])

  function handleSubmit(e) {
    e.preventDefault()
    if (!selectedMember || !selectedCounter) return
    dispatch({
      type: 'ADD_ENTRY',
      memberId: selectedMember,
      counterId: selectedCounter,
      qty,
      location: resolvedLocation,
      note,
    })
    window.dispatchEvent(new CustomEvent('counter-ops:sync'))
    // Reset form
    setQty(1)
    setNote('')
    setManualLocation(null)
  }

  return (
    <form onSubmit={handleSubmit} className="px-4 py-4 flex flex-col gap-4 max-w-lg mx-auto">
      <h1 className="text-lg font-bold text-slate-100">Log Entry</h1>

      {/* Who */}
      <div>
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Who</label>
        <div className="flex flex-wrap gap-2">
          {members.map(m => (
            <button
              key={m.id}
              type="button"
              onClick={() => setSelectedMember(m.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedMember === m.id
                  ? 'bg-indigo-500 text-white'
                  : 'bg-slate-700 text-slate-200 active:bg-slate-600'
              }`}
            >
              {m.name}
            </button>
          ))}
        </div>
      </div>

      {/* What */}
      <div>
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">What</label>
        <div className="flex flex-wrap gap-2">
          {activeCounters.map(c => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedCounter(c.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedCounter === c.id
                  ? 'bg-indigo-500 text-white'
                  : 'bg-slate-700 text-slate-200 active:bg-slate-600'
              }`}
            >
              <span>{c.emoji}</span> {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* How many */}
      <div>
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">How many</label>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setQty(q => Math.max(1, q - 1))}
            className="w-10 h-10 rounded-full bg-slate-700 text-slate-100 text-xl font-bold active:bg-slate-600 flex items-center justify-center">−</button>
          <span className="text-2xl font-bold text-slate-100 min-w-[2ch] text-center">{qty}</span>
          <button type="button" onClick={() => setQty(q => q + 1)}
            className="w-10 h-10 rounded-full bg-slate-700 text-slate-100 text-xl font-bold active:bg-slate-600 flex items-center justify-center">+</button>
        </div>
      </div>

      {/* Where */}
      <div>
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Where</label>
        {gpsStatus === 'resolving' && (
          <div className="text-sm text-slate-400 flex items-center gap-2">
            <span className="animate-spin">🔄</span> Getting location…
          </div>
        )}
        {gpsStatus === 'resolved' && location && !manualLocation && (
          <div className="text-sm text-slate-300 flex items-center gap-1.5">
            <span>📍</span> {location.label || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`}
            <button type="button" onClick={() => setManualLocation(null)} className="text-xs text-slate-500 ml-1">✕</button>
          </div>
        )}
        {manualLocation && (
          <div className="text-sm text-slate-300 flex items-center gap-1.5">
            <span>📍</span> {manualLocation.label}
            <button type="button" onClick={() => setManualLocation(null)} className="text-xs text-slate-500 ml-1">✕</button>
          </div>
        )}
        {showFallback && recentLocations.length > 0 && !manualLocation && (
          <div>
            <p className="text-xs text-slate-400 mb-1.5">GPS unavailable — tap a recent location:</p>
            <div className="flex flex-col gap-1">
              {recentLocations.map((loc, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setManualLocation(loc)}
                  className="text-left text-sm px-3 py-2 bg-slate-700 rounded-lg text-slate-200 active:bg-slate-600"
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
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Note (optional)</label>
        <input
          type="text"
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="e.g. shared with Ana"
          className="w-full bg-slate-700 text-slate-100 rounded-xl px-3 py-2.5 text-sm placeholder-slate-500 outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={!selectedMember || !selectedCounter}
        className="w-full bg-indigo-500 text-white font-semibold py-3.5 rounded-2xl text-base disabled:opacity-40 active:bg-indigo-600 transition-colors mt-2"
      >
        Log It ✓
      </button>

      <UndoToast />
    </form>
  )
}
