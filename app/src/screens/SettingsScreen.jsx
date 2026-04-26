import React, { useState } from 'react'
import { useStore, useDispatch } from '../hooks/useStore.jsx'

export default function SettingsScreen() {
  const { session, syncLog } = useStore()
  const dispatch = useDispatch()
  const [showResetConfirm, setShowResetConfirm] = useState(false)

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

      {/* Session name */}
      <div>
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Session name</label>
        <input
          type="text"
          value={session}
          onChange={e => dispatch({ type: 'SET_SESSION', session: e.target.value })}
          className="w-full bg-slate-700 text-slate-100 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
        />
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
            <div key={i} className="flex items-center gap-2 px-3 py-2 border-b border-slate-700 last:border-0">
              <span className="text-sm">{entry.status === 'ok' ? '✅' : entry.status === 'error' ? '❌' : '🔄'}</span>
              <span className="text-xs text-slate-400 flex-1 truncate">{entry.message ?? entry.status}</span>
              <span className="text-xs text-slate-500">{new Date(entry.ts).toLocaleTimeString()}</span>
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
