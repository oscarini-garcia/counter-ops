import React, { useState } from 'react'
import ReactDOM from 'react-dom'
import { useStore, useDispatch } from '../hooks/useStore.jsx'

export default function SessionSwitcher() {
  const { sessions, activeSessionId, sessionSwitcherOpen, adminUnlocked } = useStore()
  const dispatch = useDispatch()
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [renamingId, setRenamingId] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  if (!sessionSwitcherOpen) return null

  function close() {
    dispatch({ type: 'SET_SESSION_SWITCHER', open: false })
    setCreating(false)
    setRenamingId(null)
    setDeleteConfirm(null)
  }

  function createSession(e) {
    e.preventDefault()
    if (!newName.trim()) return
    dispatch({ type: 'CREATE_SESSION', name: newName.trim() })
    setNewName('')
    setCreating(false)
    window.dispatchEvent(new CustomEvent('counter-ops:sync'))
  }

  function startRename(session) {
    setRenamingId(session.id)
    setRenameValue(session.name)
  }

  function saveRename(e) {
    e.preventDefault()
    if (!renameValue.trim()) return
    dispatch({ type: 'RENAME_SESSION', name: renameValue.trim() })
    setRenamingId(null)
    window.dispatchEvent(new CustomEvent('counter-ops:sync'))
  }

  function deleteSession(id) {
    if (deleteConfirm === id) {
      dispatch({ type: 'REMOVE_SESSION', id })
      setDeleteConfirm(null)
      window.dispatchEvent(new CustomEvent('counter-ops:sync'))
    } else {
      setDeleteConfirm(id)
      setTimeout(() => setDeleteConfirm(null), 3000)
    }
  }

  const sorted = [...sessions].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={close}>
      <div
        className="bg-slate-800 rounded-t-3xl w-full max-w-lg"
        style={{ paddingBottom: 'calc(1.5rem + var(--safe-bottom))' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-slate-600 rounded-full" />
        </div>

        <div className="px-5 pt-2 pb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-100">Sessions</h2>
            {adminUnlocked && (
              <button
                onClick={() => setCreating(c => !c)}
                className="text-sm text-indigo-400 font-semibold active:text-indigo-300"
              >
                + New
              </button>
            )}
          </div>

          {/* New session form — admin only */}
          {adminUnlocked && creating && (
            <form onSubmit={createSession} className="flex gap-2 mb-4">
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Session name (e.g. Menorca 2027)"
                className="flex-1 bg-slate-700 text-slate-100 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
              />
              <button type="submit" className="bg-indigo-500 text-white px-4 rounded-xl text-sm font-semibold active:bg-indigo-600">
                Create
              </button>
            </form>
          )}

          {/* Session list */}
          <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
            {sorted.map(s => (
              <div
                key={s.id}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition-colors ${
                  s.id === activeSessionId
                    ? 'bg-indigo-600/30 border border-indigo-500/50'
                    : 'bg-slate-700 active:bg-slate-600'
                }`}
              >
                {renamingId === s.id ? (
                  <form onSubmit={saveRename} className="flex gap-2 flex-1">
                    <input
                      type="text"
                      value={renameValue}
                      onChange={e => setRenameValue(e.target.value)}
                      className="flex-1 bg-slate-600 text-slate-100 rounded-lg px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                      autoFocus
                    />
                    <button type="submit" className="text-xs text-indigo-400 font-semibold px-2">Save</button>
                    <button type="button" onClick={() => setRenamingId(null)} className="text-xs text-slate-500 px-1">✕</button>
                  </form>
                ) : (
                  <>
                    <button
                      className="flex-1 text-left"
                      onClick={() => { dispatch({ type: 'SET_ACTIVE_SESSION', id: s.id }); close() }}
                    >
                      <div className="flex items-center gap-2">
                        {s.id === activeSessionId && <span className="text-indigo-400 text-xs">✓</span>}
                        <span className="text-sm font-medium text-slate-100">{s.name}</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {s.entries?.length ?? 0} entries · {new Date(s.createdAt).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </button>
                    {adminUnlocked && (
                      <>
                        <button onClick={() => startRename(s)} className="text-xs text-slate-400 active:text-slate-200 px-2 py-1 rounded-lg bg-slate-600">
                          Rename
                        </button>
                        {sessions.length > 1 && (
                          <button
                            onClick={() => deleteSession(s.id)}
                            className={`text-xs px-2 py-1 rounded-lg ${
                              deleteConfirm === s.id ? 'text-red-300 bg-red-900/50' : 'text-slate-400 bg-slate-600'
                            } active:text-red-200`}
                          >
                            {deleteConfirm === s.id ? 'Sure?' : '✕'}
                          </button>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
