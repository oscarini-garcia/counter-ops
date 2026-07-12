import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom'
import { useStore, useDispatch } from '../hooks/useStore.jsx'

export default function UndoToast({ onUndo }) {
  const { undoEntry } = useStore()
  const dispatch = useDispatch()
  const [remaining, setRemaining] = useState(3)

  useEffect(() => {
    if (!undoEntry) return
    setRemaining(3)
    const interval = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) { clearInterval(interval); dispatch({ type: 'CLEAR_UNDO' }); return 0 }
        return r - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [undoEntry?.expiresAt])

  if (!undoEntry) return null

  const count = undoEntry.entries?.length ?? 1

  return ReactDOM.createPortal(
    <div className="fixed bottom-20 left-0 right-0 flex justify-center px-4 z-50" style={{ bottom: 'calc(4rem + var(--safe-bottom))' }}>
      <div
        className="flex items-center gap-3 rounded-2xl px-4 py-3 shadow-xl max-w-sm w-full"
        style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}
      >
        <span className="text-sm flex-1" style={{ color: 'var(--c-text)' }}>
          {count > 1 ? `Constan en acta los ${count} ✓` : 'Consta en acta ✓'}
        </span>
        <button
          onClick={() => { onUndo?.(); dispatch({ type: 'UNDO_ENTRY' }) }}
          className="text-sm font-semibold px-2 py-1 rounded-lg active:opacity-70"
          style={{ color: 'var(--c-brand)' }}
        >
          Deshacer ({remaining}s)
        </button>
      </div>
    </div>,
    document.body
  )
}
