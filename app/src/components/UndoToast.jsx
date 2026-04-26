import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom'
import { useStore, useDispatch } from '../hooks/useStore.jsx'

export default function UndoToast() {
  const { undoEntry } = useStore()
  const dispatch = useDispatch()
  const [remaining, setRemaining] = useState(10)

  useEffect(() => {
    if (!undoEntry) return
    setRemaining(10)
    const interval = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) { clearInterval(interval); dispatch({ type: 'CLEAR_UNDO' }); return 0 }
        return r - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [undoEntry?.entry?.id])

  if (!undoEntry) return null

  const { entry } = undoEntry

  return ReactDOM.createPortal(
    <div className="fixed bottom-20 left-0 right-0 flex justify-center px-4 z-50" style={{ bottom: 'calc(4rem + var(--safe-bottom))' }}>
      <div className="flex items-center gap-3 bg-slate-700 rounded-2xl px-4 py-3 shadow-xl max-w-sm w-full">
        <span className="text-sm text-slate-200 flex-1">Entry logged ✓</span>
        <button
          onClick={() => dispatch({ type: 'UNDO_ENTRY' })}
          className="text-sm font-semibold text-indigo-400 active:text-indigo-300 px-2 py-1 rounded-lg"
        >
          Undo ({remaining}s)
        </button>
      </div>
    </div>,
    document.body
  )
}
