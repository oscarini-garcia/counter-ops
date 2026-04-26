import React from 'react'
import { useStore } from '../hooks/useStore.jsx'

export default function SyncBadge() {
  const { syncStatus } = useStore()

  function handleTap() {
    window.dispatchEvent(new CustomEvent('counter-ops:sync'))
  }

  const label = syncStatus === 'synced' ? '✓ Synced'
    : syncStatus === 'syncing' ? '↻ Sync…'
    : '⚠ Sync'

  const style = {
    display: 'flex', alignItems: 'center', gap: 4,
    padding: '4px 10px', borderRadius: 999,
    fontSize: 11, fontWeight: 700, cursor: 'pointer',
    border: 'none', background: 'transparent',
    color: syncStatus === 'synced' ? 'var(--c-success)'
      : syncStatus === 'syncing' ? 'var(--c-text-muted)'
      : 'var(--c-warning)',
  }

  return (
    <button onClick={handleTap} style={style} aria-label="Sync">
      {syncStatus === 'syncing' && (
        <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>↻</span>
      )}
      {label}
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </button>
  )
}
