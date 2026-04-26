import React, { useState } from 'react'
import { useStore, useDispatch, useNavigate } from '../hooks/useStore.jsx'

export default function SettingsScreen() {
  const { syncLog, adminUnlocked } = useStore()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [adminKey, setAdminKey] = useState('')
  const [adminError, setAdminError] = useState(false)

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

  return (
    <div className="px-4 py-4 flex flex-col gap-5 max-w-lg mx-auto pb-8">
      <h1 className="text-lg font-bold text-slate-100">Settings</h1>

      {/* Admin access */}
      <div>
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Admin</label>
        {adminUnlocked ? (
          <button
            onClick={() => navigate('admin')}
            className="w-full bg-indigo-500 text-white font-medium py-3 rounded-xl text-sm active:bg-indigo-600"
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
              className={`flex-1 bg-slate-700 text-slate-100 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 ${
                adminError ? 'ring-2 ring-red-500' : 'focus:ring-indigo-500'
              }`}
            />
            <button
              type="submit"
              className="bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-semibold active:bg-indigo-600"
            >
              {adminError ? '✗' : 'Unlock'}
            </button>
          </form>
        )}
      </div>

      {/* Force refresh */}
      <div>
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">App update</label>
        <button
          onClick={forceRefresh}
          className="w-full bg-slate-700 text-slate-200 font-medium py-3 rounded-xl text-sm active:bg-slate-600"
        >
          🔄 Force refresh (clears service worker)
        </button>
      </div>

      {/* Sync log */}
      <div>
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Sync log (last 10)</label>
        <div className="bg-slate-800 rounded-xl overflow-hidden">
          {syncLog?.length ? syncLog.map((entry, i) => (
            <div key={i} className="px-3 py-2 border-b border-slate-700 last:border-0">
              <div className="flex items-center gap-2">
                <span className="text-sm">{entry.status === 'ok' ? '✅' : entry.status === 'error' ? '❌' : '🔄'}</span>
                <span className="text-xs text-slate-400 flex-1">{entry.message ?? entry.status}</span>
                <span className="text-xs text-slate-500 flex-shrink-0">{new Date(entry.ts).toLocaleTimeString()}</span>
              </div>
              {(entry.binId || entry.keyPreview || entry.httpStatus || entry.responseBody) && (
                <div className="mt-1 ml-6 flex flex-col gap-0.5">
                  {entry.binId && (
                    <span className="text-xs text-slate-400">Bin: <span className="font-mono">{entry.binId}</span></span>
                  )}
                  {entry.keyPreview && (
                    <span className="text-xs text-slate-400">Key: <span className="font-mono">{entry.keyPreview}</span></span>
                  )}
                  {entry.httpStatus && (
                    <span className="text-xs text-red-400">HTTP {entry.httpStatus}</span>
                  )}
                  {entry.payloadBytes != null && (
                    <span className="text-xs text-slate-500">Payload: {(entry.payloadBytes / 1024).toFixed(1)} KB</span>
                  )}
                  {entry.responseBody && (
                    <span className="text-xs text-slate-500 break-all">{entry.responseBody}</span>
                  )}
                </div>
              )}
            </div>
          )) : (
            <div className="px-3 py-3 text-xs text-slate-500">No sync attempts yet.</div>
          )}
        </div>
      </div>

      {/* Reset */}
      <div>
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Danger zone</label>
        {!showResetConfirm ? (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="w-full bg-red-900/50 text-red-300 font-medium py-3 rounded-xl text-sm active:bg-red-900"
          >
            🗑️ Reset local data
          </button>
        ) : (
          <div className="bg-red-900/50 rounded-xl p-4 flex flex-col gap-3">
            <p className="text-sm text-red-200">This wipes all local data. Are you sure?</p>
            <div className="flex gap-2">
              <button onClick={() => setShowResetConfirm(false)} className="flex-1 bg-slate-700 text-slate-200 py-2.5 rounded-xl text-sm font-medium">Cancel</button>
              <button onClick={resetLocal} className="flex-1 bg-red-600 text-white py-2.5 rounded-xl text-sm font-semibold">Reset</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
