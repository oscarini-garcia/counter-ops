import React from 'react'
import { useStore, useDispatch } from '../hooks/useStore.jsx'

export default function SyncBadge() {
  const { syncStatus, lastSyncAt } = useStore()
  const dispatch = useDispatch()

  function triggerSync() {
    dispatch({ type: 'SET_SYNC_STATUS', status: 'syncing' })
    window.dispatchEvent(new CustomEvent('counter-ops:sync'))
  }

  const label = syncStatus === 'synced'
    ? lastSyncAt ? `Synced ${formatRelative(lastSyncAt)}` : 'Synced'
    : syncStatus === 'syncing' ? 'Syncing…'
    : 'Sync'

  const icon = syncStatus === 'synced' ? '✅'
    : syncStatus === 'syncing' ? '🔄'
    : '⚠️'

  return (
    <button
      onClick={triggerSync}
      className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-slate-700 text-slate-200 active:bg-slate-600"
      aria-label="Sync now"
    >
      <span className={syncStatus === 'syncing' ? 'animate-spin inline-block' : ''}>{icon}</span>
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}

function formatRelative(isoStr) {
  const diff = Math.floor((Date.now() - new Date(isoStr).getTime()) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return `${Math.floor(diff / 3600)}h ago`
}
