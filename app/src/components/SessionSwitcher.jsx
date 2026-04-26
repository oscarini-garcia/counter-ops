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
        className="rounded-t-3xl w-full max-w-lg"
        style={{
          background: 'var(--c-surface)',
          paddingBottom: 'calc(1.5rem + var(--safe-bottom))',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--c-border)' }} />
        </div>

        <div className="px-5 pt-2 pb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold" style={{ color: 'var(--c-text)' }}>Sessions</h2>
            {adminUnlocked && (
              <button
                onClick={() => setCreating(c => !c)}
                className="text-sm font-semibold active:opacity-70"
                style={{ color: 'var(--c-brand)' }}
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
                className="flex-1 rounded-xl px-3 py-2.5 text-sm outline-none"
                style={{
                  background: 'var(--c-surface-2)',
                  border: '1.5px solid var(--c-border)',
                  color: 'var(--c-text)',
                }}
                autoFocus
              />
              <button
                type="submit"
                className="px-4 rounded-xl text-sm font-semibold active:opacity-80"
                style={{ background: 'var(--c-brand)', color: '#fff' }}
              >
                Create
              </button>
            </form>
          )}

          {/* Session list */}
          <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
            {sorted.map(s => (
              <div
                key={s.id}
                className="flex items-center gap-3 rounded-2xl px-4 py-3 transition-colors"
                style={
                  s.id === activeSessionId
                    ? { background: 'var(--c-surface-2)', border: '1.5px solid var(--c-brand)', borderColor: 'var(--c-brand)' }
                    : { background: 'var(--c-surface-2)', border: '1px solid var(--c-border)' }
                }
              >
                {renamingId === s.id ? (
                  <form onSubmit={saveRename} className="flex gap-2 flex-1">
                    <input
                      type="text"
                      value={renameValue}
                      onChange={e => setRenameValue(e.target.value)}
                      className="flex-1 rounded-lg px-2 py-1 text-sm outline-none"
                      style={{
                        background: 'var(--c-surface)',
                        border: '1px solid var(--c-border)',
                        color: 'var(--c-text)',
                      }}
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="text-xs font-semibold px-2"
                      style={{ color: 'var(--c-brand)' }}
                    >Save</button>
                    <button
                      type="button"
                      onClick={() => setRenamingId(null)}
                      className="text-xs px-1"
                      style={{ color: 'var(--c-text-muted)' }}
                    >✕</button>
                  </form>
                ) : (
                  <>
                    <button
                      className="flex-1 text-left"
                      onClick={() => { dispatch({ type: 'SET_ACTIVE_SESSION', id: s.id }); close() }}
                    >
                      <div className="flex items-center gap-2">
                        {s.id === activeSessionId && (
                          <span className="text-xs" style={{ color: 'var(--c-brand)' }}>✓</span>
                        )}
                        <span className="text-sm font-medium" style={{ color: 'var(--c-text)' }}>{s.name}</span>
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--c-text-muted)' }}>
                        {s.entries?.length ?? 0} entries · {new Date(s.createdAt).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </button>
                    {adminUnlocked && (
                      <>
                        <button
                          onClick={() => startRename(s)}
                          className="text-xs px-2 py-1 rounded-lg active:opacity-70"
                          style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', color: 'var(--c-text-muted)' }}
                        >
                          Rename
                        </button>
                        {sessions.length > 1 && (
                          <button
                            onClick={() => deleteSession(s.id)}
                            className="text-xs px-2 py-1 rounded-lg active:opacity-70"
                            style={
                              deleteConfirm === s.id
                                ? { background: 'rgba(239,68,68,0.12)', color: 'var(--c-danger)', border: '1px solid rgba(239,68,68,0.3)' }
                                : { background: 'var(--c-surface)', border: '1px solid var(--c-border)', color: 'var(--c-text-muted)' }
                            }
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
