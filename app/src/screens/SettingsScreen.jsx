import React, { useState } from 'react'
import { useStore, useDispatch, useNavigate } from '../hooks/useStore.jsx'

export default function SettingsScreen() {
  const { syncLog, adminUnlocked } = useStore()
  const dispatch  = useDispatch()
  const navigate  = useNavigate()
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [adminKey,         setAdminKey]         = useState('')
  const [adminError,       setAdminError]       = useState(false)

  function tryUnlockAdmin(e) {
    e.preventDefault()
    const correct = import.meta.env.VITE_ADMIN_KEY || 'admin'
    if (adminKey === correct) {
      dispatch({ type: 'SET_ADMIN_UNLOCKED', value: true })
      navigate('admin')
    } else {
      setAdminError(true)
      setAdminKey('')
      setTimeout(() => setAdminError(false), 2000)
    }
  }

  function forceRefresh() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(regs => {
        for (const reg of regs) reg.unregister()
        window.location.reload()
      })
    } else {
      window.location.reload()
    }
  }

  function resetLocal() {
    dispatch({ type: 'RESET_LOCAL' })
    setShowResetConfirm(false)
    window.location.reload()
  }

  const sectionLabel = 'block text-xs font-bold uppercase tracking-wider mb-1.5'

  return (
    <div className="px-4 py-5 flex flex-col gap-6 max-w-lg mx-auto pb-8" style={{ background: 'var(--c-bg)' }}>
      <h1 className="text-xl font-black" style={{ color: 'var(--c-text)' }}>Settings</h1>

      {/* Admin access */}
      <div>
        <label className={sectionLabel} style={{ color: 'var(--c-text-muted)' }}>Admin</label>
        {adminUnlocked ? (
          <button
            onClick={() => navigate('admin')}
            className="w-full font-semibold py-3 rounded-xl text-sm active:opacity-80 transition-opacity"
            style={{ background: 'var(--c-brand)', color: '#fff' }}
          >
            ⚙️ Open Admin Panel
          </button>
        ) : (
          <form onSubmit={tryUnlockAdmin} className="flex gap-2">
            <input
              type="password"
              value={adminKey}
              onChange={e => setAdminKey(e.target.value)}
              placeholder="Admin key"
              className="flex-1 rounded-xl px-3 py-2.5 text-sm outline-none"
              style={{
                background: 'var(--c-surface)',
                border: adminError ? '2px solid var(--c-danger)' : '1.5px solid var(--c-border)',
                color: 'var(--c-text)',
              }}
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-sm font-bold active:opacity-80"
              style={{ background: 'var(--c-brand)', color: '#fff' }}
            >
              {adminError ? '✗' : 'Unlock'}
            </button>
          </form>
        )}
      </div>

      {/* Force refresh */}
      <div>
        <label className={sectionLabel} style={{ color: 'var(--c-text-muted)' }}>App update</label>
        <button
          onClick={forceRefresh}
          className="w-full font-medium py-3 rounded-xl text-sm active:opacity-80 transition-opacity"
          style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}
        >
          ↻ Force refresh (clears service worker)
        </button>
      </div>

      {/* Sync log */}
      <div>
        <label className={sectionLabel} style={{ color: 'var(--c-text-muted)' }}>Sync log (last 10)</label>
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
          {syncLog?.length ? syncLog.map((entry, i) => (
            <div key={i} className="px-3 py-2" style={{ borderBottom: i < syncLog.length - 1 ? '1px solid var(--c-border)' : 'none' }}>
              <div className="flex items-center gap-2">
                <span className="text-sm">
                  {entry.status === 'ok' ? '✅' : entry.status === 'error' ? '❌' : '↻'}
                </span>
                <span className="text-xs flex-1" style={{ color: 'var(--c-text-muted)' }}>{entry.message ?? entry.status}</span>
                <span className="text-xs flex-shrink-0" style={{ color: 'var(--c-text-muted)' }}>{new Date(entry.ts).toLocaleTimeString()}</span>
              </div>
              {(entry.binId || entry.keyPreview || entry.httpStatus || entry.responseBody) && (
                <div className="mt-1 ml-6 flex flex-col gap-0.5">
                  {entry.binId       && <span className="text-xs" style={{ color: 'var(--c-text-muted)' }}>Bin: <span className="font-mono">{entry.binId}</span></span>}
                  {entry.keyPreview  && <span className="text-xs" style={{ color: 'var(--c-text-muted)' }}>Key: <span className="font-mono">{entry.keyPreview}</span></span>}
                  {entry.httpStatus  && <span className="text-xs" style={{ color: 'var(--c-danger)' }}>HTTP {entry.httpStatus}</span>}
                  {entry.payloadBytes != null && <span className="text-xs" style={{ color: 'var(--c-text-muted)' }}>Payload: {(entry.payloadBytes / 1024).toFixed(1)} KB</span>}
                  {entry.responseBody && <span className="text-xs break-all" style={{ color: 'var(--c-text-muted)' }}>{entry.responseBody}</span>}
                </div>
              )}
            </div>
          )) : (
            <div className="px-3 py-3 text-xs" style={{ color: 'var(--c-text-muted)' }}>No sync attempts yet.</div>
          )}
        </div>
      </div>

      {/* Danger zone */}
      <div>
        <label className={sectionLabel} style={{ color: 'var(--c-text-muted)' }}>Danger zone</label>
        {!showResetConfirm ? (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="w-full font-medium py-3 rounded-xl text-sm active:opacity-80"
            style={{ background: 'rgba(239,68,68,0.08)', color: 'var(--c-danger)', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            🗑️ Reset local data
          </button>
        ) : (
          <div className="rounded-xl p-4 flex flex-col gap-3" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <p className="text-sm" style={{ color: 'var(--c-danger)' }}>This wipes all local data. Are you sure?</p>
            <div className="flex gap-2">
              <button onClick={() => setShowResetConfirm(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}>Cancel</button>
              <button onClick={resetLocal} className="flex-1 py-2.5 rounded-xl text-sm font-bold" style={{ background: 'var(--c-danger)', color: '#fff' }}>Reset</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
